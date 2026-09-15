class AuthUser(dict):
    """Authenticated user context returned by middleware.auth.verify_token."""

    user_id: str
    email: str
