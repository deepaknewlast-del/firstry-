import jwt
from fastapi import Depends, Header, HTTPException

from db import supabase_admin

_MAX_TOKEN_CHARS = 4096


def _structurally_valid_jwt(token: str) -> bool:
    """Cheap local gate before the Supabase Auth round-trip.

    A JWT is three dot-separated base64url segments. Anything else can never
    authenticate and is rejected here, so malformed garbage costs no upstream
    API call (unauthenticated endpoints must not be an amplification vector
    against Supabase Auth). Signature verification itself still happens
    server-side at Supabase — this checks shape only, never trust.
    """
    if not token or len(token) > _MAX_TOKEN_CHARS:
        return False
    parts = token.split(".")
    if len(parts) != 3 or any(not part for part in parts):
        return False
    try:
        jwt.get_unverified_header(token)
    except jwt.PyJWTError:
        return False
    return True


async def verify_token(authorization: str = Header(...)) -> dict:
    """Verify the Supabase JWT on every protected endpoint."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    token = authorization.split(" ", 1)[1]
    if not _structurally_valid_jwt(token):
        raise HTTPException(status_code=401, detail="Invalid token")

    try:
        payload = jwt.decode(token, options={"verify_signature": False})
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")

        # Confirm the token is valid and active against Supabase Auth.
        user = supabase_admin.auth.get_user(token)
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="User not found")

        email_confirmed_at = getattr(user.user, "email_confirmed_at", None) or getattr(
            user.user, "confirmed_at", None
        )

        verified_user_id = str(getattr(user.user, "id", None) or user_id)
        if verified_user_id != user_id:
            raise HTTPException(status_code=401, detail="Invalid token")

        return {
            "user_id": verified_user_id,
            "email": user.user.email,
            "email_verified": bool(email_confirmed_at),
        }
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Unauthorized")


async def require_verified_user(user: dict = Depends(verify_token)) -> dict:
    """Require confirmed email before costly or abuse-sensitive actions."""
    if not user.get("email_verified"):
        raise HTTPException(status_code=403, detail="email_not_verified")
    return user
