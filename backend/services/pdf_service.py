"""Bulletin PDF generation — artwork-background, gold-overlay two-page bi-fold.

Design (per tone): one of four Gemini-generated artworks fills the whole page
as a background; a tinted scrim keeps it legible; the bulletin text is laid
over the top in the tone's gold, display/script/body fonts.

  Page 1 (cover): full-bleed artwork, gold double frame, church name in the
                  tone's display font, tagline in the tone's script font
                  (cursive for traditional/formal/warm), service date + time.
                  If the church uploaded a logo, that replaces the artwork hero.
  Page 2 (inside): the same artwork heavily scrimmed (reads as texture), the
                  worship content in cream/gold — welcome, order of worship,
                  sermon feature, announcements, prayer, giving, closing verse.

WeasyPrint (the production Docker image) renders this fully: background-image
with cover sizing, gradients, path-based @font-face, flex/table layout. On a
dev machine without Pango the import fails and xhtml2pdf renders a degraded
version — production always uses WeasyPrint.
"""
import io
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

ASSETS_DIR = Path(__file__).resolve().parent.parent / "assets"

# ---------------------------------------------------------------------------
# Tone themes — artwork, palette, fonts, ornaments. Matched by substring on the
# bulletin form's Tone dropdown: traditional | formal and reverent |
# warm and welcoming | energetic and contemporary.
# ---------------------------------------------------------------------------
TONE_THEMES = {
    "traditional": {
        "art": "traditional.jpg",
        "art_cover": "traditional-cover.jpg",
        "art_inside": "traditional-inside.jpg",
        "ground": "#0d1a2b",       # deep ground used by the inside scrim
        "gold": "#d7b463",
        "cream": "#f6efdf",
        "display": "Cinzel Decorative",
        "heads": "Cinzel",
        "body": "Cormorant Garamond",
        "script": "Great Vibes",
        "orn": "\u2726",
        "tagline": "\u201cI was glad when they said unto me, let us go into the house of the Lord.\u201d",
    },
    "formal": {
        "art": "formal.jpg",
        "art_cover": "formal-cover.jpg",
        "art_inside": "formal-inside.jpg",
        "ground": "#1c0f1e",
        "gold": "#d8bd76",
        "cream": "#f8f4ea",
        "display": "Cinzel",
        "heads": "Cinzel",
        "body": "Cormorant Garamond",
        "script": "Great Vibes",
        "orn": "\u271d",
        "tagline": "\u201cHoly, holy, holy is the Lord of hosts; the whole earth is full of his glory.\u201d",
    },
    "warm": {
        "art": "warm.jpg",
        "art_cover": "warm-cover.jpg",
        "art_inside": "warm-inside.jpg",
        "ground": "#1d2a1a",
        "gold": "#e2bd7c",
        "cream": "#fdf6e6",
        "display": "Great Vibes",
        "heads": "Cormorant Garamond",
        "body": "Cormorant Garamond",
        "script": "Great Vibes",
        "orn": "\u2767",
        "tagline": "\u201cCome to me, all who labor and are heavy laden, and I will give you rest.\u201d",
    },
    "contemporary": {
        "art": "contemporary.jpg",
        "art_cover": "contemporary-cover.jpg",
        "art_inside": "contemporary-inside.jpg",
        "ground": "#0b141c",
        "gold": "#f0b954",
        "cream": "#f2f4f6",
        "display": "Montserrat",
        "heads": "Montserrat",
        "body": "Montserrat",
        "script": "Montserrat",
        "orn": "\u2014",
        "tagline": "A place to belong. A place to believe.",
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


def _tone_class(tone) -> str:
    t = (tone or "").lower()
    if "formal" in t or "reverent" in t:
        return "tone-formal"
    if "energetic" in t or "contemporary" in t:
        return "tone-contemporary"
    if "warm" in t or "welcoming" in t:
        return "tone-warm"
    return "tone-traditional"


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


def _luminance(hex_color: str) -> float:
    """0 (black) .. 1 (white) for a #rrggbb string; 0.5 on anything unparsable."""
    try:
        h = hex_color.strip().lstrip("#")
        if len(h) == 3:
            h = "".join(c * 2 for c in h)
        r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
        return 0.2126 * r + 0.7152 * g + 0.0722 * b
    except (ValueError, TypeError, AttributeError):
        return 0.5


def _render_with_xhtml2pdf(html_content: str) -> bytes:
    """Pure-Python HTML to PDF renderer (no GTK / system deps needed)."""
    from xhtml2pdf import pisa

    out = io.BytesIO()
    pisa_status = pisa.pisaDocument(io.BytesIO(html_content.encode("utf-8")), out)
    if pisa_status.err:
        raise RuntimeError(f"xhtml2pdf rendering error: {pisa_status.err}")
    return out.getvalue()


# ---------------------------------------------------------------------------
# Page markup
# ---------------------------------------------------------------------------
def _cover_html(theme: dict, vars_: dict, input_data: dict) -> str:
    church = _esc(input_data.get("church_name") or "Church")
    date = _esc(input_data.get("service_date") or "")
    time = _esc(input_data.get("service_time") or "")
    logo_url = input_data.get("logo_url")
    orn = theme["orn"]

    hero = (
        f'<img class="logo" src="{_esc(logo_url)}" alt="">'
        if logo_url
        else ""
    )
    when = " &nbsp;<span class=\"sep\">&#9670;</span>&nbsp; ".join(
        p for p in [date, time] if p
    )

    return f"""
<section class="page cover first">
  <div class="art art-cover"></div>
  <div class="veil veil-cover"></div>
  <div class="shade"></div>
  <div class="frame"></div>
  <div class="frame-in"></div>
  <span class="corner c1">{orn}</span><span class="corner c2">{orn}</span>
  <span class="corner c3">{orn}</span><span class="corner c4">{orn}</span>
  <div class="cover-inner">
    {hero}
    <div class="kick">{_esc(vars_['kick'])}</div>
    <h1 class="church">{church}</h1>
    <div class="rule"><span>{orn}</span></div>
    <p class="tag">{_esc(theme['tagline'])}</p>
    <div class="when">{when}</div>
  </div>
</section>
"""


def _inside_html(theme: dict, vars_: dict, content: dict, input_data: dict) -> str:
    b = content.get("bulletin", {}) or {}
    church = _esc(input_data.get("church_name") or "Church")
    date = _esc(input_data.get("service_date") or "")
    time = _esc(input_data.get("service_time") or "")
    orn = theme["orn"]

    sermon = b.get("sermon_section", {}) or {}
    sermon_title = _esc(sermon.get("title") or input_data.get("sermon_title") or "")
    sermon_ref = _esc(
        sermon.get("scripture_reference") or input_data.get("scripture_reference") or ""
    )
    pastor = _esc(input_data.get("pastor_name") or "")
    ref_line = " &nbsp;&bull;&nbsp; ".join(p for p in [sermon_ref, pastor] if p)
    points = "".join(
        f"<li>{_esc(p)}</li>" for p in (sermon.get("key_points") or [])[:4]
    )

    order_items = "".join(
        f"<li class='order'><span class='what'>{_esc(i)}</span></li>"
        for i in (b.get("order_of_service") or [])[:9]
    )
    announcements = "".join(
        f"<li class='ann'>{_esc(a)}</li>" for a in (b.get("announcements") or [])[:4]
    )

    welcome = _esc(b.get("welcome_message") or "")
    prayer = _esc(b.get("prayer_requests") or "")
    offering = _esc(b.get("offering_info") or "")
    closing = _esc(b.get("closing_thought") or "")

    def section(title: str, extra_class: str = "") -> str:
        return (
            f'<h2 class="sec {extra_class}"><span class="mid">{orn}</span>'
            f"<span>{title}</span>"
            f'<span class="mid">{orn}</span></h2>'
        )

    return f"""
<section class="page inside last">
  <div class="art art-inside"></div>
  <div class="veil veil-inside"></div>
  <div class="inside-inner">
    <header class="inside-header">
      <div class="church">{church}</div>
      <div class="date">{date} &nbsp;&bull;&nbsp; {time}</div>
    </header>
    <div class="cols">
      <div class="col">
        {f'<p class="welcome">{welcome}</p>' if welcome else ''}
        {section("Order of Worship")}
        <ul class="order-list">{order_items}</ul>
        <div class="sermon-box">
          <div class="st">{sermon_title}</div>
          {f'<div class="sr">{ref_line}</div>' if ref_line else ''}
          {f'<ul class="points">{points}</ul>' if points else ''}
        </div>
      </div>
      <div class="col">
        {section("Announcements")}
        <ul class="ann-list">{announcements}</ul>
        {section("Prayer Requests", "spaced") + f'<p class="soft">{prayer}</p>' if prayer else ''}
        {section("Giving", "spaced") + f'<p class="soft">{offering}</p>' if offering else ''}
        {f'<div class="verse"><span class="vq">{closing}</span></div>' if closing else ''}
      </div>
    </div>
    <footer class="inside-footer">
      <span class="frule">{orn}</span>
      {church}
      <span class="frule">{orn}</span>
    </footer>
  </div>
</section>
"""


# ---------------------------------------------------------------------------
# Stylesheet — __TOKENS__ are substituted per tone.
# ---------------------------------------------------------------------------
_BASE_CSS = """
@page { size: Letter; margin: 0; }
* { box-sizing: border-box; }
body { margin: 0; padding: 0; font-family: '__BODY__', Georgia, serif; color: __CREAM__; }

.page { position: relative; width: 8.5in; min-height: 11in; overflow: hidden; }
.page.first { height: 11in; page-break-after: always; }

/* ---- artwork background: duotone image, then a tinted veil over it ---- */
.art { position: absolute; top: 0; left: 0; width: 8.5in; height: 11in;
  background-color: __GROUND__; background-size: cover; background-position: center;
  background-repeat: no-repeat; }
.veil { position: absolute; top: 0; left: 0; width: 8.5in; height: 11in; }

/* ---- cover ---- */
.art-cover { background-image: url('art/__ART_COVER__'); }
.veil-cover { background-color: rgba(__GROUND_RGB__, 0.40); }
/* Extra darkening top and bottom so the lettering never fights the artwork. */
.shade { position: absolute; top: 0; left: 0; width: 8.5in; height: 11in;
  background-image: linear-gradient(180deg, rgba(__GROUND_RGB__,0.80) 0%, rgba(__GROUND_RGB__,0.05) 24%, rgba(__GROUND_RGB__,0.05) 70%, rgba(__GROUND_RGB__,0.86) 100%); }
.cover-inner { position: absolute; top: 0; left: 0; right: 0; bottom: 0; padding: 0.95in 0.9in;
  text-align: center; }
.frame { position: absolute; top: 0.3in; bottom: 0.3in; left: 0.3in; right: 0.3in;
  border: 1px solid __GOLD__; }
.frame-in { position: absolute; top: 0.4in; bottom: 0.4in; left: 0.4in; right: 0.4in;
  border: 3px double __GOLD__; }
.corner { position: absolute; color: __GOLD__; font-size: 14px; }
.c1 { top: 0.2in; left: 0.26in; } .c2 { top: 0.2in; right: 0.26in; }
.c3 { bottom: 0.2in; left: 0.26in; } .c4 { bottom: 0.2in; right: 0.26in; }
.logo { max-height: 1.75in; max-width: 4.2in; margin-bottom: 0.28in; }
.kick { font-family: '__HEADS__'; font-size: 10.5pt; letter-spacing: 6px; text-transform: uppercase;
  color: __GOLD__; margin: 0.5in 0 0.22in 0; }
.cover .church { font-family: '__DISPLAY__', '__HEADS__', serif; font-size: 34pt; font-weight: bold;
  color: __GOLD__; letter-spacing: 3px; text-transform: uppercase; line-height: 1.28;
  margin: 0 0.1in; }
body.tone-warm .cover .church { text-transform: none; letter-spacing: 0; font-weight: normal;
  font-size: 52pt; color: __GOLD__; }
body.tone-contemporary .cover .church { letter-spacing: 7px; font-size: 26pt; font-weight: 800; }
.rule { display: table; width: 2.8in; margin: 0.26in auto 0.2in auto; }
.rule::before, .rule::after { content: ""; display: table-cell; width: 45%; vertical-align: middle;
  border-top: 1px solid __GOLD__; }
.rule span { display: table-cell; width: 10%; text-align: center; color: __GOLD__; font-size: 12px; }
.tag { font-family: '__SCRIPT__', cursive; font-size: 20pt; line-height: 1.5; color: __CREAM__;
  margin: 0 0.35in; }
body.tone-contemporary .tag { font-family: '__HEADS__'; font-size: 10.5pt; letter-spacing: 3px;
  text-transform: uppercase; color: __CREAM__; }
.when { position: absolute; bottom: 0.72in; left: 0; right: 0; font-family: '__HEADS__';
  font-size: 12pt; letter-spacing: 3px; text-transform: uppercase; color: __CREAM__; }
.when .sep { color: __GOLD__; }

/* ---- inside spread ---- */
.inside-inner { position: relative; min-height: 11in; padding: 0.6in 0.7in 0.55in 0.7in; }
.art-inside { background-image: url('art/__ART_INSIDE__'); }
/* Heavier than the cover on purpose: this page carries the reading text, so
   the artwork keeps only enough presence to read as paper, not as a picture
   competing with the words. */
.veil-inside { background-color: rgba(__GROUND_RGB__, 0.82); }
.inside-header { text-align: center; padding-bottom: 9px; margin-bottom: 16px;
  border-bottom: 1px solid __GOLD__; }
.inside-header .church { font-family: '__HEADS__'; font-size: 17pt; font-weight: bold;
  letter-spacing: 4px; text-transform: uppercase; color: __GOLD__; }
.inside-header .date { font-family: '__HEADS__'; font-size: 9.5pt; letter-spacing: 2.5px;
  text-transform: uppercase; color: __CREAM__; margin-top: 6px; }
.cols { display: table; width: 100%; table-layout: fixed; }
.col { display: table-cell; width: 50%; vertical-align: top; }
.col + .col { padding-left: 0.34in; }
h2.sec { font-family: '__HEADS__'; font-size: 11.5pt; letter-spacing: 2.5px; text-transform: uppercase;
  color: __GOLD__; margin: 0 0 9px 0; display: table; width: 100%; }
h2.sec.spaced { margin-top: 16px; }
h2.sec::before, h2.sec::after { content: ""; display: table-cell; width: 45%; vertical-align: middle;
  border-top: 1px solid __GOLD__; }
h2.sec .mid { display: table-cell; width: 10%; text-align: center; color: __GOLD__; font-size: 9px; }
h2.sec span:not(.mid) { display: table-cell; width: auto; white-space: normal; padding: 0 4px; }
.welcome { font-size: 12.5pt; line-height: 1.55; color: __CREAM__; margin: 0 0 16px 0; }
.welcome::first-letter { font-family: '__DISPLAY__', serif; font-size: 260%; float: left;
  line-height: 0.82; padding: 2px 7px 0 0; color: __GOLD__; }
ul.order-list, ul.ann-list, ul.points { list-style: none; margin: 0; padding: 0; }
li.order { padding: 5.5px 0; border-bottom: 1px dotted rgba(__GOLD_RGB__,0.55); font-size: 11.5pt;
  line-height: 1.45; color: __CREAM__; }
li.order .what { font-weight: 600; }
li.ann { padding: 3px 0 3px 10px; border-left: 2px solid __GOLD__; margin: 8px 0; font-size: 11.5pt;
  line-height: 1.5; color: __CREAM__; }
p.soft { font-size: 11.5pt; line-height: 1.5; color: __CREAM__; margin: 0 0 14px 0; }
.sermon-box { border: 1px solid __GOLD__; padding: 11px 12px; margin-top: 14px; text-align: center; }
.sermon-box .st { font-family: '__HEADS__'; font-size: 14pt; font-weight: bold; color: __GOLD__;
  line-height: 1.3; }
.sermon-box .sr { font-family: '__SCRIPT__', cursive; font-size: 13pt; color: __CREAM__; margin-top: 5px; }
ul.points { text-align: left; margin: 10px 0 0 0; padding: 0; }
ul.points li { font-size: 11pt; line-height: 1.5; color: __CREAM__; margin: 5px 0 0 15px;
  list-style: disc; }
.verse { text-align: center; margin-top: 18px; padding-top: 10px; border-top: 1px solid rgba(__GOLD_RGB__,0.5); }
.verse .vq { font-family: '__SCRIPT__', cursive; font-size: 16pt; color: __GOLD__; line-height: 1.5; }
body.tone-contemporary .verse .vq { font-family: '__BODY__'; font-size: 11.5pt; }
.inside-footer { position: absolute; left: 0.7in; right: 0.7in; bottom: 0.5in;
  padding-top: 9px; border-top: 1px solid __GOLD__; text-align: center;
  font-family: '__HEADS__'; font-size: 9.5pt; letter-spacing: 3px; text-transform: uppercase;
  color: __GOLD__; }
.inside-footer .frule { padding: 0 10px; font-size: 9px; }
"""


def _hex_rgb(hex_color: str) -> str:
    """'#1c3457' -> '28,52,87' for rgba() use in the stylesheet."""
    h = (hex_color or "#000000").strip().lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    try:
        return ",".join(str(int(h[i:i + 2], 16)) for i in (0, 2, 4))
    except ValueError:
        return "0,0,0"


def _build_css(theme: dict, gold: str) -> str:
    ground_rgb = _hex_rgb(theme["ground"])
    return (
        FONT_FACES
        + _BASE_CSS.replace("__PRIMARY__", theme["ground"])
        .replace("__GROUND_RGB__", ground_rgb)
        .replace("__GOLD_RGB__", _hex_rgb(gold))
        .replace("__GOLD__", gold)
        .replace("__GROUND__", theme["ground"])
        .replace("__CREAM__", theme["cream"])
        .replace("__ART_COVER__", theme["art_cover"])
        .replace("__ART_INSIDE__", theme["art_inside"])
        .replace("__DISPLAY__", theme["display"])
        .replace("__HEADS__", theme["heads"])
        .replace("__BODY__", theme["body"])
        .replace("__SCRIPT__", theme["script"])
    )


def generate_pdf(content: dict, input_data: dict) -> bytes:
    """Generate the print-ready, artwork-backed two-page bulletin PDF."""
    theme = _resolve_theme(input_data.get("tone"))

    # Gold overlay text needs to stay light against the scrim. A church's brand
    # color is honoured only when it is itself light enough to read on the dark
    # ground; otherwise the tone's gold carries the text and the brand color is
    # used where it can't hurt legibility (kept in the theme's own accents).
    brand = (input_data.get("brand_accent_color") or "").strip()
    gold = brand if brand and _luminance(brand) >= 0.62 else theme["gold"]
    if not brand:
        gold = theme["gold"]

    css = _build_css(theme, gold)
    vars_ = {"kick": "Sunday Worship", "orn": theme["orn"]}

    html_content = f"""<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>{_esc(input_data.get('church_name') or 'Bulletin')}</title>
<style>{css}</style></head>
<body class="{_tone_class(input_data.get('tone'))}">
{_cover_html(theme, vars_, input_data)}
{_inside_html(theme, vars_, content, input_data)}
</body>
</html>"""

    # WeasyPrint (production Docker image): full CSS — background art, gradients,
    # vendored @font-face, table layout, drop caps.
    try:
        from weasyprint import CSS, HTML

        return HTML(string=html_content, base_url=str(ASSETS_DIR)).write_pdf(
            stylesheets=[CSS(string=css, base_url=str(ASSETS_DIR))]
        )
    except (OSError, ImportError) as e:
        logger.info("WeasyPrint unavailable (%s); falling back to xhtml2pdf", e)
    except Exception as e:
        logger.warning("WeasyPrint failed to render (%s); falling back to xhtml2pdf", e)

    # Pure-Python fallback (dev machines without Pango). Styling degrades;
    # production always renders with WeasyPrint.
    return _render_with_xhtml2pdf(html_content)
