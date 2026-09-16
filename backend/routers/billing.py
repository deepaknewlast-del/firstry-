from datetime import datetime
import logging

from fastapi import APIRouter, Depends, Header, HTTPException, Request

from config import get_settings
from db import supabase_admin
from middleware.auth import verify_token
from middleware.security import get_client_ip
from services.email_service import send_upgrade_confirmation, send_upgrade_interest
from services.paddle_service import (
    WebhookSignatureError,
    grants_paid_access,
    link_customer,
    resolve_user_id,
    verify_webhook_signature,
)
from services.rate_limiter import check_ip_rate_limit
from services.stripe_service import (
    create_checkout_session,
    create_portal_session,
    verify_webhook,
)

router = APIRouter()
settings = get_settings()


@router.post("/checkout")
async def create_checkout(request: Request, user: dict = Depends(verify_token)):
    await check_ip_rate_limit(
        get_client_ip(request),
        "billing_checkout",
        settings.IP_BILLING_HOURLY_LIMIT,
        3600,
    )
    user_id = user["user_id"]

    profile = (
        supabase_admin.table("profiles")
        .select("stripe_customer_id, email")
        .eq("id", user_id)
        .single()
        .execute()
    )
    if not profile.data:
        raise HTTPException(status_code=404, detail="Profile not found")

    customer_id = profile.data.get("stripe_customer_id")
    if not customer_id:
        import stripe

        from config import get_settings

        stripe.api_key = get_settings().STRIPE_SECRET_KEY
        customer = stripe.Customer.create(
            email=profile.data["email"],
            metadata={"supabase_user_id": user_id},
        )
        customer_id = customer.id
        supabase_admin.table("profiles").update({"stripe_customer_id": customer_id}).eq("id", user_id).execute()

    checkout_url = create_checkout_session(customer_id, user_id)
    return {"checkout_url": checkout_url}


@router.post("/interest")
async def request_upgrade_interest(request: Request, user: dict = Depends(verify_token)):
    """Record lightweight upgrade intent while checkout is intentionally deferred."""
    await check_ip_rate_limit(
        get_client_ip(request),
        "upgrade_interest",
        settings.IP_BILLING_HOURLY_LIMIT,
        3600,
    )
    profile = (
        supabase_admin.table("profiles")
        .select("email, church_name")
        .eq("id", user["user_id"])
        .single()
        .execute()
    )
    if not profile.data:
        raise HTTPException(status_code=404, detail="Profile not found")

    await send_upgrade_interest(profile.data["email"], profile.data.get("church_name") or "")
    return {"ok": True}


@router.post("/webhook")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None)):
    """Handle Stripe webhooks — keep subscription status in sync with Supabase."""
    payload = await request.body()

    try:
        event = verify_webhook(payload, stripe_signature)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid signature")

    event_type = event["type"]
    sub = event["data"]["object"]

    if event_type == "customer.subscription.updated":
        user_id = sub.get("metadata", {}).get("supabase_user_id")
        if user_id:
            supabase_admin.table("profiles").update(
                {
                    "subscription_status": sub["status"],
                    "subscription_id": sub["id"],
                }
            ).eq("id", user_id).execute()

            # Welcome email the first time a subscription goes active.
            if sub.get("status") == "active" and sub.get("previous_attributes", {}).get("status") != "active":
                prof = (
                    supabase_admin.table("profiles")
                    .select("email, church_name")
                    .eq("id", user_id)
                    .single()
                    .execute()
                )
                if prof.data:
                    await send_upgrade_confirmation(prof.data["email"], prof.data.get("church_name") or "")

    elif event_type == "customer.subscription.deleted":
        user_id = sub.get("metadata", {}).get("supabase_user_id")
        if user_id:
            supabase_admin.table("profiles").update(
                {
                    "subscription_status": "canceled",
                    "subscription_id": None,
                }
            ).eq("id", user_id).execute()

    return {"received": True}


