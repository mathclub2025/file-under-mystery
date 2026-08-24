import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont

input_img_path = r"C:\Users\91629\.gemini\antigravity\brain\8a142719-8175-4041-a935-8fb09a2a55f3\.user_uploaded\media_1787600805028.jpg"
output_img_path = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\trailer\public\evidence\trailer_surveillance.png"

def embed_seamless_shadow_tags():
    if not os.path.exists(input_img_path):
        print(f"[-] Input image not found: {input_img_path}")
        return

    orig = Image.open(input_img_path).convert("RGB")
    w, h = orig.size
    orig_arr = np.array(orig, dtype=np.float32)

    # 5 uniform, smooth deep shadow locations:
    tags = [
        ("1: M", (55, 110)),
        ("2: 4", (45, 490)),
        ("3: 7", (195, 520)),
        ("4: H", (935, 90)),
        ("5: 9", (945, 420)),
    ]

    mask = Image.new("L", (w, h), 0)
    draw = ImageDraw.Draw(mask)
    try:
        font = ImageFont.truetype("arial.ttf", 24)
    except:
        font = ImageFont.load_default()

    for text, pos in tags:
        draw.text(pos, text, fill=255, font=font)

    # Soft normalized mask [0.0, 1.0]
    mask_arr = np.array(mask, dtype=np.float32) / 255.0

    # Add a gentle, natural luminance offset (+6.5) directly blended into the local background
    # Completely merges with the dark grain (delta < 3% luminance), invisible to naked eye
    # and cleanly emerges when stretching histogram [5, 18] -> [0, 255]
    for c in range(3):
        orig_arr[:, :, c] += mask_arr * 6.5

    final_arr = np.clip(orig_arr, 0, 255).astype(np.uint8)
    final_img = Image.fromarray(final_arr)
    final_img.save(output_img_path, "PNG")
    print(f"[+] Successfully saved seamlessly blended shadow image to: {output_img_path}")

if __name__ == "__main__":
    embed_seamless_shadow_tags()
