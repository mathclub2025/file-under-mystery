import numpy as np
from PIL import Image, ImageDraw, ImageFont
import os

output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "web", "public", "evidence"))
os.makedirs(output_dir, exist_ok=True)
img_path = os.path.join(output_dir, "shredded_notes.png")
txt_path = os.path.join(output_dir, "cipher_block.txt")

# 1. Generate realistic shredded paper strip raster image
width, height = 700, 220
img = Image.new("RGB", (width, height), color=(240, 235, 220))
draw = ImageDraw.Draw(img)

# Paper texture and torn edges
for x in range(0, width, 4):
    y_top = np.random.randint(5, 15)
    y_bot = height - np.random.randint(5, 15)
    draw.line([(x, y_top), (x, y_bot)], fill=(245 + np.random.randint(-5, 5), 240 + np.random.randint(-5, 5), 225 + np.random.randint(-5, 5)))

# Shred lines / tear marks
for x in [120, 280, 440, 580]:
    for y in range(20, height - 20, 3):
        if np.random.rand() > 0.3:
            draw.point((x + np.random.randint(-1, 2), y), fill=(180, 170, 150))

# Hand-written / printed prime sequence and decipher fragment
draw.text((30, 30), "DEPARTMENT OF MATHEMATICS // FRAGMENT #05", fill=(100, 90, 80))
draw.text((30, 60), "RECOVERED STRIP: PRIME INDICES SEQUENCE:", fill=(40, 40, 50))
draw.text((30, 95), "[ 219 ,  163 ,  97 ,  59 ]", fill=(180, 20, 20))
draw.text((30, 140), "PRIMARY CIPHERTEXT: WKH DQVZHU LV KLGGHQ (DECOY CAESAR)", fill=(80, 80, 90))
draw.text((30, 170), "SECONDARY TARGET STREAM: ETLVGTUJTATE", fill=(20, 20, 40))

img.save(img_path)
print(f"[+] Level 5 raster asset generated: {img_path}")

# 2. Write raw cipher data file
cipher_content = """DEPARTMENT OF MATHEMATICS // EVIDENCE ARCHIVE 05
Dr. Elias Marrow - Cross-Cut Shredder Residue

[PRIME INDICES STREAM]
Index 1: 219 -> Prime = 1367 -> Modulo 26 Shift = 15
Index 2: 163 -> Prime = 967  -> Modulo 26 Shift = 5
Index 3: 97  -> Prime = 509  -> Modulo 26 Shift = 15
Index 4: 59  -> Prime = 277  -> Modulo 26 Shift = 17

[CIPHERTEXT BLOCK]
ETLVGTUJTATE

[DECRYPTION RESULT]
POWER OF SEVEN -> Token: P0W3R
"""
with open(txt_path, "w", encoding="utf-8") as f:
    f.write(cipher_content)
print(f"[+] Level 5 data text asset generated: {txt_path}")
