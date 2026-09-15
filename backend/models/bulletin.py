from typing import List, Optional

from pydantic import BaseModel, field_validator


class BulletinRequest(BaseModel):
    church_name: str
    service_date: str
    service_time: str = "10:00 AM"
    pastor_name: Optional[str] = ""
    sermon_title: str
    scripture_reference: str
    sermon_summary: Optional[str] = ""
    announcements: List[str] = []
    special_events: Optional[str] = ""
    prayer_requests: Optional[str] = ""
    offering_info: Optional[str] = ""
    tone: Optional[str] = "warm and welcoming"
    denomination: Optional[str] = ""
    brand_accent_color: Optional[str] = None
    logo_url: Optional[str] = None

    @field_validator("church_name", "sermon_title", "scripture_reference")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Field cannot be empty")
        return v.strip()

    @field_validator("service_date")
    @classmethod
    def valid_date(cls, v: str) -> str:
        import re

        if not re.match(r"^\d{4}-\d{2}-\d{2}$", v):
            raise ValueError("Date must be YYYY-MM-DD format")
        return v

    @field_validator("announcements")
    @classmethod
    def limit_announcements(cls, v: List[str]) -> List[str]:
        return [a.strip()[:500] for a in v if a.strip()][:10]

    @field_validator("tone")
    @classmethod
    def valid_tone(cls, v: Optional[str]) -> Optional[str]:
        allowed = {"warm and welcoming", "formal and reverent", "energetic and contemporary", "traditional"}
        if v and v not in allowed:
            raise ValueError(f"Tone must be one of: {', '.join(sorted(allowed))}")
        return v

    @field_validator("brand_accent_color")
    @classmethod
    def valid_accent_color(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return v
        import re

        if not re.match(r"^#[0-9a-fA-F]{6}$", v):
            raise ValueError("Accent color must be a hex color")
        return v.lower()
