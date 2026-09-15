import os

import jwt
from fastapi import Header, HTTPException

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

        return {"user_id": user_id, "email": user.user.email}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Unauthorized")
