"""Turn a generated bulletin PDF into page images for the app's preview.

A PDF in an <iframe> is fine on a desktop browser and useless on a phone,
where mobile browsers refuse to render PDFs inline at all — so a church on a
phone saw nothing where its bulletin should be. These images are the actual
PDF pages, rasterized, so the preview can never drift from what prints and
works on every device.

pdfium (via pypdfium2) is BSD-licensed, unlike the AGPL alternatives, which
matters for a commercial product.

If the renderer is unavailable, callers get an empty list and the app falls
back to the PDF itself — a preview must never break generation.
"""
import io
import logging

logger = logging.getLogger(__name__)

PREVIEW_WIDTH = 1200      # ~150dpi for a Letter page: sharp when zoomed
PREVIEW_QUALITY = 82
MAX_PAGES = 2             # the bulletin is a two-page bi-fold


def render_page_images(pdf_bytes: bytes) -> list[bytes]:
    """Rasterize the PDF's pages to WebP. Returns [] if rendering is unavailable."""
    try:
        import pypdfium2 as pdfium
    except ImportError as e:  # pragma: no cover - depends on the deploy image
        logger.info("pypdfium2 unavailable (%s); skipping page previews", e)
        return []

    images: list[bytes] = []
    try:
        pdf = pdfium.PdfDocument(io.BytesIO(pdf_bytes))
        for index in range(min(len(pdf), MAX_PAGES)):
            page = pdf[index]
            scale = PREVIEW_WIDTH / page.get_width()
            bitmap = page.render(scale=scale)
            image = bitmap.to_pil()
            buf = io.BytesIO()
            image.save(buf, "WEBP", quality=PREVIEW_QUALITY, method=4)
            images.append(buf.getvalue())
    except Exception as e:  # a preview is not worth failing a generation over
        logger.warning("Could not rasterize bulletin pages: %s", e, exc_info=True)
        return []

    logger.info("Rendered %d preview image(s)", len(images))
    return images
