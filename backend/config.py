"""Secrets and configuration — loaded from backend/.env (never committed)."""
import os
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()


class Settings:
    # AI — server side only, never exposed to the frontend.
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    # Supabase
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

    # Stripe (legacy — being replaced by Paddle)
    STRIPE_SECRET_KEY: str = os.getenv("STRIPE_SECRET_KEY", "")
    STRIPE_WEBHOOK_SECRET: str = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    STRIPE_PRICE_ID: str = os.getenv("STRIPE_PRICE_ID", "")

    # Paddle Billing — fulfillment & provisioning
    # API key + which environment it belongs to. The signing secret is a
    # notification-destination secret (pdl_ntfset_...), NOT the API key.
    PADDLE_API_KEY: str = os.getenv("PADDLE_API_KEY", "")
    PADDLE_ENVIRONMENT: str = os.getenv("PADDLE_ENVIRONMENT", "sandbox")  # sandbox | production
    PADDLE_WEBHOOK_SECRET: str = os.getenv("PADDLE_WEBHOOK_SECRET", "")
    PADDLE_PRICE_MONTHLY: str = os.getenv("PADDLE_PRICE_MONTHLY", "")
    PADDLE_PRICE_ANNUAL: str = os.getenv("PADDLE_PRICE_ANNUAL", "")

    # Direct Postgres connection — used by the local webhook/signature test
    # suite (scripts/test_webhooks.py). Optional; leave empty to skip those tests.
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")

    # Upstash Redis (REST)
    UPSTASH_REDIS_REST_URL: str = os.getenv("UPSTASH_REDIS_REST_URL", "")
    UPSTASH_REDIS_REST_TOKEN: str = os.getenv("UPSTASH_REDIS_REST_TOKEN", "")

    # App
    ALLOWED_ORIGINS: list[str] = [
        o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",") if o.strip()
    ]
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    MAX_REQUEST_BYTES: int = int(os.getenv("MAX_REQUEST_BYTES", "131072"))
    IP_GENERATION_DAILY_LIMIT: int = int(os.getenv("IP_GENERATION_DAILY_LIMIT", "20"))
    IP_BILLING_HOURLY_LIMIT: int = int(os.getenv("IP_BILLING_HOURLY_LIMIT", "10"))

    # Resend email
    RESEND_API_KEY: str = os.getenv("RESEND_API_KEY", "")

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def paddle_api_base(self) -> str:
        return (
            "https://api.paddle.com"
            if self.PADDLE_ENVIRONMENT == "production"
            else "https://sandbox-api.paddle.com"
        )

    @property
    def paddle_price_ids(self) -> set[str]:
        """Price IDs that map to a paid plan (monthly + annual)."""
        return {p for p in (self.PADDLE_PRICE_MONTHLY, self.PADDLE_PRICE_ANNUAL) if p}


@lru_cache
def get_settings() -> Settings:
    return Settings()
