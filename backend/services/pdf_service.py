"""Bulletin PDF generation — tone-themed two-page bi-fold, WeasyPrint-first.

Each bulletin is two Letter pages:
  Page 1 (cover): Gemini-generated tone artwork (or the church's logo if
                  they uploaded one), church name in the tone's display
                  font, service day/time, framed in the tone's palette.
  Page 2 (inside): two-column spread — Order of Worship with dotted
                  leaders, sermon feature box, announcements, prayer,
                  closing verse, and a contact footer.

Four tone themes mirror the exact values of the bulletin form's Tone
dropdown: traditional, formal and reverent, warm and welcoming,
energetic and contemporary. Each theme sets palette, display/heading/
body fonts, and cover artwork (assets/art/<tone>.jpg).

Fonts are vendored in assets/fonts and registered via @font-face; the
artwork path resolves relative to assets/ (base_url for WeasyPrint).
If WeasyPrint is unavailable (e.g. dev machines without Pango), the
same HTML falls back to xhtml2pdf with degraded styling.
"""
import io
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

ASSETS_DIR = Path(__file__).resolve().parent.parent / "assets"

# ---------------------------------------------------------------------------
# Tone themes — palette, fonts, artwork. Keys are matched by substring.
# ---------------------------------------------------------------------------
TONE_THEMES = {
    "traditional": {
        "primary": "#1c3457",
        "accent": "#b08d3e",
        "cream": "#f7f1e3",
        "display": "Cinzel Decorative",
        "heads": "Cinzel",
        "body": "Cormorant Garamond",
        "art": "traditional.jpg",
        "tagline": "\u201cI was glad when they said unto me, let us go into the house of the Lord.\u201d",
        "wordmark_orn": "\u2726",
    },
    "formal": {
        "primary": "#3b1f3e",
        "accent": "#c5a75c",
        "cream": "#fbf9f4",
        "display": "Cinzel",
        "heads": "Cinzel",
        "body": "Cormorant Garamond",
        "art": "formal.jpg",
        "tagline": "\u201cHoly, holy, holy is the Lord of hosts; the whole earth is full of his glory.\u201d",
        "wordmark_orn": "\u271d",
    },
    "warm": {
        "primary": "#4a6741",
        "accent": "#c98a4b",
        "cream": "#fdf9ef",
        "display": "Great Vibes",
        "heads": "Cormorant Garamond",
        "body": "Cormorant Garamond",
        "art": "warm.jpg",
        "tagline": "\u201cCome to me, all who labor and are heavy laden, and I will give you rest.\u201d",
        "wordmark_orn": "\u2767",
    },
    "contemporary": {
        "primary": "#101c26",
        "accent": "#e8a33d",
        "cream": "#ffffff",
        "display": "Montserrat",
        "heads": "Montserrat",
        "body": "Montserrat",
        "art": "contemporary.jpg",
        "tagline": "A place to belong. A place to believe.",
        "wordmark_orn": "\u2014",
    },
}


def _resolve_theme(tone: str | None) -> dict:
    t = (tone or "").lower()
    if "formal" in t or "reverent" in t:
        return TONE_THEMES["formal"]
    if "energetic" in t or "contemporary" in t or "modern" in t:
        return TONE_THEMES["contemporary"]
    if "warm" in t or "welcoming" in t:
        return TONE_THEMES["warm"]
    if "traditional" in t:
        return TONE_THEMES["traditional"]
    return TONE_THEMES["warm"]  # the form's default


FONT_FACES = "".join(
    f"""@font-face {{
    font-family: '{fam}';
    font-weight: {weight};
    font-style: {style};
    src: url('fonts/{fname}');
}}
"""
    for fam, weight, style, fname in [
        ("Cinzel Decorative", 700, "normal", "cinzeldecorative_700.ttf"),
        ("Cinzel Decorative", 900, "normal", "cinzeldecorative_900.ttf"),
        ("Cinzel", 500, "normal", "cinzel_500.ttf"),
        ("Cinzel", 700, "normal", "cinzel_700.ttf"),
        ("Cormorant Garamond", 500, "normal", "cormorant_500.ttf"),
        ("Cormorant Garamond", 600, "normal", "cormorant_600.ttf"),
        ("Cormorant Garamond", 500, "italic", "cormorant_500i.ttf"),
        ("Great Vibes", 400, "normal", "greatvibes_400.ttf"),
        ("Montserrat", 400, "normal", "montserrat_400.ttf"),
        ("Montserrat", 600, "normal", "montserrat_600.ttf"),
        ("Montserrat", 800, "normal", "montserrat_800.ttf"),
    ]
)


