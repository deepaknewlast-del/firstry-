import os

from supabase import Client, create_client

from config import get_settings

_settings = get_settings()


def get_supabase_admin() -> Client:
    """Service-role Supabase client (server only — bypasses RLS)."""
    return create_client(_settings.SUPABASE_URL, _settings.SUPABASE_SERVICE_ROLE_KEY)


supabase_admin = get_supabase_admin()
