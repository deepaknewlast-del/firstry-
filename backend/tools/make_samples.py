"""Render one finished sample bulletin per tone for the public template gallery.

These are not mock-ups: the markup and stylesheet come straight from
pdf_service, so the gallery on churchbulletin.in/templates cannot drift from
what a church actually gets — the cover artwork, fonts, palette and tone
wording are the product's own.

WeasyPrint (what production renders with) needs Pango and cairo, which a bare
Windows dev machine does not have — and its pure-Python fallback silently drops
all the artwork, producing gold text on white. So the samples are printed by
headless Chrome from the identical inlined HTML: the same design, rendered by
an engine that handles the CSS properly, and the file visitors download.

Run from `backend/`:

    ./.venv/Scripts/python.exe tools/make_samples.py

Outputs to `frontend/public/templates/`:
    <tone>.pdf        the downloadable sample (both pages)
    <tone>-1.webp     page one, for the gallery card
    <tone>-2.webp     page two, the inside spread
"""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND / "tools"))

from services import pdf_service as ps  # noqa: E402
from services.preview_service import render_page_images  # noqa: E402
import preview_design as pd  # noqa: E402  (reuse its asset inliner)

OUT_DIR = BACKEND.parent / "frontend" / "public" / "templates"

# Chrome/Edge are both Chromium and both accept --print-to-pdf. Set CHROME_PATH
# to override.
CHROME_CANDIDATES = (
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "google-chrome",
    "chromium",
    "chromium-browser",
    "msedge",
)

# Chrome only paints element backgrounds and background images when the page
# asks for it, and the whole design is background art with gold type over it.
PRINT_CSS = """
* { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
html, body { margin: 0; padding: 0; }
"""