def _esc(text) -> str:
    """Escape text for safe embedding in HTML."""
    return (
        str(text)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def _render_with_xhtml2pdf(html_content: str) -> bytes:
    """Pure-Python HTML to PDF renderer (no GTK / system deps needed)."""
    from xhtml2pdf import pisa

    out = io.BytesIO()
    pisa_status = pisa.pisaDocument(io.BytesIO(html_content.encode("utf-8")), out)
    if pisa_status.err:
        raise RuntimeError(f"xhtml2pdf rendering error: {pisa_status.err}")
    return out.getvalue()


def _cover_html(theme: dict, accent: str, input_data: dict) -> str:
    logo_url = input_data.get("logo_url")
    church = _esc(input_data.get("church_name", "Church"))
    date = _esc(input_data.get("service_date", ""))
    time = _esc(input_data.get("service_time", ""))
    orn = theme["wordmark_orn"]

    # Logo-first cover: a church's own brand replaces the tone artwork.
    if logo_url:
        hero = f'<div class="logo-wrap"><img class="logo" src="{_esc(logo_url)}" alt=""></div>'
    else:
        hero = f'<img class="cover-art" src="art/{theme["art"]}" alt="">'

    return f"""
<div class="page cover first">
  <div class="cover-frame"></div>
  <span class="corner c1">{orn}</span><span class="corner c2">{orn}</span>
  <span class="corner c3">{orn}</span><span class="corner c4">{orn}</span>
  {hero}
  <div class="cover-church">{church}</div>
  <div class="cover-rule"><span class="mid">{orn}</span></div>
  <p class="cover-tag">{theme['tagline']}</p>
  <div class="cover-service">
    <div class="day">Sunday Worship</div>
    <div class="time">{date} &nbsp;&bull;&nbsp; {time}</div>
  </div>
</div>
"""


def _inside_html(theme: dict, accent: str, content: dict, input_data: dict) -> str:
    b = content.get("bulletin", {})
    church = _esc(input_data.get("church_name", "Church"))
    date = _esc(input_data.get("service_date", ""))
    time = _esc(input_data.get("service_time", ""))

    sermon = b.get("sermon_section", {})
    sermon_title = _esc(sermon.get("title") or input_data.get("sermon_title", ""))
    sermon_ref = _esc(sermon.get("scripture_reference") or input_data.get("scripture_reference", ""))
    pastor = _esc(input_data.get("pastor_name") or "")
    ref_line = sermon_ref + (f" &bull; {pastor}" if pastor else "")
    points = "".join(f"<li>{_esc(p)}</li>" for p in sermon.get("key_points", []))

    order_items = "".join(
        f"<div class='order-item'><span class='what'>{_esc(i)}</span></div>"
        for i in b.get("order_of_service", [])
    )
    announcements = "".join(
        f"<div class='ann'>{_esc(a)}</div>" for a in b.get("announcements", [])[:4]
    )
    prayer = _esc(b.get("prayer_requests", ""))
    offering = _esc(b.get("offering_info", ""))
    welcome = _esc(b.get("welcome_message", ""))
    closing = _esc(b.get("closing_thought", ""))

    return f"""
<div class="page inside">
  <div class="inside-header">
    <div class="church">{church}</div>
    <div class="date">{date.upper()} &nbsp;&bull;&nbsp; {time.upper()} &nbsp;&bull;&nbsp; {sermon_title.upper()}</div>
  </div>
  <div class="cols">
    <div class="col">
      <p class="welcome">{welcome}</p>
      <h3 class="sec"><span class="mid">{theme['wordmark_orn']}</span><span>Order of Worship</span><span class="mid">{theme['wordmark_orn']}</span></h3>
      {order_items}
      <div class="sermon-box">
        <div class="st">{sermon_title}</div>
        <div class="sr">{ref_line}</div>
        <ul>{points}</ul>
      </div>
    </div>
    <div class="col">
      <h3 class="sec"><span class="mid">{theme['wordmark_orn']}</span><span>Announcements</span><span class="mid">{theme['wordmark_orn']}</span></h3>
      {announcements}
      {f"<h3 class='sec' style='margin-top:14px'><span class='mid'>{theme['wordmark_orn']}</span><span>Prayer</span><span class='mid'>{theme['wordmark_orn']}</span></h3><div class='ann soft'>{prayer}</div>" if prayer else ''}
      {f"<h3 class='sec' style='margin-top:14px'><span class='mid'>{theme['wordmark_orn']}</span><span>Giving</span><span class='mid'>{theme['wordmark_orn']}</span></h3><div class='ann soft'>{offering}</div>" if offering else ''}
      <div class="verse-block"><span class="vq">{closing}</span></div>
    </div>
  </div>
  <div class="inside-footer">{church.upper()}</div>
</div>
"""


# Base CSS shared by both pages; __PRIMARY__/__ACCENT__/__CREAM__ and the
# font families are substituted per tone.
_BASE_CSS = """
@page { size: Letter; margin: 0; }
body { margin: 0; font-family: '__BODY__', Georgia, serif; color: #2b2b2b; }
.page { width: 8.5in; height: 11in; overflow: hidden; position: relative; background: __CREAM__; }
.page.first { page-break-after: always; }

/* ---------- cover ---------- */
.cover { text-align: center; padding: 0.75in 0.85in 0.6in 0.85in; }
.cover-frame { position: absolute; top: 0.35in; bottom: 0.35in; left: 0.35in; right: 0.35in;
  border: 1.5px solid __ACCENT__; outline: 3px double __ACCENT__; outline-offset: 4px; }
.corner { position: absolute; color: __ACCENT__; font-size: 15px; }
.c1 { top: 0.22in; left: 0.28in; } .c2 { top: 0.22in; right: 0.28in; }
.c3 { bottom: 0.22in; left: 0.28in; } .c4 { bottom: 0.22in; right: 0.28in; }
.cover-art { width: 4.4in; height: 5.5in; object-fit: cover; margin-top: 0.35in; border: 1px solid __ACCENT__; padding: 3px; }
body.no-logo .cover-art { width: 4.4in; }
.logo-wrap { margin-top: 0.5in; }
.logo { max-height: 2.2in; max-width: 5in; }
.cover-church { font-family: '__DISPLAY__'; font-size: 30pt; font-weight: bold; letter-spacing: 2px;
  color: __PRIMARY__; text-transform: uppercase; line-height: 1.2; margin: 0.28in 0.2in 0 0.2in; }
body.tone-warm .cover-church { text-transform: none; letter-spacing: 1px; font-weight: normal; }
body.tone-contemporary .cover-church { letter-spacing: 5px; font-size: 24pt; font-weight: 800; }
.cover-rule { display: flex; align-items: center; gap: 10px; width: 2.6in; margin: 0.18in auto 0.12in auto; }
.cover-rule::before, .cover-rule::after { content: ""; flex: 1; border-top: 1.5px solid __ACCENT__; }
.cover-rule .mid { color: __ACCENT__; font-size: 13px; }
.cover-tag { font-style: italic; color: #6b6255; font-size: 13pt; margin: 0 0.4in; font-family: '__BODY__', serif; }
body.tone-warm .cover-tag { font-family: '__DISPLAY__'; font-style: normal; font-size: 17pt; color: __PRIMARY__; }
body.tone-contemporary .cover-tag { font-style: normal; font-size: 10.5pt; letter-spacing: 2px; text-transform: uppercase; }
.cover-service { margin-top: auto; margin-bottom: 0.3in; position: absolute; bottom: 0.55in; left: 0; right: 0; }
.cover-service .day { font-family: '__HEADS__'; font-size: 15pt; color: __PRIMARY__; letter-spacing: 3px; text-transform: uppercase; }
.cover-service .time { font-size: 11.5pt; color: #6b6255; margin-top: 5px; letter-spacing: 1.5px; }

/* ---------- inside ---------- */
.inside { padding: 0.55in 0.75in 0.5in 0.75in; }
.inside-header { text-align: center; border-bottom: 2px solid __ACCENT__; padding-bottom: 10px; margin-bottom: 18px; }
.inside-header .church { font-family: '__HEADS__'; font-size: 15pt; letter-spacing: 3px; color: __PRIMARY__; text-transform: uppercase; font-weight: bold; }
.inside-header .date { font-family: '__HEADS__'; font-size: 9pt; color: #6b6255; margin-top: 5px; letter-spacing: 1.5px; }
.cols { display: flex; gap: 0.32in; }
.col { width: 50%; }
.col + .col { border-left: 1px solid #e3dbc8; padding-left: 0.32in; }
h3.sec { font-family: '__HEADS__'; font-size: 11pt; letter-spacing: 2px; text-transform: uppercase; color: __PRIMARY__;
  margin: 0 0 8px 0; display: flex; align-items: center; gap: 8px; }
h3.sec::before, h3.sec::after { content: ""; height: 1px; background: __ACCENT__; flex: 1; }
h3.sec .mid { color: __ACCENT__; font-size: 10px; }
.welcome { font-size: 12pt; line-height: 1.5; margin-top: 0; }
.welcome::first-letter { font-family: '__DISPLAY__'; font-size: 250%; float: left; line-height: 0.85; padding: 3px 6px 0 0; color: __ACCENT__; }
.order-item { padding: 5px 0; border-bottom: 1px dotted #d8cfba; font-size: 11.5pt; }
.order-item .what { font-weight: 600; }
.sermon-box { background: #ffffff; border: 1px solid #e3dbc8; border-top: 3px solid __ACCENT__; padding: 12px 14px; margin-top: 12px; text-align: center; }
.sermon-box .st { font-family: '__HEADS__'; font-size: 13.5pt; color: __PRIMARY__; font-weight: bold; }
.sermon-box .sr { font-style: italic; color: __ACCENT__; font-size: 10.5pt; margin-top: 3px; }
.sermon-box ul { text-align: left; margin: 8px 0 0 16px; padding: 0; font-size: 11pt; line-height: 1.55; }
.ann { font-size: 11.5pt; padding: 5px 0 5px 10px; border-left: 2.5px solid __ACCENT__; margin: 7px 0; line-height: 1.45; }
.ann.soft { border-left-color: #c9b98a; }
.verse-block { text-align: center; color: #6b6255; margin-top: 14px; }
.verse-block .vq { font-style: italic; font-size: 11.5pt; font-family: '__BODY__', serif; }
.inside-footer { border-top: 1.5px solid __ACCENT__; margin-top: 16px; padding-top: 8px; text-align: center;
  font-size: 9pt; color: #6b6255; letter-spacing: 1.5px; font-family: '__HEADS__'; }
"""


def generate_pdf(content: dict, input_data: dict) -> bytes:
    """Generate a print-ready, tone-themed two-page bulletin PDF."""
    theme = _resolve_theme(input_data.get("tone"))
    # A church-set brand color overrides the theme accent.
    accent = input_data.get("brand_accent_color") or theme["accent"]
    has_logo = bool(input_data.get("logo_url"))

    css = (
        FONT_FACES
        + (_BASE_CSS
           .replace("__PRIMARY__", theme["primary"])
           .replace("__ACCENT__", accent)
           .replace("__CREAM__", theme["cream"])
           .replace("__DISPLAY__", theme["display"])
           .replace("__HEADS__", theme["heads"])
           .replace("__BODY__", theme["body"]))
    )
    if not has_logo:
        css = css.replace("__CREAM__ }}", "__CREAM__ }}")  # no-op safeguard

    html_content = f"""<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>{css}</style></head>
<body class="tone-{_tone_class(input_data.get('tone'))} {'no-logo' if not has_logo else ''}">
{_cover_html(theme, accent, input_data)}
{_inside_html(theme, accent, content, input_data)}
</body>
</html>"""

    # WeasyPrint (production Docker image): full CSS — fonts, flex, drop caps.
    # The CSS is already embedded in <head>; passing it also as a stylesheet
    # is harmless duplication that keeps the stylesheet authoritative.
    try:
        from weasyprint import CSS, HTML

        return HTML(
            string=html_content, base_url=str(ASSETS_DIR)
        ).write_pdf(stylesheets=[CSS(string=css, base_url=str(ASSETS_DIR))])
    except (OSError, ImportError) as e:
        logger.info("WeasyPrint unavailable (%s); falling back to xhtml2pdf", e)
    except Exception as e:
        logger.warning("WeasyPrint failed to render (%s); falling back to xhtml2pdf", e)

    # Pure-Python fallback (dev machines without Pango). Styling degrades;
    # production always renders with WeasyPrint.
    return _render_with_xhtml2pdf(html_content)


def _tone_class(tone) -> str:
    t = (tone or "").lower()
    if "formal" in t or "reverent" in t:
        return "tone-formal"
    if "energetic" in t or "contemporary" in t:
        return "tone-contemporary"
    if "warm" in t or "welcoming" in t:
        return "tone-warm"
    return "tone-traditional"
