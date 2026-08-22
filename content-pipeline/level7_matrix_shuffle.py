from PIL import Image, ImageDraw, ImageFont
import numpy as np
import os

output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "web", "public", "evidence"))
os.makedirs(output_dir, exist_ok=True)
out_path = os.path.join(output_dir, "scrambled_page.png")

# 1. Create original notebook page (512x512)
size = 512
img = Image.new("RGB", (size, size), color=(245, 240, 230))
draw = ImageDraw.Draw(img)

# Draw notebook grid lines
for y in range(40, size, 24):
    draw.line([(30, y), (size - 30, y)], fill=(210, 220, 235), width=1)

# Draw Dr. Marrow's handwriting & equations
draw.text((40, 50), "THE MARROW CONJECTURE // PROOF SKETCH", fill=(40, 40, 60))
draw.text((40, 100), "Let M be the non-singular harmonic operator over H^n.", fill=(30, 30, 40))
draw.text((40, 150), "det(M - lambda I) = 0 yields eigenvalues on critical line.", fill=(30, 30, 40))
draw.text((40, 200), "VERIFICATION KEYWORD: [ BXZ19 ]", fill=(180, 20, 20))
draw.rectangle([35, 195, 320, 225], outline=(200, 30, 30), width=2)
draw.text((40, 270), "Invariant preserved under affine permutation inversion.", fill=(30, 30, 40))
draw.text((40, 340), "Signature: E. Marrow - Dept of Mathematics", fill=(60, 60, 80))

# 2. Perform 8x8 block permutation
grid_size = 8
tile_w = size // grid_size
tile_h = size // grid_size

tiles = []
for row in range(grid_size):
    for col in range(grid_size):
        box = (col * tile_w, row * tile_h, (col + 1) * tile_w, (row + 1) * tile_h)
        tiles.append(img.crop(box))

# Deterministic permutation vector
np.random.seed(31415)
perm = np.random.permutation(grid_size * grid_size)

scrambled_img = Image.new("RGB", (size, size))
for i, p_idx in enumerate(perm):
    col = i % grid_size
    row = i // grid_size
    scrambled_img.paste(tiles[p_idx], (col * tile_w, row * tile_h))

# Apply 90 deg rotation and transpose to finalize the puzzle
final_scramble = scrambled_img.rotate(270).transpose(Image.FLIP_LEFT_RIGHT)
final_scramble.save(out_path)
print(f"[+] Level 7 scrambled matrix page generated: {out_path}")
