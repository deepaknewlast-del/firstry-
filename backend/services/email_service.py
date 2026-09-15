"""Transactional email via Resend."""
import logging

import httpx

from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

FROM = "ChurchPress <hello@churchpress.ai>"
FRONTEND_BASE = settings.FRONTEND_URL


async def _send(to: str, subject: str, html: str) -> None:
    if not settings.RESEND_API_KEY:
        logger.info("RESEND_API_KEY not set — skipping email to %s", to)
        return
    async with httpx.AsyncClient() as client:
        await client.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
            json={"from": FROM, "to": [to], "subject": subject, "html": html},
        )


async def send_welcome_email(email: str) -> None:
    """Send welcome email when a user signs up."""
    await _send(
        email,
        "Welcome to ChurchPress — here's how to start",
        f"""
<div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a;">
  <h1 style="color: #1e40af; font-size: 24px; margin-bottom: 8px;">Welcome to ChurchPress</h1>
  <p style="color: #64748b; font-size: 14px; margin-bottom: 24px;">You have 3 free bulletins waiting.</p>
  <p style="line-height: 1.7;">Here's how to create your first bulletin in 2 minutes:</p>
  <ol style="line-height: 2; color: #374151;">
    <li>Go to your <a href="{FRONTEND_BASE}/generate" style="color: #1e40af;">dashboard</a></li>
    <li>Fill in this Sunday's sermon title, scripture, and announcements</li>
    <li>Click Generate — your bulletin, slides, and social posts are ready</li>
    <li>Download the PDF and copy the other content</li>
  </ol>
  <a href="{FRONTEND_BASE}/generate"
    style="display: inline-block; background: #1e40af; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; margin: 20px 0;">
    Create your first bulletin &rarr;
  </a>
  <p style="font-size: 13px; color: #94a3b8; margin-top: 32px;">
    Questions? Reply to this email — I read every one.<br>
    &mdash; The ChurchPress team
  </p>
</div>
""",
    )


async def send_upgrade_confirmation(email: str, church_name: str = "") -> None:
    """Send confirmation when a church upgrades to paid."""
    await _send(
        email,
        "You're all set — unlimited bulletins unlocked",
        f"""
<div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a;">
  <h1 style="color: #1e40af;">You're upgraded!</h1>
  <p>Thank you for subscribing, {church_name or "friend"}. You now have unlimited bulletin generations.</p>
  <p>Your subscription is $19/month. You can manage or cancel anytime from your
  <a href="{FRONTEND_BASE}/account" style="color: #1e40af;">account page</a>.</p>
  <a href="{FRONTEND_BASE}/generate"
    style="display: inline-block; background: #1e40af; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; margin: 20px 0;">
    Generate this week's bulletin &rarr;
  </a>
</div>
""",
    )


async def send_upgrade_interest(email: str, church_name: str = "") -> None:
    """Confirm that a free user asked to hear when paid upgrades open."""
    await _send(
        email,
        "You're on the ChurchPress upgrade list",
        f"""
<div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a;">
  <h1 style="color: #4e2456;">You're on the list</h1>
  <p>Thanks, {church_name or "friend"}. We'll email you when ChurchPress paid upgrades open.</p>
  <p>The paid plan will unlock unlimited weekly bulletins, church branding, regenerate tools, and export-ready slides.</p>
  <a href="{FRONTEND_BASE}/generate"
    style="display: inline-block; background: #632f6d; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; margin: 20px 0;">
    Back to ChurchPress &rarr;
  </a>
</div>
""",
    )
