"""Render the bulletin design to a standalone HTML page for local review.

Builds the exact HTML + CSS that pdf_service.py hands to WeasyPrint, inlines
the vendored fonts and tone artworks as data URIs, and writes an HTML file
showing both pages for all four tones side by side.

    cd backend && ./.venv/Scripts/python.exe tools/preview_design.py

Output: bulletin-design.html in the repo root (open it in a browser).
"""
import base64
import io
import re
import sys
from functools import lru_cache
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from services import pdf_service as ps  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parents[2]
SAMPLE_INPUT = {
    "church_name": "Grace Community Church",
    "service_date": "Sunday, 20 September 2026",
    "service_time": "10:30 AM",
    "sermon_title": "The Table of Grace",
    "pastor_name": "Rev. Daniel Okafor",
}
SAMPLE_CONTENT = {
    "bulletin": {
        "welcome_message": (
            "Welcome, friends. Whether you are visiting for the first time or have "
            "worshipped here for years, we are glad you are with us today. May this "
            "hour draw you closer to the One who first loved us."
        ),
        "order_of_service": [
            "Prelude & Welcome",
            "Hymn 42 — Great Is Thy Faithfulness",
            "Call to Worship — Psalm 100",
            "Scripture Reading — Luke 22:14-20",
            "Message — The Table of Grace",
            "Hymn 118 — Come, Thou Fount",
            "Benediction & Sending",
        ],
        "sermon_section": {
            "title": "The Table of Grace",
            "scripture_reference": "Luke 22:14-20",
            "key_points": [
                "Grace is prepared before we arrive.",
                "The table is open to the undeserving.",
                "We leave fed, forgiven, and sent.",
            ],
        },
        "announcements": [
            "Wednesday prayer meeting, 7:00 PM in the chapel.",
            "Youth outreach Saturday, 9:00 AM — meet at the east door.",
            "Harvest food drive: bring dry goods through October.",
            "New members class begins next Sunday, Room 4.",
        ],
        "prayer_requests": (
            "For the Marsh family; for those recovering at home; and for our "
            "missionaries serving in Nagaland this month."
        ),
        "offering_info": "Thank you for giving with a grateful heart to the work of this church.",
        "closing_thought": "Go in peace. Serve the Lord with gladness.",
    }
}

# Each tone gets its OWN document: page rules like body.tone-warm only behave
# correctly when a single tone's stylesheet owns the body, exactly as in the PDF.
PREVIEW_CSS = """
body { background: #20242b; margin: 0; padding: 22px 14px 40px; }
h1.pt { color: #efe6d0; font-family: Georgia, serif; font-size: 17px; letter-spacing: 2px;
  text-transform: uppercase; text-align: center; margin: 0 0 4px; }
p.ps { color: #98a1ad; font-family: Arial, sans-serif; font-size: 11px; text-align: center;
  margin: 0 0 18px; }
.stage { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
.wrap { text-align: center; }
.wrap span { display: block; color: #8f99a6; font-family: Arial, sans-serif; font-size: 10px;
  letter-spacing: 2px; text-transform: uppercase; margin: 6px 0 0; }
.sheet { width: 424px; height: 549px; overflow: hidden; position: relative; background: #fff;
  box-shadow: 0 8px 28px rgba(0,0,0,.55); }
.tk-traditional .page, .tk-formal .page, .tk-warm .page, .tk-contemporary .page {
  transform: scale(0.5196); transform-origin: top left; }
"""


# Every character the sample copy can show — the subset keeps the preview small
# without dropping a glyph the page actually renders.
CHARSET = (
    "".join(str(v) for v in list(SAMPLE_INPUT.values()) + list(SAMPLE_CONTENT["bulletin"].values()))
    + "".join(SAMPLE_CONTENT["bulletin"]["order_of_service"])
    + "".join(SAMPLE_CONTENT["bulletin"]["announcements"])
    + "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    + " .,;:!?'\"()[]&%$#@*+-/=<>|\\_~`^\u2018\u2019\u201c\u201d\u2013\u2014\u2022\u00b7\u2026\u2726\u271d\u2767\u25c6"
)


