from fastapi import APIRouter, Depends, HTTPException

from db import supabase_admin
from middleware.auth import verify_token

router = APIRouter()


@router.get("/")
async def list_bulletins(
    user: dict = Depends(verify_token),
    limit: int = 50,
    offset: int = 0,
):
    """Get paginated bulletin history for the authenticated user."""
    if limit > 100:
        raise HTTPException(status_code=400, detail="Limit cannot exceed 100")
    if limit < 1 or offset < 0:
        raise HTTPException(status_code=400, detail="Invalid pagination")

    data = (
        supabase_admin.table("bulletins")
        .select("id, title, service_date, created_at, pdf_url")
        .eq("user_id", user["user_id"])
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    return {"bulletins": data.data, "count": len(data.data)}


@router.get("/{bulletin_id}")
async def get_bulletin(bulletin_id: str, user: dict = Depends(verify_token)):
    """Get a specific bulletin — only the owner can access it."""
    data = (
        supabase_admin.table("bulletins")
        .select("*")
        .eq("id", bulletin_id)
        .eq("user_id", user["user_id"])
        .single()
        .execute()
    )
    if not data.data:
        raise HTTPException(status_code=404, detail="Bulletin not found")

    # Fresh signed URL — old ones expire after an hour.
    if data.data.get("pdf_url"):
        signed = supabase_admin.storage.from_("bulletins").create_signed_url(data.data["pdf_url"], 3600)
        data.data["pdf_signed_url"] = signed.get("signedURL")

    return data.data


@router.delete("/{bulletin_id}")
async def delete_bulletin(bulletin_id: str, user: dict = Depends(verify_token)):
    """Delete a bulletin and its PDF."""
    data = (
        supabase_admin.table("bulletins")
        .select("id, pdf_url, user_id")
        .eq("id", bulletin_id)
        .eq("user_id", user["user_id"])
        .single()
        .execute()
    )
    if not data.data:
        raise HTTPException(status_code=404, detail="Not found")

    if data.data.get("pdf_url"):
        supabase_admin.storage.from_("bulletins").remove([data.data["pdf_url"]])

    supabase_admin.table("bulletins").delete().eq("id", bulletin_id).execute()
    return {"deleted": True}
