"""
EMBED CUSTOM TRAILER IMAGE TOOL
Use this script to embed any Google Flow, Midjourney, or camera photo with forensic coordinate tags for Level 1!

Usage:
  python content-pipeline/embed_custom_trailer_image.py --input path/to/image.png --code M47H9
"""

import argparse
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont

def embed_image(input_img_path, output_img_path, code):
    if not os.path.exists(input_img_path):
        print(f"[-] Input file not found: {input_img_path}")
        return

    img = Image.open(input_img_path).convert("RGB")
    width, height = img.size

    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("arial.ttf", max(20, int(width / 50)))
    except:
        font = ImageFont.load_default()

    # Disperse character positions across the image
    positions = [
        (int(width * 0.25), int(height * 0.35)),
        (int(width * 0.45), int(height * 0.55)),
        (int(width * 0.65), int(height * 0.30)),
        (int(width * 0.78), int(height * 0.22)),
        (int(width * 0.85), int(height * 0.75)),
    ]

    for i, ch in enumerate(code[:len(positions)]):
        pos = positions[i]
        tag_text = f"{i+1}: {ch}"
        # Dark tag outline
        draw.rectangle([(pos[0] - 6, pos[1] - 4), (pos[0] + 70, pos[1] + 35)], fill=(12, 14, 18), outline=(42, 45, 50), width=1)
        draw.text(pos, tag_text, fill=(40, 45, 50), font=font)

    # Compress dynamic range down to low darkness [8, 34]
    arr = np.array(img, dtype=np.float32)
    min_v, max_v = arr.min(), arr.max()
    arr = 8.0 + (arr - min_v) / (max_v - min_v + 1e-5) * (34.0 - 8.0)
    arr = np.clip(arr, 0, 255).astype(np.uint8)

    final_img = Image.fromarray(arr)
    final_img.save(output_img_path, "PNG")
    print(f"[+] Successfully embedded code '{code}' into: {output_img_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default="apps/trailer/public/evidence/trailer_surveillance.png")
    parser.add_argument("--output", default="apps/trailer/public/evidence/trailer_surveillance.png")
    parser.add_argument("--code", default="M47H9")
    args = parser.parse_args()

    embed_image(args.input, args.output, args.code)
