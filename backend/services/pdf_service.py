PDF_CSS = """
@page {
    size: Letter;
    margin: 0;
}
body {
    font-family: 'Liberation Serif', 'DejaVu Serif', Georgia, serif;
    color: #24292f;
    font-size: 10.5pt;
    line-height: 1.55;
    background: #faf7f2;
}
/* ---- Header band: full-bleed accent color ---- */
.header {
    background: __ACCENT__;
    color: #ffffff;
    text-align: center;
    padding: 28px 2cm 22px 2cm;
    margin: 0 0 24px 0;
}
.logo {
    max-height: 72px;
    max-width: 180px;
    object-fit: contain;
    margin-bottom: 10px;
}
.church-name {
    font-size: 26pt;
    font-weight: bold;
    letter-spacing: 1px;
    color: #ffffff;
}
.date {
    font-size: 11pt;
    color: rgba(255,255,255,0.92);
    margin-top: 6px;
    letter-spacing: 0.5px;
}
/* ---- Content column ---- */
.content { padding: 0 1.9cm 1.6cm 1.9cm; }
.section { margin: 18px 0; }
.section-title {
    font-size: 12.5pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: __ACCENT__;
    border-bottom: 2px solid __ACCENT__;
    padding-bottom: 4px;
    margin-bottom: 10px;
}
.section p { margin: 6px 0; }
.announcement-item {
    margin: 5px 0;
    padding-left: 14px;
    border-left: 3px solid __ACCENT__;
}
.sermon-title { font-size: 13pt; font-weight: bold; color: #24292f; }
.sermon-ref { font-style: italic; color: __ACCENT__; }
ul { margin: 6px 0 6px 18px; padding: 0; }
li { margin: 3px 0; }
.closing {
    margin-top: 28px;
    text-align: center;
    font-style: italic;
    color: #6b7280;
    border-top: 1px solid #e5ddd0;
    padding-top: 14px;
}
"""


def _esc(text: str) -> str:
    """Escape text for safe embedding in HTML."""
    return (
        str(text)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


import io
import logging

logger = logging.getLogger(__name__)


def _render_with_xhtml2pdf(html_content: str) -> bytes:
    """Pure-Python HTML to PDF renderer using xhtml2pdf (no GTK / system deps needed)."""
    from xhtml2pdf import pisa

    out = io.BytesIO()
    pisa_status = pisa.pisaDocument(io.BytesIO(html_content.encode("utf-8")), out)
    if pisa_status.err:
        raise RuntimeError(f"xhtml2pdf rendering error: {pisa_status.err}")
    return out.getvalue()


def generate_pdf(content: dict, input_data: dict) -> bytes:
    """Generate a print-ready PDF bulletin from AI content."""
    # Check if WeasyPrint is available (preferred on Linux/Docker with GTK)
    weasyprint_available = False
    try:
        from weasyprint import CSS, HTML
        weasyprint_available = True
    except (OSError, ImportError) as e:
        logger.info(
            "WeasyPrint unavailable (%s); falling back to pure-Python xhtml2pdf engine", e
        )


    bulletin = content["bulletin"]
    accent = input_data.get("brand_accent_color") or "#2c5282"
    logo_url = input_data.get("logo_url")

    order_items = "".join(
        f"<div class='announcement-item'>&bull; {_esc(item)}</div>"
        for item in bulletin.get("order_of_service", [])
    )
    announcements = "".join(
        f"<div class='announcement-item'>&bull; {_esc(a)}</div>" for a in bulletin.get("announcements", [])
    )

    prayer_html = ""
    if bulletin.get("prayer_requests"):
        prayer_html = (
            "<div class='section'><div class='section-title'>Prayer Requests</div><p>"
            f"{_esc(bulletin['prayer_requests'])}</p></div>"
        )

    offering_html = ""
    if bulletin.get("offering_info"):
        offering_html = (
            "<div class='section'><div class='section-title'>Giving</div><p>"
            f"{_esc(bulletin['offering_info'])}</p></div>"
        )

    sermon = bulletin.get("sermon_section", {})
    sermon_points = "".join(f"<li>{_esc(p)}</li>" for p in sermon.get("key_points", []))
    html_content = f"""
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body>
<div class="header">
    {f'<img class="logo" src="{_esc(logo_url)}" alt="">' if logo_url else ''}
    <div class="church-name">{_esc(input_data.get('church_name', 'Church'))}</div>
    <div class="date">{_esc(input_data.get('service_date'))} | {_esc(input_data.get('service_time', '10:00 AM'))}</div>
</div>

<div class="content">
<div class="section">
    <p>{_esc(bulletin.get('welcome_message', ''))}</p>
</div>

<div class="section">
    <div class="section-title">Order of Service</div>
    {order_items}
</div>

<div class="section">
    <div class="section-title">Today's Message</div>
    <div class="sermon-title">{_esc(sermon.get('title', ''))}</div>
    <div class="sermon-ref">{_esc(sermon.get('scripture_reference', ''))}</div>
    <ul>
      {sermon_points}
    </ul>
</div>

<div class="section">
    <div class="section-title">Announcements</div>
    {announcements}
</div>

{prayer_html}
{offering_html}

<div class="closing">
    {_esc(bulletin.get('closing_thought', ''))}
</div>
</div>
</body>
</html>"""

    css_string = PDF_CSS.replace("__ACCENT__", accent)
    if weasyprint_available:
        try:
            return HTML(string=html_content).write_pdf(
                stylesheets=[CSS(string=css_string)]
            )
        except Exception as e:
            logger.warning(
                "WeasyPrint failed to render PDF (%s); falling back to xhtml2pdf", e
            )

    # Pure-Python fallback (Windows without GTK or Linux without system dependencies)
    styled_html = html_content.replace(
        "<head><meta charset=\"UTF-8\"></head>",
        f"<head><meta charset=\"UTF-8\"><style>{css_string}</style></head>",
    )
    return _render_with_xhtml2pdf(styled_html)