def _data_uri(path: Path, mime: str) -> str:
    return f"data:{mime};base64," + base64.b64encode(path.read_bytes()).decode()


@lru_cache(maxsize=64)
def _font_data_uri(path_str: str) -> str:
    """Subset the vendored TTF to the preview's charset and inline it as WOFF2.

    The PDF itself keeps the full TTFs (WeasyPrint embeds only used glyphs);
    this is purely so the browser preview stays a few hundred KB.
    """
    from fontTools.subset import Options, Subsetter
    from fontTools.ttLib import TTFont

    font = TTFont(path_str)
    opts = Options()
    opts.flavor = "woff2"
    subsetter = Subsetter(options=opts)
    subsetter.populate(text=CHARSET)
    subsetter.subset(font)
    buf = io.BytesIO()
    font.flavor = "woff2"
    font.save(buf)
    return "data:font/woff2;base64," + base64.b64encode(buf.getvalue()).decode()


def _inline_assets(fragment: str) -> str:
    for m in set(re.findall(r"url\('(fonts/[^']+)'\)", fragment)):
        p = ps.ASSETS_DIR / m
        if p.exists():
            fragment = fragment.replace(f"url('{m}')", f"url('{_font_data_uri(str(p))}')")
    for m in set(re.findall(r"url\('art/([^']+)'\)", fragment)):
        p = ps.ASSETS_DIR / "art" / m
        if p.exists():
            fragment = fragment.replace(f"url('art/{m}')", f"url('{_data_uri(p, 'image/jpeg')}')")
    return fragment


def build_tone(key: str, theme: dict) -> str:
    css = _inline_assets(ps._build_css(theme, theme["gold"]))
    cover = ps._cover_html(theme, {"kick": "Sunday Worship", "orn": theme["orn"]}, SAMPLE_INPUT)
    inside = ps._inside_html(theme, {"orn": theme["orn"]}, SAMPLE_CONTENT, SAMPLE_INPUT)
    return f"""<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Bulletin — {key}</title>
<style>{css}</style><style>{PREVIEW_CSS}</style></head>
<body class="tone-{key}">
<h1 class="pt">ChurchPress bulletin &mdash; {key}</h1>
<p class="ps">Cover (left) and inside spread (right), shown at ~48% of print size.</p>
<div class="stage">
  <div class="wrap"><div class="sheet">{cover}</div><span>Cover</span></div>
  <div class="wrap"><div class="sheet">{inside}</div><span>Inside spread</span></div>
</div>
</body></html>"""


SHELL_100 = """body { background: #23272e; margin: 0; padding: 8px 0 0; }
.sheet { width: 408px; height: 1056px; overflow: hidden; position: relative;
  margin: 0 auto; background: #fff; box-shadow: 0 8px 30px rgba(0,0,0,.6); }
.sheet > .page { transform: none; }
"""

SHELL_FIT = """body { background: #23272e; margin: 0; padding: 8px 0 0; }
.sheet { width: 424px; height: 549px; overflow: hidden; position: relative;
  margin: 0 auto; background: #fff; box-shadow: 0 8px 30px rgba(0,0,0,.6); }
.sheet > .page { transform: scale(0.5196); transform-origin: top left; }
"""


def build_focus(key: str, theme: dict, which: str = "inside", zoom: str = "fit") -> str:
    """A single page: scaled to fit, or at true print size for a readability check.

    'size' shows the left column at 100% — the exact type size that comes out of
    the printer, which a half-scale page preview cannot answer.
    """
    css = _inline_assets(ps._build_css(theme, theme["gold"]))
    page = (
        ps._cover_html(theme, {"kick": "Sunday Worship", "orn": theme["orn"]}, SAMPLE_INPUT)
        if which == "cover"
        else ps._inside_html(theme, {"orn": theme["orn"]}, SAMPLE_CONTENT, SAMPLE_INPUT)
    )
    if zoom == "size":
        # 408px = the 8.5in page at 96dpi, cropped to the left column's width, so
        # the type is shown at exactly the size the printer produces.
        shell = SHELL_100
    else:
        shell = SHELL_FIT
    return f"""<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>{key} — {which} — {zoom}</title>
<style>{css}</style><style>{shell}</style></head>
<body class="tone-{key}"><div class="sheet">{page}</div></body></html>"""


