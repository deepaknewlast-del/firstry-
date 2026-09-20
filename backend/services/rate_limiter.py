"""Upstash Redis-backed rate limiting via its REST API."""
import datetime
import hashlib
import logging

import httpx
from fastapi import HTTPException

from config import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()

FREE_TIER_LIMIT = 3  # 3 total generations, lifetime
PAID_TIER_MONTHLY = 200  # Abuse-protection cap for paid users


def _redis_configured() -> bool:
    return bool(settings.UPSTASH_REDIS_REST_URL and settings.UPSTASH_REDIS_REST_TOKEN)


def _redis_headers() -> dict[str, str]:
    return {"Authorization": f"Bearer {settings.UPSTASH_REDIS_REST_TOKEN}"}


def _redis_base_url() -> str:
    return settings.UPSTASH_REDIS_REST_URL.rstrip("/")


async def check_rate_limit(user_id: str, is_paid: bool) -> dict:
    """Free users: 3 total bulletins ever. Paid users: 200/month.

    Uses Upstash Redis via REST API. The counter is decremented when a
    request is rejected so the user isn't charged a generation they didn't
    receive.
    """
    if not _redis_configured():
        # Redis not configured — fail open rather than blocking everyone,
        # Supabase-backed totals still gate the free tier in the router.
        return {"used": 0, "limit": FREE_TIER_LIMIT if not is_paid else PAID_TIER_MONTHLY}

    headers = _redis_headers()
    base_url = _redis_base_url()

    if is_paid:
        month_key = f"rate:{user_id}:{datetime.datetime.now().strftime('%Y-%m')}"
        limit = PAID_TIER_MONTHLY
    else:
        month_key = f"rate_free:{user_id}"
        limit = FREE_TIER_LIMIT

    try:
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
    except (httpx.HTTPError, ValueError) as e:
        # Redis configured but unreachable/misconfigured — fail open rather
        # than 500-ing real users. The durable DB counter still gates the
        # free tier, and the monthly cap is abuse protection, not billing.
        logger.warning("Redis rate limiter unavailable (%s); failing open", e)
        return {"used": 0, "limit": limit}

    return {"used": current, "limit": limit}


async def check_ip_rate_limit(ip_address: str, action: str, limit: int, window_seconds: int) -> dict:
    """Throttle expensive actions by IP address as a spend ceiling."""
    if not _redis_configured():
        return {"used": 0, "limit": limit}

    safe_action = "".join(ch for ch in action if ch.isalnum() or ch in ("_", "-"))[:32]
    ip_hash = hashlib.sha256(ip_address.encode("utf-8")).hexdigest()[:32]
    key = f"ip_rate:{safe_action}:{ip_hash}"
    headers = _redis_headers()
    base_url = _redis_base_url()

    try:
        async with httpx.AsyncClient() as client:
            incr = await client.post(f"{base_url}/incr/{key}", headers=headers)
            incr.raise_for_status()
            current = incr.json().get("result", 0)

            if current == 1:
                await client.post(f"{base_url}/expire/{key}/{window_seconds}", headers=headers)

            if current > limit:
                await client.post(f"{base_url}/decr/{key}", headers=headers)
                raise HTTPException(
                    status_code=429,
                    detail={
                        "error": "ip_rate_limited",
                        "message": "Too many requests from this network. Please try again later.",
                        "limit": limit,
                    },
                )
    except (httpx.HTTPError, ValueError) as e:
        # Same fail-open policy: a Redis outage must never block generation.
        logger.warning("Redis IP limiter unavailable (%s); failing open", e)
        return {"used": 0, "limit": limit}

    return {"used": current, "limit": limit}
