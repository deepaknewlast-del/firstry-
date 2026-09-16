"""Paddle Billing — signature verification, access rules, portal sessions.

Server-side only. Env: PADDLE_API_KEY, PADDLE_ENVIRONMENT, PADDLE_WEBHOOK_SECRET.
The webhook signing secret (pdl_ntfset_...) is the notification-destination
secret from Developer tools > Notifications — never the API key.
"""
import hashlib
import hmac
import json
import logging
import time
from typing import Any

import httpx

from config import get_settings
from db import supabase_admin

logger = logging.getLogger(__name__)
settings = get_settings()

# Paddle webhook signatures are only fresh for this long (their docs' value).
MAX_SIGNATURE_AGE_SECONDS = 5

# Statuses that grant paid access. `trialing` counts on purpose; access is NOT
# revoked merely because a scheduled_change (cancel/pause) exists — only the
# actual status transition revokes it.
ACCESS_GRANTING_STATUSES = {"active", "trialing"}


class WebhookSignatureError(Exception):
    """Raised when a Paddle webhook delivery fails signature verification."""


# ---------------------------------------------------------------------------
# Part 1 — signature verification (raw body only)
# ---------------------------------------------------------------------------

def verify_webhook_signature(raw_body: bytes, signature_header: str | None) -> dict[str, Any]:
    """Verify a Paddle webhook delivery and return the parsed event.

    Paddle scheme (Billing docs): the header is `ts=<unix>;h1=<hexdigest>`;
    the digest is HMAC-SHA256 over the bytes `f"{ts}:{raw_body}"` keyed with
    the notification signing secret. The RAW body must be used — a re-serialized
    JSON body fails verification.
    """
    if not signature_header:
        raise WebhookSignatureError("Missing Paddle-Signature header")
    if not settings.PADDLE_WEBHOOK_SECRET:
        logger.error("PADDLE_WEBHOOK_SECRET is not configured — cannot verify webhooks")
        raise WebhookSignatureError("Webhook secret not configured")

    parts: dict[str, str] = {}
    for chunk in signature_header.split(";"):
        key, _, value = chunk.partition("=")
        parts[key.strip()] = value.strip()

    ts, h1 = parts.get("ts"), parts.get("h1")
    if not ts or not h1:
        raise WebhookSignatureError("Malformed Paddle-Signature header")

    # Replay window.
    try:
        age = abs(time.time() - int(ts))
    except ValueError:
        raise WebhookSignatureError("Invalid timestamp in signature")
    if age > MAX_SIGNATURE_AGE_SECONDS:
        raise WebhookSignatureError("Signature timestamp outside allowed window")

    expected = hmac.new(
        settings.PADDLE_WEBHOOK_SECRET.encode(),
        f"{ts}:".encode() + raw_body,
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(expected, h1):
        raise WebhookSignatureError("Signature mismatch")

    try:
        event = json.loads(raw_body)
    except json.JSONDecodeError:
        raise WebhookSignatureError("Signed body is not valid JSON")
    if not isinstance(event, dict) or not event.get("event_type"):
        raise WebhookSignatureError("Signed payload is not a Paddle event")
    return event


# ---------------------------------------------------------------------------
# Part 2 — access decision
# ---------------------------------------------------------------------------

def grants_paid_access(sub: dict[str, Any]) -> bool:
    """Does this subscription row currently grant paid access?

    Mirrors the DB `subscriptions` row shape. A scheduled cancel/pause does not
    revoke access; only the real status (`canceled`, etc.) does.
    """
    return sub.get("status") in ACCESS_GRANTING_STATUSES


def is_paid_price(price_id: str | None) -> bool:
    """True if the price is one of the configured paid plan prices."""
    return bool(price_id) and price_id in settings.paddle_price_ids


# ---------------------------------------------------------------------------
# Customer linkage
# ---------------------------------------------------------------------------

async def resolve_user_id(payload: dict[str, Any]) -> str | None:
    """Best-effort: which app user does this event belong to?

    Order: explicit custom_data (set at checkout) -> existing subscriptions
    mirror row -> profiles.paddle_customer_id.
    """
    # 1. custom_data is passed through by Paddle on checkout-created entities.
    for entity in (payload.get("subscription"), payload.get("customer"), payload.get("transaction")):
        custom = (entity or {}).get("custom_data") or {}
        uid = custom.get("user_id") if isinstance(custom, dict) else None
        if uid:
            return uid

    # 2/3. Existing mirror rows.
    customer_id = payload.get("customer_id")
    if customer_id:
        row = (
            supabase_admin.table("profiles")
            .select("id")
            .eq("paddle_customer_id", customer_id)
            .maybe_single()
            .execute()
        )
        if row and row.data:
            return row.data["id"]

    subscription_id = payload.get("subscription_id") or (
        payload.get("subscription") or {}
    ).get("id")
    if subscription_id:
        row = (
            supabase_admin.table("subscriptions")
            .select("user_id")
            .eq("subscription_id", subscription_id)
            .maybe_single()
            .execute()
        )
        if row and row.data and row.data.get("user_id"):
            return row.data["user_id"]

    return None


async def link_customer(customer_id: str, user_id: str | None, email: str | None) -> None:
    """Attach a Paddle customer id to the app user (additive, never overwrites
    a different existing link)."""
    if not user_id:
        return
    row = (
        supabase_admin.table("profiles")
        .select("paddle_customer_id")
        .eq("id", user_id)
        .maybe_single()
        .execute()
    )
    existing = (row.data or {}).get("paddle_customer_id") if row and row.data else None
    if existing and existing != customer_id:
        logger.warning(
            "User %s already linked to Paddle customer %s; ignoring new link %s",
            user_id, existing, customer_id,
        )
        return
    if existing == customer_id:
        return
    update: dict[str, Any] = {"paddle_customer_id": customer_id}
    if email:
        update["email"] = email
    supabase_admin.table("profiles").update(update).eq("id", user_id).execute()


# ---------------------------------------------------------------------------
# Part 3 — customer portal session
# ---------------------------------------------------------------------------

async def create_portal_session(customer_id: str) -> str:
    """Mint a Paddle-hosted customer portal session URL."""
    if not settings.PADDLE_API_KEY:
        raise RuntimeError("PADDLE_API_KEY is not configured")
    async with httpx.AsyncClient(timeout=15) as client:
        res = await client.post(
            f"{settings.paddle_api_base}/customers/{customer_id}/portal-sessions",
            headers={
                "Authorization": f"Bearer {settings.PADDLE_API_KEY}",
                "Content-Type": "application/json",
            },
            json={},
        )
        if res.status_code >= 400:
            logger.error("Paddle portal session failed: %s %s", res.status_code, res.text)
            raise RuntimeError("Paddle portal session could not be created")
        data = res.json()["data"]
        return data["urls"]["general"]["overview"]