def _scope_css(css: str, tone: str) -> str:
    """Prefix every selector with the tone's wrapper so four tones can share
    one document (in a PDF there is only ever one tone, so it needs no scoping)."""
    wrap = f".tk-{tone}"
    css = css.replace("body.tone-", f"{wrap}.tone-")
    out = []
    for m in re.finditer(r"([^{}]+)\{([^{}]*)\}", css, re.S):
        sel, body = m.group(1).strip(), m.group(2)
        if sel.startswith("@"):
            out.append(f"{sel}{{{body}}}")
            continue
        parts = []
        for p in (s.strip() for s in sel.split(",")):
            if p.startswith(wrap) or f".tone-" in p:
                parts.append(p)
            elif p == "body":
                parts.append(wrap)
            else:
                parts.append(f"{wrap} {p}")
        out.append(",".join(parts) + "{" + body + "}")
    return "".join(out)


def build_index() -> str:
    """All four tones in one scrollable page: cover, then inside spread."""
    blocks = []
    for key, theme in ps.TONE_THEMES.items():
        css = _scope_css(_inline_assets(ps._build_css(theme, theme["gold"])), key)
        cover = ps._cover_html(theme, {"kick": "Sunday Worship", "orn": theme["orn"]}, SAMPLE_INPUT)
        inside = ps._inside_html(theme, {"orn": theme["orn"]}, SAMPLE_CONTENT, SAMPLE_INPUT)
        blocks.append(
            f"<style>{css}</style>\n<div class='tk-{key}'>"
            f"<h2 class='tone'>{key}</h2>"
            f"<div class='stage'><div class='wrap'><div class='sheet'>{cover}</div>"
            f"<span>Cover</span></div>"
            f"<div class='wrap'><div class='sheet'>{inside}</div>"
            f"<span>Inside spread</span></div></div></div>"
        )
    return f"""<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Bulletin designs</title><style>{PREVIEW_CSS}
h2.tone {{ color: #f0d9a0; font-family: Arial, sans-serif; font-size: 12px;
  letter-spacing: 4px; text-transform: uppercase; text-align: center;
  margin: 26px 0 12px; }}</style></head>
<body><h1 class="pt">ChurchPress bulletin &mdash; tone designs</h1>
<p class="ps">Every tone, cover then inside spread. Scroll to compare.</p>
{''.join(blocks)}
</body></html>"""


if __name__ == "__main__":
    if len(sys.argv) >= 2 and sys.argv[1] == "focus":
        key = sys.argv[2] if len(sys.argv) > 2 else "traditional"
        which = sys.argv[3] if len(sys.argv) > 3 else "inside"
        zoom = sys.argv[4] if len(sys.argv) > 4 else "fit"
        out = REPO_ROOT / "bulletin-design" / "focus.html"
        out.parent.mkdir(exist_ok=True)
        out.write_text(build_focus(key, ps.TONE_THEMES[key], which, zoom), encoding="utf-8")
        print(f"wrote {out} ({key} / {which} / {zoom})")
        raise SystemExit(0)

    (REPO_ROOT / "bulletin-design").mkdir(exist_ok=True)
    for key, theme in ps.TONE_THEMES.items():
        out = REPO_ROOT / "bulletin-design" / f"{key}.html"
        out.write_text(build_tone(key, theme), encoding="utf-8")
        print(f"wrote {out}")
    idx = REPO_ROOT / "bulletin-design.html"
    idx.write_text(build_index(), encoding="utf-8")
    print(f"wrote {idx}")
