PDF_CSS = """
@page {
    size: Letter;
    margin: 1.5cm 2cm;
}
body {
    font-family: 'Georgia', serif;
    color: #1a1a1a;
    font-size: 11pt;
    line-height: 1.6;
}
.header {
    text-align: center;
    border-bottom: 2px solid __ACCENT__;
    padding-bottom: 12px;
    margin-bottom: 20px;
}
.logo {
    max-height: 64px;
    max-width: 160px;
    object-fit: contain;
    margin-bottom: 10px;
}
.church-name {
    font-size: 22pt;
    font-weight: bold;
    color: __ACCENT__;
}
.date { font-size: 12pt; color: #666; margin-top: 4px; }
.section { margin: 16px 0; }
.section-title {
    font-size: 13pt;
    font-weight: bold;
    color: __ACCENT__;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 4px;
    margin-bottom: 8px;
}
.announcement-item { margin: 6px 0; padding-left: 12px; }
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

<div class="section">
    <p>{_esc(bulletin.get('welcome_message', ''))}</p>
</div>

<div class="section">
    <div class="section-title">Order of Service</div>
    {order_items}
</div>

<div class="section">
    <div class="section-title">Today's Message</div>
    <strong>{_esc(sermon.get('title', ''))}</strong><br>
    <em>{_esc(sermon.get('scripture_reference', ''))}</em>
    <ul>
      {''.join(f'<li>{_esc(p)}</li>' for p in sermon.get('key_points', []))}
    </ul>
</div>

<div class="section">
    <div class="section-title">Announcements</div>
    {announcements}
</div>

{prayer_html}
{offering_html}

<div class="section" style="margin-top: 30px; text-align: center; font-style: italic; color: #555;">
    {_esc(bulletin.get('closing_thought', ''))}
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