# Four example services, one per tone. Deliberately different seasons, church
# sizes and worship styles — the point of the gallery is that the wording and
# the look follow the tone you pick.
SAMPLES: list[dict] = [
    {
        "key": "warm",
        "tone": "warm and welcoming",
        "input": {
            "church_name": "Grace Community Church",
            "service_date": "Sunday, 27 September 2026",
            "service_time": "10:30 AM",
            "sermon_title": "The Table of Grace",
            "pastor_name": "Rev. Daniel Okafor",
        },
        "content": {
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
                "offering_info": (
                    "Thank you for giving with a grateful heart to the work of this church."
                ),
                "closing_thought": "Go in peace. Serve the Lord with gladness.",
            }
        },
    },
    {
        "key": "traditional",
        "tone": "traditional",
        "input": {
            "church_name": "St. Andrew's Reformed Church",
            "service_date": "Sunday, 27 September 2026",
            "service_time": "9:00 AM",
            "sermon_title": "A Sure Foundation",
            "pastor_name": "Dr. Margaret Ellis",
        },
        "content": {
            "bulletin": {
                "welcome_message": (
                    "Beloved congregation, grace and peace to you. We gather this Lord's Day "
                    "to hear the Word read and preached, to sing the psalms and hymns of the "
                    "faith, and to lift our hearts together in prayer."
                ),
                "order_of_service": [
                    "Organ Prelude",
                    "Doxology — Praise God, from Whom All Blessings Flow",
                    "Invocation & Lord's Prayer",
                    "Hymn 158 — The Church's One Foundation",
                    "Old Testament Reading — Psalm 62:1-8",
                    "Sermon — A Sure Foundation",
                    "Hymn 460 — How Firm a Foundation",
                    "Congregational Prayer",
                    "Benediction & Threefold Amen",
                ],
                "sermon_section": {
                    "title": "A Sure Foundation",
                    "scripture_reference": "Psalm 62:1-8",
                    "key_points": [
                        "The world offers ground that shifts underfoot.",
                        "Silence before God is not absence, but trust.",
                        "A foundation is proved by the weight it bears.",
                    ],
                },
                "announcements": [
                    "Session meeting Tuesday, 7:30 PM in the consistory room.",
                    "Catechism class resumes Sunday at 4:00 PM.",
                    "The Lord's Supper will be celebrated on the first Sunday of October.",
                    "Flower ministry sign-up sheet is on the narthex table.",
                ],
                "prayer_requests": (
                    "For the sick among us; for the Vandenberg family; for the seminary "
                    "students we support; and for the peace of Jerusalem."
                ),
                "offering_info": (
                    "The offering today is received for the ministry of the deacons. "
                    "Envelopes are available in the pew racks."
                ),
                "closing_thought": "The Lord bless you and keep you, this day and always.",
            }
        },
    },
    {
        "key": "formal",
        "tone": "formal and reverent",
        "input": {
            "church_name": "Church of the Resurrection",
            "service_date": "Sunday, 27 September 2026",
            "service_time": "11:00 AM",
            "sermon_title": "Holy Ground",
            "pastor_name": "The Rev. Jonathan Pierce",
        },
        "content": {
            "bulletin": {
                "welcome_message": (
                    "Friends, we come before God with reverence and with joy. Whatever you "
                    "have carried in with you this morning, you are welcome here. Let us "
                    "worship him together in spirit and in truth."
                ),
                "order_of_service": [
                    "Choral Introit — O Worship the King",
                    "Processional Hymn 1 — Holy, Holy, Holy",
                    "The Collect for the Day",
                    "Scripture Reading — Exodus 3:1-12",
                    "Anthem — Be Still, My Soul",
                    "Sermon — Holy Ground",
                    "Hymn 366 — Take My Life, and Let It Be",
                    "Prayers of the People",
                    "The Grace & Blessing",
                ],
                "sermon_section": {
                    "title": "Holy Ground",
                    "scripture_reference": "Exodus 3:1-12",
                    "key_points": [
                        "God speaks where we are not looking.",
                        "Holiness begins with taking off our shoes.",
                        "We are sent from worship with a purpose.",
                    ],
                },
                "announcements": [
                    "Choir rehearsal Thursday, 7:00 PM in the choir room.",
                    "Stewardship committee meets after the service in the library.",
                    "Baptism Sunday is 11 October — speak with the pastor to take part.",
                    "The parish prayer list is updated weekly; requests may be left at the office.",
                ],
                "prayer_requests": (
                    "For those newly bereaved; for the sick and those who care for them; "
                    "for our bishop and for all who lead us in worship."
                ),
                "offering_info": (
                    "The offering is received for the mission and ministry of this parish."
                ),
                "closing_thought": "Go in the peace of God; serve him with joyful hearts.",
            }
        },
    },
    {
        "key": "contemporary",
        "tone": "energetic and contemporary",
        "input": {
            "church_name": "Riverbend Church",
            "service_date": "Sunday, 27 September 2026",
            "service_time": "10:00 AM",
            "sermon_title": "Built to Belong",
            "pastor_name": "Pastor Amy Whitfield",
        },
        "content": {
            "bulletin": {
                "welcome_message": (
                    "So glad you're here today! If this is your first time, stop by the "
                    "Welcome Desk after the service — we'd love to meet you. Grab a coffee, "
                    "find a seat, and let's worship together."
                ),
                "order_of_service": [
                    "Coffee & Welcome (in the lobby)",
                    "Worship Set — Goodness of God / Great Are You Lord",
                    "Announcement Video",
                    "Message — Built to Belong",
                    "Response Song — Build My Life",
                    "Next Steps & Prayer Team",
                ],
                "sermon_section": {
                    "title": "Built to Belong",
                    "scripture_reference": "Acts 2:42-47",
                    "key_points": [
                        "The first church didn't just gather — they did life together.",
                        "You were never meant to follow Jesus alone.",
                        "Find your table: group, serve team, or class.",
                    ],
                },
                "announcements": [
                    "Fall small groups launch this week — sign up in the lobby.",
                    "Serve day, Saturday 3 October, 8:30 AM. Bring gloves.",
                    "Kids' ministry is looking for two more volunteers for the 10 AM service.",
                    "Baptism Sunday coming up on 11 October — text BAPTISM to sign up.",
                ],
                "prayer_requests": (
                    "Pray with us for our city, for the families of the Rivera family, and "
                    "for everyone starting a new season this month."
                ),
                "offering_info": (
                    "Giving is one way we worship. You can give online at any time, or use "
                    "the boxes at the back of the room."
                ),
                "closing_thought": "You belong here. Come back next week and bring a friend.",
            }
        },
    },
]


