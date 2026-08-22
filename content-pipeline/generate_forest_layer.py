from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np
import os

out_path = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\web\public\evidence\forest.png"
width, height = 1200, 750

# 1. Create a rich, high-resolution realistic night forest landscape
# Base: Dark indigo-blue night sky at top fading into deep forest canopy
img = Image.new("RGB", (width, height), color=(10, 15, 25))
draw = ImageDraw.Draw(img)

# Sky gradient with faint moonlight glow
for y in range(250):
    alpha = int(45 * (1.0 - y / 250.0))
    draw.line([(0, y), (width, y)], fill=(12 + alpha // 4, 18 + alpha // 3, 30 + alpha))

# Moon / Ambient light disc behind trees
for r in range(80, 0, -1):
    val = int(25 + (80 - r) * 0.8)
    draw.ellipse([680 - r, 120 - r, 680 + r, 120 + r], fill=(val, val + 5, val + 15))

# Background mountain / tree ridge silhouettes (Midground: dark teal/green)
np.random.seed(99)
points_bg = [(0, 320)]
for x in range(0, width + 50, 40):
    points_bg.append((x, 260 + np.random.randint(-20, 20)))
points_bg.extend([(width, height), (0, height)])
draw.polygon(points_bg, fill=(8, 16, 20))

# Midground Pine & Oak Trees
for x_tree in range(30, width, 55):
    h_tree = np.random.randint(280, 480)
    w_tree = np.random.randint(35, 70)
    top_y = 180 + np.random.randint(-40, 40)
    # Tree trunk
    draw.rectangle([x_tree - 4, top_y + 80, x_tree + 4, height], fill=(12, 14, 16))
    # Pine foliage triangles
    for tier in range(4):
        ty = top_y + tier * 35
        tw = int(w_tree * (0.4 + tier * 0.22))
        draw.polygon([(x_tree, ty), (x_tree - tw, ty + 60), (x_tree + tw, ty + 60)], fill=(14 + np.random.randint(-3, 4), 22 + np.random.randint(-4, 5), 24))

# Foreground large textured tree trunks (silhouettes with deep shadow pockets)
trunk_positions = [120, 340, 580, 840, 1060]
for tx in trunk_positions:
    tw = np.random.randint(45, 75)
    draw.rectangle([tx - tw//2, 80, tx + tw//2, height], fill=(10, 12, 14))
    # Branches
    draw.line([(tx, 220), (tx - np.random.randint(60, 120), 160)], fill=(10, 12, 14), width=10)
    draw.line([(tx, 280), (tx + np.random.randint(60, 120), 200)], fill=(10, 12, 14), width=9)

# Forest floor ground foliage & roots
draw.rectangle([0, 580, width, height], fill=(6, 10, 12))
for fx in range(0, width, 15):
    fh = np.random.randint(10, 35)
    draw.line([(fx, 600), (fx + np.random.randint(-8, 8), 600 - fh)], fill=(12, 18, 16), width=2)

# Soft blur to create realistic photographic optical depth
img = img.filter(ImageFilter.GaussianBlur(radius=1.2))

# 2. Convert to array and embed the hidden scattered token layer in deep shadow zones
arr = np.array(img, dtype=np.uint8)

# Scattered token coordinates in deep shadow pockets:
# 1:A, 2:1, 3:9, 4:X, 5:7
scattered = [
    (180, 420, "1:A"),
    (420, 520, "2:1"),
    (620, 480, "3:9"),
    (880, 540, "4:X"),
    (1040, 440, "5:7")
]

img_burn = Image.fromarray(arr)
draw_burn = ImageDraw.Draw(img_burn)

try:
    font = ImageFont.truetype("arial.ttf", 34)
except:
    font = ImageFont.load_default()

for sx, sy, stag in scattered:
    # Read the local shadow luminance
    sub_crop = arr[sy-10:sy+35, sx-10:sx+75]
    local_mean = int(sub_crop.mean())
    # Delta of only +3 in the Blue/Green channel inside the dark shadow
    burn_col = (local_mean + 2, local_mean + 4, local_mean + 5)
    draw_burn.text((sx, sy), stag, fill=burn_col, font=font)

# Save high-res PNG
img_burn.save(out_path, compress_level=0)
print(f"[+] High-resolution realistic night forest photograph with buried shadow layer generated: {out_path}")
