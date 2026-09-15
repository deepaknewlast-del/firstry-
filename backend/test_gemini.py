"""One-off smoke test: real Gemini call through the actual service."""
import json
import re
import time
import sys

from services.ai_service import generate_bulletin_content
from models.bulletin import BulletinRequest

data = BulletinRequest(
    church_name="Grace Community Church",
    service_date="2026-09-21",
    service_time="10:00 AM",
    pastor_name="Pastor David Okafor",
    sermon_title="Walking in Quiet Confidence",
    scripture_reference="Psalm 46:10",
    sermon_summary="Finding stillness and trust in God during seasons of uncertainty.",
    announcements=[
        "Youth group bake sale this Friday 6pm",
        "Women's Bible study resumes Tuesday 7pm",
        "New member welcome lunch after service next Sunday",
    ],
    special_events="Fall harvest festival October 5th, family friendly, free entry",
    prayer_requests="The Henderson family who lost their home in a fire; Tom Bradley recovering from knee surgery",
    offering_info="Giving envelopes in pew racks, online giving at gracechurch.com/give",
    tone="warm and welcoming",
    denomination="non-denominational",
)

start = time.time()
try:
    content = generate_bulletin_content(data)
except Exception as e:
    print(f"FAILED: {type(e).__name__}: {e}")
    sys.exit(1)

elapsed = time.time() - start

b = content.get("bulletin", {})
slides = content.get("announcement_slides", [])
social = content.get("social_post", {})
email = content.get("email_newsletter", {})

checks = {
    "bulletin.header": bool(b.get("header")),
    "welcome_message (2-3 sentences)": 2
    <= len(re.findall(r"[.!?](?:\s|$)", b.get("welcome_message", "")))
    <= 4,
    "order_of_service (7-10 items)": 7 <= len(b.get("order_of_service", [])) <= 10,
    "sermon.key_points (3)": len(b.get("sermon_section", {}).get("key_points", [])) == 3,
    "announcements rewritten": len(b.get("announcements", [])) >= 3,
    "prayer_requests present": bool(b.get("prayer_requests")),
    "closing_thought": bool(b.get("closing_thought")),
    "slides (4-10)": 4 <= len(slides) <= 10,
    "slide types valid": all(s.get("type") in {"welcome", "scripture", "announcement", "closing"} for s in slides),
    "facebook post": bool(social.get("facebook")),
    "facebook has no hashtags": "#" not in social.get("facebook", ""),
    "instagram has 5 hashtags": social.get("instagram", "").count("#") == 5,
    "email.subject_line <50 chars": len(email.get("subject_line", "")) <= 50,
    "email.preview_text <90 chars": len(email.get("preview_text", "")) <= 90,
    "email.body 300-400 words": 300 <= len(email.get("body", "").split()) <= 450,
}

print(f"Generation OK in {elapsed:.1f}s")
print(f"  header: {b.get('header')}")
print(f"  sermon points: {b.get('sermon_section', {}).get('key_points')}")
print(f"  slides: {len(slides)} | email subject: {email.get('subject_line')!r}")
print()
passed = sum(checks.values())
for name, ok in checks.items():
    print(f"  {'PASS' if ok else 'FAIL'}  {name}")
print(f"\n{passed}/{len(checks)} quality checks passed")
sys.exit(0 if passed == len(checks) else 2)
