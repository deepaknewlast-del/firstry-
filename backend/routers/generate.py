from fastapi import APIRouter, Depends, HTTPException

from db import supabase_admin
from middleware.auth import require_verified_user
from models.bulletin import BulletinRequest
from services.ai_service import generate_bulletin_content
from services.pdf_service import generate_pdf
from services.rate_limiter import check_rate_limit

router = APIRouter()


@router.post("/bulletin")
async def create_bulletin(request: BulletinRequest, user: dict = Depends(require_verified_user)):
    user_id = user["user_id"]

    # Subscription status gates the free tier; Redis guards abuse caps.
    profile = (
        supabase_admin.table("profiles")
        .select("subscription_status, bulletins_generated_total, church_name, denomination, brand_accent_color, logo_path")
        .eq("id", user_id)
        .single()
        .execute()
    )
    if not profile.data:
        raise HTTPException(status_code=404, detail="Profile not found")

    is_paid = profile.data.get("subscription_status") == "active"

    # Redis-backed limit check (free = 3 lifetime, paid = 200/month).
    await check_rate_limit(user_id, is_paid)

    try:
        generation_input = request.model_dump()
        if profile.data.get("church_name"):
            generation_input["church_name"] = profile.data["church_name"]
        if profile.data.get("denomination"):
            generation_input["denomination"] = profile.data["denomination"]
        if profile.data.get("brand_accent_color"):
            generation_input["brand_accent_color"] = profile.data["brand_accent_color"]
        if profile.data.get("logo_path"):
            signed_logo = supabase_admin.storage.from_("church-assets").create_signed_url(
                profile.data["logo_path"], 3600
            )
            generation_input["logo_url"] = signed_logo.get("signedURL")

        branded_request = BulletinRequest(**generation_input)
        content = generate_bulletin_content(branded_request)
        pdf_bytes = generate_pdf(content, generation_input)
    except ValueError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception:
        raise HTTPException(status_code=502, detail="Generation failed. Please try again.")

    # Store PDF in a private Supabase Storage bucket, one folder per user.
    pdf_path = f"{user_id}/bulletin_{request.service_date}.pdf"
    try:
        supabase_admin.storage.from_("bulletins").upload(
            path=pdf_path,
            file=pdf_bytes,
            file_options={"content-type": "application/pdf", "upsert": True},
        )
    except Exception:
        raise HTTPException(status_code=500, detail="Could not store the generated PDF.")

    # Persist the bulletin record.
    record = (
        supabase_admin.table("bulletins")
        .insert(
            {
                "user_id": user_id,
                "title": request.sermon_title,
                "service_date": request.service_date,
                "input_data": generation_input,
                "generated_content": content,
                "pdf_url": pdf_path,
            }
        )
        .execute()
    )
    bulletin_id = record.data[0]["id"]

    # Increment the durable usage counter.
    supabase_admin.table("usage_logs").insert({"user_id": user_id, "action": "generate"}).execute()
    supabase_admin.table("profiles").update(
        {"bulletins_generated_total": profile.data["bulletins_generated_total"] + 1}
    ).eq("id", user_id).execute()

    # Signed URL for immediate download (expires in 1 hour).
    signed = supabase_admin.storage.from_("bulletins").create_signed_url(pdf_path, 3600)

    return {
        "bulletin_id": bulletin_id,
        "content": content,
        "pdf_url": signed.get("signedURL"),
    }
