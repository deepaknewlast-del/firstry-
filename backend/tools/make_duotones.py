"""Derive dark, tone-matched artwork from the Gemini source images.

The bulletin lays gold text over the artwork, so the artwork must sit in the
theme's dark ground or the text stops being legible. Rather than hoping a CSS
scrim behaves the same in every renderer, the darkening is baked here once:

  art/<tone>-cover.jpg   — artwork dimmed + tinted to the tone ground; the
                           cover still reads as an image under gold lettering.
  art/<tone>-inside.jpg  — the same, pushed much darker: visible texture only,
                           behind the worship text.

    cd backend && ./.venv/Scripts/python.exe tools/make_duotones.py

Source images (art/<tone>.jpg) are never modified.
"""
import sys
from pathlib import Path

from PIL import Image, ImageEnhance, ImageOps

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from services.pdf_service import TONE_THEMES  # noqa: E402

ART_DIR = Path(__file__).resolve().parents[1] / "assets" / "art"

# How far the duotone's bright end climbs from the ground toward the gold, plus
# a brightness trim. "cover" keeps the picture legible under gold lettering;
# "inside" is texture only, well behind the worship text.
VARIANTS = {
    "cover": dict(to_gold=0.72, brightness=0.88, contrast=1.12),
    "inside": dict(to_gold=0.26, brightness=0.80, contrast=1.05),
}


def _rgb(hex_color: str) -> tuple[int, int, int]:
    h = hex_color.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def _mix(a: tuple[int, int, int], b: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def main() -> None:
    for tone, theme in TONE_THEMES.items():
        src = ART_DIR / theme["art"]
        if not src.exists():
            print(f"skip {tone}: {src.name} missing")
            continue
        ground = _rgb(theme["ground"])
        gold = _rgb(theme["gold"])
        gray = ImageOps.autocontrast(Image.open(src).convert("L"), cutoff=1)

        for variant, cfg in VARIANTS.items():
            # A duotone ramp: shadows sit on the theme ground, highlights climb
            # partway toward the gold — so the page stays dark and gold-lit
            # instead of washing out under the overlay text.
            black = _mix(ground, (0, 0, 0), 0.45)
            white = _mix(ground, gold, cfg["to_gold"])
            img = ImageOps.colorize(gray, black=black, white=white)
            img = ImageEnhance.Contrast(img).enhance(cfg["contrast"])
            img = ImageEnhance.Brightness(img).enhance(cfg["brightness"])
            out = ART_DIR / f"{tone}-{variant}.jpg"
            img.save(out, "JPEG", quality=80, optimize=True, progressive=True)
            lum = sum(img.convert("L").resize((40, 53)).get_flattened_data()) / (40 * 53)
            print(f"{out.name}: {img.size} {out.stat().st_size // 1024}KB avg-lum {lum:.0f}/255")


if __name__ == "__main__":
    main()