def find_chrome() -> str | None:
    override = os.environ.get("CHROME_PATH")
    if override and Path(override).exists():
        return override
    for candidate in CHROME_CANDIDATES:
        if Path(candidate).exists():
            return candidate
        found = shutil.which(candidate)
        if found:
            return found
    return None


def build_html(sample: dict) -> str:
    """The document generate_pdf hands the PDF engine, with assets inlined.

    Fonts and tone artwork become data URIs so Chrome can render the file from
    a temp directory with nothing else to resolve.
    """
    input_data = sample["input"]
    theme = ps._resolve_theme(sample["tone"])
    css = pd._inline_assets(ps._build_css(theme, theme["gold"], theme["ground"]))
    cover = ps._cover_html(theme, {"kick": "Sunday Worship", "orn": theme["orn"]}, input_data)
    inside = ps._inside_html(theme, {"orn": theme["orn"]}, sample["content"], input_data)
    return f"""<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>{ps._esc(input_data['church_name'])}</title>
<style>{css}</style><style>{PRINT_CSS}</style></head>
<body class="{ps._tone_class(sample['tone'])}">
{cover}
{inside}
</body>
</html>"""


def print_to_pdf(chrome: str, html_path: Path, pdf_path: Path) -> None:
    """Print one HTML file to PDF. `@page { size: Letter }` in the CSS sets the
    paper size, so the output matches what the app produces."""
    profile = tempfile.mkdtemp(prefix="cp-sample-chrome-")
    try:
        result = subprocess.run(
            [
                chrome,
                "--headless=new",
                "--disable-gpu",
                "--hide-scrollbars",
                "--no-first-run",
                "--no-pdf-header-footer",
                f"--user-data-dir={profile}",
                f"--print-to-pdf={pdf_path}",
                html_path.resolve().as_uri(),
            ],
            capture_output=True,
            text=True,
            timeout=180,
        )
    finally:
        shutil.rmtree(profile, ignore_errors=True)

    if not pdf_path.exists() or pdf_path.stat().st_size == 0:
        raise RuntimeError(
            f"Chrome produced no PDF for {html_path.name}.\n{result.stdout}\n{result.stderr}"
        )


def main() -> int:
    chrome = find_chrome()
    if not chrome:
        print("No Chrome or Edge found. Install one, or set CHROME_PATH to its executable.")
        return 1
    print(f"Rendering with {chrome}\n")

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory(prefix="cp-samples-") as workdir:
        for sample in SAMPLES:
            html_path = Path(workdir) / f"{sample['key']}.html"
            html_path.write_text(build_html(sample), encoding="utf-8")

            pdf_path = OUT_DIR / f"{sample['key']}.pdf"
            print_to_pdf(chrome, html_path, pdf_path)
            pdf_bytes = pdf_path.read_bytes()

            pages = render_page_images(pdf_bytes)
            for index, image in enumerate(pages, start=1):
                (OUT_DIR / f"{sample['key']}-{index}.webp").write_bytes(image)

            print(
                f"{sample['key']:<14} {sample['input']['church_name']:<28} "
                f"pdf {len(pdf_bytes) // 1024} KB, {len(pages)} page image(s)"
            )

    print(f"\nWrote {len(SAMPLES)} sample bulletins to {OUT_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