@router.post("/portal")
async def billing_portal(request: Request, user: dict = Depends(verify_token)):
    """Paddle customer portal (self-service: payment method, cancel, invoices).

    The customer id is resolved server-side from the authenticated session's
    profile row — never accepted from the client."""
    await check_ip_rate_limit(
        get_client_ip(request),
        "billing_portal",
        settings.IP_BILLING_HOURLY_LIMIT,
        3600,
    )
    profile = (
        supabase_admin.table("profiles")
        .select("paddle_customer_id, stripe_customer_id")
        .eq("id", user["user_id"])
        .single()
        .execute()
    )
    customer_id = profile.data.get("paddle_customer_id") if profile.data else None
    if not customer_id:
        raise HTTPException(
            status_code=400,
            detail="No billing profile yet — upgrade first, then manage billing here",
        )

    from services.paddle_service import create_portal_session as create_paddle_portal

    try:
        portal_url = await create_paddle_portal(customer_id)
    except RuntimeError:
        raise HTTPException(status_code=502, detail="Could not open the billing portal — try again shortly")
    return {"portal_url": portal_url}


@router.get("/config/country")
async def get_client_country(request: Request):
    # Common headers set by Vercel, Cloudflare, etc.
    country = request.headers.get("x-vercel-ip-country") or request.headers.get("cf-ipcountry")
    return {"countryCode": country}


# ---------------------------------------------------------------------------
# Paddle Billing — fulfillment & provisioning (server-side only)
#
# Destination URL in Paddle (Developer tools > Notifications):
#   https://<your-host>/api/billing/webhooks/paddle
# Select at least: transaction.completed, subscription.created/updated/canceled,
# customer.created/updated. Deliveries are at-least-once and can arrive out of
# order — handlers below are idempotent and drop stale (older) duplicates.
# ---------------------------------------------------------------------------

# profiles.subscription_status CHECK-constrained values, mapped from Paddle
# statuses. trialing grants access, so it maps to 'active'; paused and past_due
# block access without cancelling.
_PADDLE_STATUS_MAP = {
    "active": "active",
    "trialing": "active",
    "past_due": "past_due",
    "paused": "past_due",
    "canceled": "canceled",
}


