"""
Render the MT-Deck app-icon source (1024x1024, transparent rounded tile)
from the exact polygon geometry in the user's logo.svg, using Pillow with
4x supersampling for crisp edges. No AI generation, no watermark.

Usage:  python scripts/gen_icon.py
Output: src-tauri/app-icon-source.png   (then run `npx tauri icon src-tauri/app-icon-source.png`)
"""
import os
from PIL import Image, ImageDraw

# Brand palette (matches src/styles/variables.css)
CREAM = (239, 237, 230, 255)   # --color-ground
INK = (33, 31, 28, 255)        # --color-ink

# The two polygons from logo.svg (viewBox 0 0 99.59 93.24)
POLYS = [
    [(49.43, 33.08), (53.19, 17.27), (18.05, 17.27), (0, 93.24), (5.79, 93.24),
     (22.58, 22.54), (46.15, 22.54), (43.64, 33.08), (31.47, 33.08), (30.76, 38.36),
     (42.39, 38.36), (34.67, 70.85), (40.46, 70.85), (48.18, 38.36), (71.07, 38.36),
     (58.04, 93.24), (63.83, 93.24), (78.12, 33.08), (49.43, 33.08)],
    [(22.87, 0), (21.65, 5.28), (92.54, 5.28), (76.97, 70.85), (82.76, 70.85),
     (99.59, 0), (22.87, 0)],
]

ART_W, ART_H = 99.59, 93.24
FILL_RATIO = 0.62  # mark occupies ~62% of the tile width


def render(size: int, supersample: int = 4) -> Image.Image:
    c = size * supersample
    img = Image.new("RGBA", (c, c), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Rounded tile
    radius = int(c * 0.219)
    d.rounded_rectangle([0, 0, c - 1, c - 1], radius=radius, fill=CREAM)

    # Center the mark
    s = (FILL_RATIO * c) / ART_W
    art_w, art_h = ART_W * s, ART_H * s
    tx, ty = (c - art_w) / 2, (c - art_h) / 2
    scaled = [[(tx + x * s, ty + y * s) for (x, y) in poly] for poly in POLYS]
    for poly in scaled:
        d.polygon(poly, fill=INK)

    return img.resize((size, size), Image.LANCZOS)


if __name__ == "__main__":
    here = os.path.dirname(os.path.abspath(__file__))
    out = os.path.join(here, "..", "src-tauri", "app-icon-source.png")
    out = os.path.normpath(out)
    render(1024).save(out)
    print("wrote", out)
