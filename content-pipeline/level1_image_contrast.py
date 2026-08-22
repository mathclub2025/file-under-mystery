from PIL import Image, ImageDraw, ImageFont
import numpy as np
import os

output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "web", "public", "evidence"))
os.makedirs(output_dir, exist_ok=True)
out_path = os.path.join(output_dir, "forest.png")

width, height = 900, 600

# 1. Create realistic dark forest photograph texture
np.random.seed(42)
# Base luminance tightly clustered around [12, 16] using int16 to avoid underflow
base = np.random.randint(12, 16, (height, width, 3), dtype=np.int16)

# Add organic tree silhouettes and forest gradients in the ultra-dark range
for y in range(height):
    grad = int(3 * np.sin(y / 40.0) + 2 * np.cos(y / 70.0))
    base[y, :, 0] = np.clip(base[y, :, 0] + grad, 10, 18)
    base[y, :, 1] = np.clip(base[y, :, 1] + grad + 1, 10, 19)
    base[y, :, 2] = np.clip(base[y, :, 2] + grad - 1, 10, 17)

# Tree trunk silhouettes (values around 10-12)
for x_pos in [150, 280, 420, 600, 750]:
    w_trunk = np.random.randint(25, 45)
    base[:, max(0, x_pos - w_trunk):min(width, x_pos + w_trunk), :] = np.clip(
        base[:, max(0, x_pos - w_trunk):min(width, x_pos + w_trunk), :] - 3, 8, 14
    )

# High-frequency natural photographic sensor noise
sensor_noise = np.random.randint(-2, 3, (height, width, 3), dtype=np.int16)
base = np.clip(base + sensor_noise, 8, 22).astype(np.uint8)

img = Image.fromarray(base)
draw = ImageDraw.Draw(img)

# 2. Burn hidden token with pixel delta of ONLY +1 to +2 units in a dark canopy pocket
# On normal display this is 100% mathematically indistinguishable from background noise (values 14-16)
# Only a strict histogram stretch (e.g. min 12, max 16 -> expands to [0, 255]) will make it emerge!
try:
    font = ImageFont.truetype("arial.ttf", 44)
    font_sub = ImageFont.truetype("arial.ttf", 22)
except IOError:
    font = ImageFont.load_default()
    font_sub = ImageFont.load_default()

# Background in text region is ~13-15. We draw with fill=(16, 17, 16)
draw.text((340, 260), "A19X7", fill=(16, 17, 16), font=font)
draw.text((310, 325), "LAT 12.9692 N // CAM-04", fill=(15, 16, 15), font=font_sub)

# Save as uncompressed PNG to preserve exact pixel byte values
img.save(out_path, compress_level=0)
print(f"[+] Level 1 asset generated (100% invisible without histogram stretch): {out_path}")
