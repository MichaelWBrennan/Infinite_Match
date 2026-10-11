#!/usr/bin/env python3
"""Generate the PWA icons for public/icons/ from scratch (original artwork, no third-party assets).

Requires Pillow:  pip install pillow
Run from the repository root:  python3 scripts/build-pwa-icons.py
"""
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "public" / "icons"
TOP = (43, 45, 74)      # #2b2d4a
BOTTOM = (26, 26, 46)   # #1a1a2e
GOLD = (255, 215, 0)    # #ffd700
GOLD_DARK = (204, 160, 0)
GEM = (78, 205, 196)    # #4ecdc4
GEM_DARK = (68, 160, 141)
SS = 4                  # supersample factor for smooth edges


def gradient(size):
    img = Image.new("RGB", (size, size))
    d = ImageDraw.Draw(img)
    for y in range(size):
        t = y / (size - 1)
        c = tuple(round(TOP[i] + (BOTTOM[i] - TOP[i]) * t) for i in range(3))
        d.line([(0, y), (size, y)], fill=c)
    return img


def draw_mark(d, cx, cy, s):
    """Crown above a gem, centred on (cx, cy); s = size of the mark box."""
    w = s * 0.62
    base_y = cy + s * 0.12
    # crown body
    crown = [
        (cx - w / 2, base_y),
        (cx - w / 2, cy - s * 0.02),
        (cx - w * 0.25, cy + s * 0.12),
        (cx, cy - s * 0.22),
        (cx + w * 0.25, cy + s * 0.12),
        (cx + w / 2, cy - s * 0.02),
        (cx + w / 2, base_y),
    ]
    d.polygon(crown, fill=GOLD)
    d.rectangle([cx - w / 2, base_y - s * 0.07, cx + w / 2, base_y], fill=GOLD_DARK)
    for px in (cx - w / 2, cx, cx + w / 2):
        r = s * 0.035
        d.ellipse([px - r, cy - s * 0.27 - r, px + r, cy - s * 0.27 + r], fill=GOLD)
    # gem below the crown
    gy = cy + s * 0.30
    gw = s * 0.26
    gh = s * 0.20
    d.polygon([(cx - gw / 2, gy), (cx, gy - gh * 0.35), (cx + gw / 2, gy),
               (cx, gy + gh * 0.65)], fill=GEM)
    d.polygon([(cx - gw / 2, gy), (cx, gy + gh * 0.65), (cx, gy + gh * 0.2)],
              fill=GEM_DARK)


def make(size, rounded, name):
    big = size * SS
    img = gradient(big)
    mask = Image.new("L", (big, big), 0)
    md = ImageDraw.Draw(mask)
    if rounded:
        md.rounded_rectangle([0, 0, big - 1, big - 1], radius=int(big * 0.22), fill=255)
    else:
        md.rectangle([0, 0, big - 1, big - 1], fill=255)
    # maskable icons keep the mark inside the central 80% safe zone
    mark = big * (0.62 if rounded else 0.5)
    layer = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    draw_mark(ImageDraw.Draw(layer), big / 2, big / 2, mark)
    base = img.convert("RGBA")
    base.alpha_composite(layer)
    out = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    out.paste(base, (0, 0), mask)
    out = out.resize((size, size), Image.LANCZOS)
    out.save(OUT / name, "PNG", optimize=True)
    print("wrote", OUT / name, out.size)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    make(512, True, "icon-512.png")
    make(192, True, "icon-192.png")
    make(512, False, "icon-maskable-512.png")
    make(180, False, "apple-touch-icon.png")
