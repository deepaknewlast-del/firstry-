from fastapi import APIRouter, Depends, Header, HTTPException, Request

from db import supabase_admin
from middleware.auth import verify_token
from services.email_service import send_upgrade_confirmation
from services.stripe_service import (
    create_checkout_session,
    create_portal_session,
    verify_webhook,
)

router = APIRouter()


@router.post("/checkout")
async def create_checkout(user: dict = Depends(verify_token)):
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
async def billing_portal(user: dict = Depends(verify_token)):
    profile = (
        supabase_admin.table("profiles")
        .select("stripe_customer_id")
        .eq("id", user["user_id"])
        .single()
        .execute()
    )
    customer_id = profile.data.get("stripe_customer_id") if profile.data else None
    if not customer_id:
        raise HTTPException(status_code=400, detail="No billing profile yet — upgrade first")

    portal_url = create_portal_session(customer_id)
    return {"portal_url": portal_url}
