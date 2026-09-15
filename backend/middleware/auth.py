import os

import jwt
from fastapi import Depends, Header, HTTPException

from db import supabase_admin


async def verify_token(authorization: str = Header(...)) -> dict:
    """Verify the Supabase JWT on every protected endpoint."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    token = authorization.split(" ", 1)[1]

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

        return {
            "user_id": user_id,
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