def _parse_ts(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def _first_item_ids(data: dict) -> tuple[str | None, str | None]:
    items = data.get("items") or []
    if not items:
        return None, None
    price = (items[0].get("price") or {}).get("id")
    product = (items[0].get("product") or {}).get("id")
    return price, product


def _custom_user_id(*entities: object) -> str | None:
    for entity in entities:
        if not isinstance(entity, dict):
            continue
        custom = entity.get("custom_data")
        if isinstance(custom, dict) and custom.get("user_id"):
            return str(custom["user_id"])
    return None


async def _set_profile_status(user_id: str, paddle_status: str) -> None:
    """Keep the frontend's paid gate (profiles.subscription_status) in sync."""
    mapped = _PADDLE_STATUS_MAP.get(paddle_status)
    if not mapped:
        return
    supabase_admin.table("profiles").update({"subscription_status": mapped}).eq("id", user_id).execute()


async def _handle_subscription(data: dict, occurred_at: datetime | None) -> None:
    """subscription.created / updated / canceled — mirror + grant/revoke access."""
    subscription_id = data["id"]
    customer_id = data.get("customer_id", "")
    status = data.get("status", "")
    price_id, product_id = _first_item_ids(data)

    scheduled = data.get("scheduled_change") or {}
    scheduled_action = scheduled.get("action")
    scheduled_at = _parse_ts(scheduled.get("effective_at"))

    # Idempotency + out-of-order guard: read the mirror row first.
    existing_res = (
        supabase_admin.table("subscriptions")
        .select("user_id, status, occurred_at")
        .eq("subscription_id", subscription_id)
        .maybe_single()
        .execute()
    )
    existing = existing_res.data if existing_res and existing_res.data else None
    if existing and occurred_at:
        prior_ts = _parse_ts(existing.get("occurred_at"))
        if prior_ts and occurred_at < prior_ts:
            return  # stale, out-of-order delivery — the newer state is already stored

    user_id = _custom_user_id(data) or await resolve_user_id(data)

    # 1. Mirror the subscription (upsert keyed on the Paddle subscription id).
    row = {
        "subscription_id": subscription_id,
        "customer_id": customer_id,
        "status": status,
        "price_id": price_id,
        "product_id": product_id,
        "scheduled_change_action": scheduled_action,
        "scheduled_change_at": scheduled_at.isoformat() if scheduled_at else None,
        "occurred_at": occurred_at.isoformat() if occurred_at else None,
    }
    if user_id:
        row["user_id"] = user_id
    supabase_admin.table("subscriptions").upsert(row, on_conflict="subscription_id").execute()

    # 2. Link the Paddle customer to the app user.
    await link_customer(customer_id, user_id, None)

    # 3. Grant/revoke access for the user (the frontend gate).
    prior_status = existing.get("status") if existing else None
    if user_id:
        await _set_profile_status(user_id, status)

        # Welcome email the first time access is granted (never re-sent on
        # routine updates, idempotent because prior status is read first).
        if grants_paid_access({"status": status}) and not grants_paid_access({"status": prior_status or ""}):
            prof = (
                supabase_admin.table("profiles")
                .select("email, church_name")
                .eq("id", user_id)
                .single()
                .execute()
            )
            if prof.data:
                try:
                    await send_upgrade_confirmation(prof.data["email"], prof.data.get("church_name") or "")
                except Exception:
                    pass  # email must never fail the webhook


async def _handle_customer(data: dict, occurred_at: datetime | None) -> None:
    """customer.created / updated — link the Paddle customer to the app user."""
    customer_id = data["id"]
    user_id = _custom_user_id(data) or await resolve_user_id({"customer_id": customer_id})
    await link_customer(customer_id, user_id, data.get("email"))


async def _handle_transaction(data: dict, occurred_at: datetime | None) -> None:
    """transaction.completed — link the customer and provision access.

    May arrive before subscription.created: if a paid price was purchased and
    the subscription mirror doesn't contradict it, grant access so the user is
    never stuck on free because of event ordering."""
    if data.get("status") != "completed":
        return
    customer_id = data.get("customer_id", "")
    subscription_id = data.get("subscription_id")
    user_id = _custom_user_id(data) or await resolve_user_id(data)
    await link_customer(customer_id, user_id, None)
    if not user_id:
        return

    from services.paddle_service import is_paid_price

    bought_paid = any(
        is_paid_price((item.get("price") or {}).get("id")) for item in (data.get("items") or [])
    )
    if not bought_paid:
        return

    # Don't override a mirrored subscription that says otherwise (e.g. a
    # transaction retried against a since-canceled subscription).
    if subscription_id:
        sub_res = (
            supabase_admin.table("subscriptions")
            .select("status")
            .eq("subscription_id", subscription_id)
            .maybe_single()
            .execute()
        )
        sub_status = (sub_res.data or {}).get("status") if sub_res and sub_res.data else None
        if sub_status and not grants_paid_access({"status": sub_status}):
            return

    prof_res = (
        supabase_admin.table("profiles")
        .select("subscription_status")
        .eq("id", user_id)
        .single()
        .execute()
    )
    if (prof_res.data or {}).get("subscription_status") != "active":
        await _set_profile_status(user_id, "active")


_PADDLE_HANDLERS = {
    "subscription.created": _handle_subscription,
    "subscription.updated": _handle_subscription,
    "subscription.canceled": _handle_subscription,
    "customer.created": _handle_customer,
    "customer.updated": _handle_customer,
    "transaction.completed": _handle_transaction,
}


@router.post("/webhooks/paddle")
async def paddle_webhook(
    request: Request,
    paddle_signature: str = Header(None),
):
    """Receive Paddle webhook deliveries.

    Verifies the signature over the RAW body first; verification failures
    return non-2xx so Paddle retries instead of treating us as healthy.
    Unsubscribed/unrouted event types are acknowledged with 200 and ignored.
    """
    raw_body = await request.body()
    try:
        event = verify_webhook_signature(raw_body, paddle_signature)
    except WebhookSignatureError:
        raise HTTPException(status_code=403, detail="Invalid webhook signature")

    event_type = event.get("event_type", "")
    handler = _PADDLE_HANDLERS.get(event_type)
    if handler is None:
        return {"received": True, "ignored": event_type}

    occurred_at = _parse_ts(event.get("occurred_at"))
    try:
        await handler(event.get("data") or {}, occurred_at)
    except Exception:
        # Log the full traceback, then return non-2xx so Paddle retries
        # the delivery (at-least-once semantics).
        logging.getLogger(__name__).exception("Paddle webhook handler failed for %s", event_type)
        raise HTTPException(status_code=500, detail="Webhook handler failed")

    return {"received": True}
