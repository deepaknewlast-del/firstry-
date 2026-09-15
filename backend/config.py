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

    # Stripe
    STRIPE_SECRET_KEY: str = os.getenv("STRIPE_SECRET_KEY", "")
    STRIPE_WEBHOOK_SECRET: str = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    STRIPE_PRICE_ID: str = os.getenv("STRIPE_PRICE_ID", "")

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


@lru_cache
def get_settings() -> Settings:
    return Settings()
