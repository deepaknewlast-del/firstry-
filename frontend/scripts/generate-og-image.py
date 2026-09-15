"""Render frontend/public/og-image.png (1200x630) in the ChurchPress brand style.

Run from the repo root:  python frontend/scripts/generate-og-image.py
Requires Pillow. Re-run it after any brand or headline change.
"""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
OUT = Path(__file__).resolve().parents[1] / "public" / "og-image.png"

# Brand
PLUM_DEEP = (24, 10, 28)
PLUM_TOP = (47, 17, 52)
GOLD_LIGHT = (240, 217, 155)
GOLD = (217, 169, 59)
GOLD_DARK = (168, 122, 22)
PLUM_INK = (42, 14, 47)
CREAM = (251, 247, 240)
MUTED = (201, 174, 205)

SERIF_CANDIDATES = [
    "C:/Windows/Fonts/georgiab.ttf",
    "C:/Windows/Fonts/georgia.ttf",
    "/System/Library/Fonts/Supplemental/Georgia Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
]
SERIF_REGULAR = [
    "C:/Windows/Fonts/georgia.ttf",
    "/System/Library/Fonts/Supplemental/Georgia.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf",
]
SANS_CANDIDATES = [
    "C:/Windows/Fonts/segoeui.ttf",
    "C:/Windows/Fonts/arial.ttf",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
]


def load_font(candidates: list[str], size: int) -> ImageFont.FreeTypeFont:
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default(size)


def lerp(a: int, b: int, t: float) -> int:
    return int(a + (b - a) * t)


def background() -> Image.Image:
    """Vertical plum gradient with a warm glow behind the seal."""
    img = Image.new("RGB", (W, H), PLUM_DEEP)
    draw = ImageDraw.Draw(img)
    for y in range(H):
        t = y / H
        draw.line([(0, y), (W, y)], fill=(lerp(PLUM_TOP[0], PLUM_DEEP[0], t), lerp(PLUM_TOP[1], PLUM_DEEP[1], t), lerp(PLUM_TOP[2], PLUM_DEEP[2], t)))
    return img


def draw_seal(img: Image.Image, cx: int, cy: int, radius: int) -> None:
    """The brand seal: gold coin with an inner rule, a cross and an open book."""
    draw = ImageDraw.Draw(img, "RGBA")

    # Soft shadow beneath the coin
    for i in range(14, 0, -1):
        alpha = int(6 + (14 - i) * 1.6)
        draw.ellipse(
            [cx - radius - i, cy - radius + 6, cx + radius + i, cy + radius + 10],
            fill=(0, 0, 0, alpha),
        )

    # Gold gradient coin, drawn as horizontal chords so it stays smooth.
    for y in range(cy - radius, cy + radius + 1):
        dy = y - cy
        half = math.sqrt(max(radius * radius - dy * dy, 0))
        t = (y - (cy - radius)) / (radius * 2)
        if t < 0.30:
            s = t / 0.30
            color = (lerp(GOLD_LIGHT[0], GOLD[0], s), lerp(GOLD_LIGHT[1], GOLD[1], s), lerp(GOLD_LIGHT[2], GOLD[2], s))
        elif t < 0.62:
            s = (t - 0.30) / 0.32
            color = (lerp(GOLD[0], GOLD_DARK[0], s), lerp(GOLD[1], GOLD_DARK[1], s), lerp(GOLD[2], GOLD_DARK[2], s))
        else:
            s = (t - 0.62) / 0.38
            color = (lerp(GOLD_DARK[0], 226, s), lerp(GOLD_DARK[1], 195, s), lerp(GOLD_DARK[2], 119, s))
        draw.line([(cx - half, y), (cx + half, y)], fill=color)

    # Rim + inner engraved rule
    draw.ellipse([cx - radius, cy - radius, cx + radius, cy + radius], outline=(110, 76, 18, 255), width=2)
    inner = int(radius * 0.833)
    draw.ellipse([cx - inner, cy - inner, cx + inner, cy + inner], outline=(61, 28, 68, 110), width=2)

    # Cross
    arm = int(radius * 0.093)
    top = cy - int(radius * 0.523)
    bottom = cy - int(radius * 0.028)
    draw.rectangle([cx - arm, top, cx + arm, bottom], fill=PLUM_INK)
    bar_y = cy - int(radius * 0.352)
    draw.rectangle([cx - int(radius * 0.142), bar_y, cx + int(radius * 0.142), bar_y + arm * 2], fill=PLUM_INK)

    # Open book — two leaves meeting at the spine
    book_top = cy + int(radius * 0.209)
    spine = cy + int(radius * 0.464)
    left = cx - int(radius * 0.634)
    right = cx + int(radius * 0.634)
    draw.polygon(
        [
            (left, book_top + 8),
            (cx, book_top - 4),
            (cx, spine),
            (left, book_top + 22),
        ],
        fill=PLUM_INK,
    )
    draw.polygon(
        [
            (right, book_top + 8),
            (cx, book_top - 4),
            (cx, spine),
            (right, book_top + 22),
        ],
        fill=PLUM_INK,
    )
    draw.line([(cx, book_top - 2), (cx, spine)], fill=GOLD_LIGHT, width=2)

    # Page striations
    for i, offset in enumerate((10, 17)):
        y = book_top + offset
        draw.line([(left + 16, y), (cx - 14, y + 4)], fill=GOLD, width=2)
        draw.line([(right - 16, y), (cx + 14, y + 4)], fill=GOLD, width=2)


def main() -> None:
    img = background()
    draw = ImageDraw.Draw(img, "RGBA")

    # Warm glow behind the seal column
    for i in range(60, 0, -1):
        draw.ellipse([260 - i * 5, 300 - i * 5, 260 + i * 5, 300 + i * 5], fill=(217, 169, 59, 2))

    draw_seal(img, 155, 315, 96)

    # Wordmark
    f_mark = load_font(SERIF_CANDIDATES, 44)
    draw.text((300, 132), "Church", font=f_mark, fill=CREAM)
    w_church = draw.textlength("Church", font=f_mark)
    draw.text((300 + w_church, 132), "Press", font=f_mark, fill=GOLD)

    # Headline
    f_head = load_font(SERIF_CANDIDATES, 62)
    draw.text((300, 208), "The whole week's", font=f_head, fill=CREAM)
    draw.text((300, 278), "church communication", font=f_head, fill=GOLD)
    draw.text((300, 348), "in one sitting.", font=f_head, fill=CREAM)

    # Rule
    draw.line([(302, 448), (1130, 448)], fill=(217, 169, 59, 90), width=2)

    # Delivered pieces
    f_small = load_font(SANS_CANDIDATES, 23)
    draw.text(
        (300, 476),
        "Bulletin  ·  Announcement slides  ·  Social posts  ·  Email newsletter",
        font=f_small,
        fill=MUTED,
    )

    # Footer
    f_foot = load_font(SANS_CANDIDATES, 21)
    draw.text((300, 534), "churchpress.ai", font=f_foot, fill=GOLD)
    draw.text((300, 566), "Three bulletins free — no card required.", font=f_foot, fill=(150, 126, 156))

    img.save(OUT, "PNG", optimize=True)
    print(f"wrote {OUT} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
