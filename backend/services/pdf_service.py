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
    border-bottom: 2px solid #2c5282;
    padding-bottom: 12px;
    margin-bottom: 20px;
}
.church-name {
    font-size: 22pt;
    font-weight: bold;
    color: #2c5282;
}
.date { font-size: 12pt; color: #666; margin-top: 4px; }
.section { margin: 16px 0; }
.section-title {
    font-size: 13pt;
    font-weight: bold;
    color: #2c5282;
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


def generate_pdf(content: dict, input_data: dict) -> bytes:
    """Generate a print-ready PDF bulletin from AI content."""
    try:
        from weasyprint import CSS, HTML
    except OSError as e:
        # WeasyPrint needs GTK native libs (present on Linux/Render; on Windows
        # install GTK: https://github.com/tschoonj/GTK-for-Windows-Runtime-Environment-Installer)
        raise RuntimeError(
            "PDF engine unavailable: install GTK runtime (Windows) or deploy to Linux."
        ) from e

    bulletin = content["bulletin"]

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

    pdf_bytes = HTML(string=html_content).write_pdf(stylesheets=[CSS(string=PDF_CSS)])
    return pdf_bytes
