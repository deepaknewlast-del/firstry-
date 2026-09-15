"""Stripe subscription logic — checkout sessions, portal, webhooks."""
import os

import stripe

from config import get_settings

settings = get_settings()
stripe.api_key = settings.STRIPE_SECRET_KEY
WEBHOOK_SECRET = settings.STRIPE_WEBHOOK_SECRET


def create_checkout_session(customer_id: str, user_id: str) -> str:
    session = stripe.checkout.Session.create(
        customer=customer_id,
        payment_method_types=["card"],
        mode="subscription",
        line_items=[{"price": settings.STRIPE_PRICE_ID, "quantity": 1}],
        success_url=f"{settings.FRONTEND_URL}/dashboard?upgraded=true",
        cancel_url=f"{settings.FRONTEND_URL}/pricing",
        subscription_data={"metadata": {"supabase_user_id": user_id}},
    )
    return session.url


def create_portal_session(customer_id: str) -> str:
    session = stripe.billing_portal.Session.create(
        customer=customer_id,
        return_url=f"{settings.FRONTEND_URL}/account",
    )
    return session.url


def verify_webhook(payload: bytes, signature: str) -> dict:
    return stripe.Webhook.construct_event(payload, signature, WEBHOOK_SECRET)
