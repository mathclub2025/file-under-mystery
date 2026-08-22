from PIL import Image, ImageDraw, ImageFont
import numpy as np
import os

forest_path = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\web\public\evidence\forest.png"

# Open original clean forest image
img = Image.open(forest_path).convert("RGB")
w, h = img.size
arr = np.array(img, dtype=np.uint8)

# The 5 scattered coordinates across different topological regions of the forest:
# 1:A -> Upper-left tree canopy (x=220, y=160)
# 2:1 -> Mid-left dense foliage shadow (x=390, y=370)
# 3:9 -> Central tree trunk texture (x=630, y=270)
# 4:X -> Upper-right pine needle canopy (x=930, y=190)
# 5:7 -> Lower-right ground root hollow (x=1020, y=550)
scattered_tags = [
    {"x": 220,  "y": 160, "text": "1:A", "delta": (6, 2, 5)},   # Magenta/Red-tinted subtle delta
    {"x": 390,  "y": 370, "text": "2:1", "delta": (1, 6, 2)},   # Green-tinted subtle delta
    {"x": 630,  "y": 270, "text": "3:9", "delta": (5, 5, 1)},   # Amber/Yellow-tinted subtle delta
    {"x": 930,  "y": 190, "text": "4:X", "delta": (2, 2, 6)},   # Cyan/Blue-tinted subtle delta
    {"x": 1020, "y": 550, "text": "5:7", "delta": (2, 6, 5)}    # Emerald/Cyan-tinted subtle delta
]

# Create drawing canvas
img_drawn = Image.fromarray(arr)
draw = ImageDraw.Draw(img_drawn)

try:
    font = ImageFont.truetype("arial.ttf", 34)
except:
    font = ImageFont.load_default()

for item in scattered_tags:
    sx, sy = item["x"], item["y"]
    tag = item["text"]
    dr, dg, db = item["delta"]
    
    # Calculate local ambient color in the 80x50 neighborhood
    crop = arr[max(0, sy-10):min(h, sy+45), max(0, sx-10):min(w, sx+90)]
    mean_r = int(np.mean(crop[:, :, 0]))
    mean_g = int(np.mean(crop[:, :, 1]))
    mean_b = int(np.mean(crop[:, :, 2]))
    
    # Embed text with subtle delta perfectly submerged in local ambient color
    burn_color = (
        min(255, mean_r + dr),
        min(255, mean_g + dg),
        min(255, mean_b + db)
    )
    
    draw.text((sx, sy), tag, fill=burn_color, font=font)
    print(f"Embedded '{tag}' at ({sx}, {sy}) with ambient ({mean_r}, {mean_g}, {mean_b}) -> burn {burn_color}")

# Save without compression degradation
img_drawn.save(forest_path, compress_level=0)
print(f"[SUCCESS] forest.png updated with 5 multi-spectral scattered coordinates: {forest_path}")
