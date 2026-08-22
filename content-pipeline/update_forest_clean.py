import numpy as np
from PIL import Image, ImageDraw, ImageFont

forest_path = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\web\public\evidence\forest.png"

# Load image from HEAD
img = Image.open(forest_path).convert("RGB")
w, h = img.size
arr = np.array(img, dtype=np.uint8)

# 1. Clean / Heal old bottom regions:
# Old locations were (180, 480), (460, 580), (680, 520), (920, 620), (1080, 500)
old_locs = [
    (180, 480, 80, 40),
    (460, 580, 80, 40),
    (680, 520, 80, 40),
    (920, 620, 80, 40),
    (1080, 500, 80, 40)
]

for ox, oy, ow, oh in old_locs:
    # Blend with surrounding neighborhood
    patch = arr[max(0, oy-15):min(h, oy+oh+15), max(0, ox-15):min(w, ox+ow+15)]
    med_val = np.median(patch, axis=(0, 1)).astype(np.uint8)
    arr[oy:oy+oh, ox:ox+ow] = med_val

# 2. Embed the 5 scattered coordinates across different topological heights:
# 1:A -> Upper-Left Canopy (220, 160)
# 2:1 -> Mid-Left Foliage (400, 360)
# 3:9 -> Center Trunk (640, 260)
# 4:X -> Upper-Right Pine Branch (920, 180)
# 5:7 -> Lower-Right Ground Hollow (1020, 540)
new_coords = [
    {"x": 220,  "y": 160, "text": "1:A", "delta": 4},
    {"x": 400,  "y": 360, "text": "2:1", "delta": 4},
    {"x": 640,  "y": 260, "text": "3:9", "delta": 4},
    {"x": 920,  "y": 180, "text": "4:X", "delta": 4},
    {"x": 1020, "y": 540, "text": "5:7", "delta": 4}
]

img_out = Image.fromarray(arr)
draw = ImageDraw.Draw(img_out)

try:
    font = ImageFont.truetype("arial.ttf", 34)
except:
    font = ImageFont.load_default()

for c in new_coords:
    sx, sy = c["x"], c["y"]
    tag = c["text"]
    d_val = c["delta"]
    
    crop = arr[max(0, sy-5):min(h, sy+40), max(0, sx-5):min(w, sx+80)]
    mean_col = np.mean(crop, axis=(0, 1))
    
    burn_col = (
        min(255, int(mean_col[0] + d_val)),
        min(255, int(mean_col[1] + d_val)),
        min(255, int(mean_col[2] + d_val))
    )
    draw.text((sx, sy), tag, fill=burn_col, font=font)
    print(f"[+] Placed '{tag}' at ({sx}, {sy}) with ambient {mean_col.astype(int)} -> {burn_col}")

img_out.save(forest_path, compress_level=0)
print(f"[SUCCESS] Clean forest.png saved with no duplicates: {forest_path}")
