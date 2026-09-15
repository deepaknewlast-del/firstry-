"""Upstash Redis-backed rate limiting via its REST API."""
import datetime

import httpx
from fastapi import HTTPException

from config import get_settings

settings = get_settings()

FREE_TIER_LIMIT = 3  # 3 total generations, lifetime
PAID_TIER_MONTHLY = 200  # Abuse-protection cap for paid users


async def check_rate_limit(user_id: str, is_paid: bool) -> dict:
    """Free users: 3 total bulletins ever. Paid users: 200/month.

    Uses Upstash Redis via REST API. The counter is decremented when a
    request is rejected so the user isn't charged a generation they didn't
    receive.
    """
    if not settings.UPSTASH_REDIS_REST_URL or not settings.UPSTASH_REDIS_REST_TOKEN:
        # Redis not configured — fail open rather than blocking everyone,
        # Supabase-backed totals still gate the free tier in the router.
        return {"used": 0, "limit": FREE_TIER_LIMIT if not is_paid else PAID_TIER_MONTHLY}

    headers = {"Authorization": f"Bearer {settings.UPSTASH_REDIS_REST_TOKEN}"}
    base_url = settings.UPSTASH_REDIS_REST_URL.rstrip("/")

    if is_paid:
        month_key = f"rate:{user_id}:{datetime.datetime.now().strftime('%Y-%m')}"
        limit = PAID_TIER_MONTHLY
    else:
        month_key = f"rate_free:{user_id}"
        limit = FREE_TIER_LIMIT

    async with httpx.AsyncClient() as client:
        incr = await client.post(f"{base_url}/incr/{month_key}", headers=headers)
        incr.raise_for_status()
        current = incr.json().get("result", 0)

        if current == 1 and is_paid:
            # Set a 60-day expiry on the first use of the monthly window.
            await client.post(f"{base_url}/expire/{month_key}/5184000", headers=headers)

        if current > limit:
            await client.post(f"{base_url}/decr/{month_key}", headers=headers)
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "limit_reached",
                    "message": "Free tier limit reached. Upgrade to continue." if not is_paid else "Monthly limit reached. Try again next month.",
                    "limit": limit,
                    "used": current - 1,
                },
            )

    return {"used": current, "limit": limit}
