import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

output_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "trailer", "public", "evidence", "trailer_surveillance.png"))
os.makedirs(os.path.dirname(output_path), exist_ok=True)

def generate_trailer_image():
    width, height = 1280, 720
    # Create base dark atmosphere with subtle structural geometry (Academic Block corridors & trees)
    img = Image.new("RGB", (width, height), (12, 14, 18))
    draw = ImageDraw.Draw(img)

    # Draw architectural outlines of AB3 building & background trees in low luminance (values 14-25)
    # Ground & building silhouette
    draw.polygon([(0, 480), (1280, 480), (1280, 720), (0, 720)], fill=(16, 18, 22))
    draw.rectangle([(200, 220), (680, 480)], fill=(22, 24, 28), outline=(32, 34, 40), width=2)
    
    # Windows grid
    for r in range(4):
        for c in range(8):
            wx = 240 + c * 50
            wy = 250 + r * 50
            draw.rectangle([(wx, wy), (wx + 30, wy + 35)], fill=(28, 30, 36), outline=(35, 38, 45))

    # Tree branches on the right
    draw.line([(880, 480), (920, 240)], fill=(24, 20, 16), width=8)
    draw.line([(920, 340), (840, 280)], fill=(20, 18, 14), width=4)
    draw.line([(920, 300), (980, 230)], fill=(20, 18, 14), width=4)

    # Embed 5 scattered forensic coordinates for the passcode: M 4 7 H 9
    # Tags: (1:M), (2:4), (3:7), (4:H), (5:9)
    tags = [
        ("1: M", (340, 290)),
        ("2: 4", (560, 380)),
        ("3: 7", (850, 260)),
        ("4: H", (960, 210)),
        ("5: 9", (1120, 560)),
    ]

    try:
        font = ImageFont.truetype("arial.ttf", 26)
    except:
        font = ImageFont.load_default()

    for text, pos in tags:
        # Subtle glowing tag border
        draw.rectangle([(pos[0] - 6, pos[1] - 4), (pos[0] + 60, pos[1] + 32)], fill=(10, 12, 16), outline=(38, 42, 48), width=1)
        draw.text(pos, text, fill=(38, 44, 48), font=font)

    # Convert to numpy array and compress dynamic range strictly into low dark interval [8, 34]
    arr = np.array(img, dtype=np.float32)
    
    # Add subtle sensor noise
    noise = np.random.normal(0, 1.2, arr.shape)
    arr = arr + noise
    
    # Normalize between 8 and 35
    min_v, max_v = arr.min(), arr.max()
    arr = 8.0 + (arr - min_v) / (max_v - min_v + 1e-5) * (34.0 - 8.0)
    arr = np.clip(arr, 0, 255).astype(np.uint8)

    final_img = Image.fromarray(arr)
    final_img.save(output_path, "PNG")
    print(f"[+] Saved Level 1 Trailer Image to {output_path}")

if __name__ == "__main__":
    generate_trailer_image()
