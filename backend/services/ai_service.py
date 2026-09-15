"""AI generation via Google Gemini. The API key lives only on this server."""
import json
import logging

import google.generativeai as genai

from config import get_settings
from models.bulletin import BulletinRequest

logger = logging.getLogger(__name__)
settings = get_settings()

genai.configure(api_key=settings.GEMINI_API_KEY)

# Tried in order — keep explicit model IDs only. Avoid "latest" aliases because
# they can resolve to retired models and cause confusing 404s.
MODEL_CHAIN = ("models/gemini-3.6-flash", "gemini-2.5-flash")

# Flash models on this tier spend part of the output budget on internal
# reasoning, so the cap must comfortably exceed the ~1.5k tokens of JSON we
# ask for. Too low a cap truncates the response mid-string and breaks parsing.
MAX_OUTPUT_TOKENS = 16384


def _build_model(model_name: str):
    return genai.GenerativeModel(
        model_name=model_name,
        generation_config={
            "temperature": 0.7,
            "max_output_tokens": MAX_OUTPUT_TOKENS,
            "response_mime_type": "application/json",
        },
    )


model = _build_model(MODEL_CHAIN[0])

SYSTEM_PROMPT = """You are a professional church communications assistant.
Generate church bulletin content from the input provided.
Return ONLY valid JSON — no preamble, no markdown, no explanation.

Output schema:
{
  "bulletin": {
    "header": "string",
    "welcome_message": "string",
    "order_of_service": ["array of strings"],
    "sermon_section": {
      "title": "string",
      "scripture_reference": "string",
      "key_points": ["3 brief points"]
    },
    "announcements": ["array of formatted announcement strings"],
    "prayer_requests": "string or null",
    "offering_info": "string or null",
    "closing_thought": "string"
  },
  "announcement_slides": [
    {
      "slide_number": 1,
      "headline": "string (max 8 words)",
      "body": "string (max 25 words)",
      "type": "welcome|scripture|announcement|closing"
    }
  ],
  "social_post": {
    "facebook": "string",
    "instagram": "string"
  },
  "email_newsletter": {
    "subject_line": "string",
    "preview_text": "string",
    "body": "string"
  }
}

Content rules:
- Order of service: 7-10 realistic items (prelude/welcome, worship, prayer, scripture reading, sermon, offering, benediction), adapted to denomination.
- Announcements: rewrite raw notes into polished bulletin copy with day, date, time, location.
- Never fabricate scripture beyond the provided reference. Never invent prayer requests.
- Slides: one welcome slide, one scripture/message slide, one per major announcement, one closing slide (4-10 total).
- Facebook post: 100-200 words, no hashtags, ends with an invitation. Instagram post: 60-80 words ending with exactly 5 hashtags.
- Email: subject under 50 chars, preview under 90 chars, 300-400 word plain-text body with warm greeting, sermon theme, announcements, prayer, blessing, and sign-off.
- Match the requested tone; use the denomination to adjust language style when provided."""


def _build_prompt(data: BulletinRequest) -> str:
    return f"""
Church Name: {data.church_name}
Date: {data.service_date}
Service Time: {data.service_time}
Pastor: {data.pastor_name or ""}
Sermon Title: {data.sermon_title}
Scripture: {data.scripture_reference}
Sermon Summary: {data.sermon_summary or ""}
Announcements: {json.dumps(data.announcements)}
Special Events: {data.special_events or ""}
Prayer Requests: {data.prayer_requests or ""}
Offering Information: {data.offering_info or ""}
Tone: {data.tone}
Denomination: {data.denomination or ""}

{SYSTEM_PROMPT}
"""


def sanitize_input(data: dict) -> dict:
    """Basic defense against prompt injection and oversized inputs."""
    if isinstance(data, str):
        return (
            data.replace("SYSTEM_PROMPT", "")
            .replace("{{", "")
            .replace("}}", "")[:500]
        )
    if isinstance(data, list):
        return [sanitize_input(item) for item in data[:10]]
    if not isinstance(data, dict):
        return data

    safe = {}
    for key, value in data.items():
        if isinstance(value, str):
            safe[key] = (
                value.replace("SYSTEM_PROMPT", "")
                .replace("{{", "")
                .replace("}}", "")[:500]
            )
        else:
            safe[key] = sanitize_input(value)
    return safe


def _extract_json_object(raw: str) -> str:
    """Trim anything the model wrapped around the JSON payload.

    JSON mode usually obeys, but models occasionally add a sentence of
    preamble. Slicing from the first brace to the last keeps parsing honest.
    """
    start = raw.find("{")
    end = raw.rfind("}")
    if start != -1 and end > start:
        return raw[start : end + 1]
    return raw


def generate_bulletin_content(data: BulletinRequest) -> dict:
    """Generate all bulletin content via Gemini. API key is server-side only."""
    safe_input = BulletinRequest(**sanitize_input(data.model_dump()))
    prompt = _build_prompt(safe_input)

    try:
        global model
        response = None
        for candidate in MODEL_CHAIN:
            try:
                model = _build_model(candidate) if model.model_name != candidate else model
                response = model.generate_content(prompt)
                break
            except Exception as e:  # noqa: BLE001 — 404/retired models fall through
                if "404" in str(e) or "not found" in str(e).lower() or "no longer available" in str(e).lower():
                    logger.warning("Model %s unavailable (%s); trying next", candidate, e)
                    continue
                raise
        if response is None:
            raise RuntimeError("No available Gemini model could serve this request.")

        # A truncated response can never be valid JSON — say so plainly
        # instead of blaming the model's formatting.
        finish_reason = getattr(response.candidates[0], "finish_reason", None)
        if str(finish_reason).endswith("MAX_TOKENS"):
            logger.error(
                "Gemini hit the %s output-token cap; response was truncated",
                MAX_OUTPUT_TOKENS,
            )
            raise ValueError(
                "The response was cut off before it finished. Please try again."
            )

        raw = _extract_json_object(response.text.strip().strip("`"))
        if raw.lower().startswith("json"):
            raw = raw[4:].lstrip()

        content = json.loads(raw)
    except json.JSONDecodeError:
        raise ValueError("AI returned invalid JSON. Please try again.")
    except Exception as e:
        logger.exception("Generation failed")
        raise RuntimeError(f"Generation failed: {e}")

    # Validate that required top-level keys exist.
    required = ("bulletin", "announcement_slides", "social_post", "email_newsletter")
    if not all(k in content for k in required):
        raise ValueError("AI response missing required sections. Please try again.")

    return content
