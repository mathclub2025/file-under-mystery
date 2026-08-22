import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont

evidence_dir = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\web\public\evidence"
os.makedirs(evidence_dir, exist_ok=True)

width, height = 640, 440

# 1. Create binary mask of the secret token
mask_img = Image.new("1", (width, height), color=0)
draw = ImageDraw.Draw(mask_img)

try:
    font_large = ImageFont.truetype("arial.ttf", 44)
    font_sub = ImageFont.truetype("arial.ttf", 22)
except:
    font_large = ImageFont.load_default()
    font_sub = ImageFont.load_default()

draw.text((120, 160), "VERIFICATION TOKEN // M77RB", fill=1, font=font_large)
draw.text((160, 230), "DR. MARROW INVARIANT PROOF RECONSTRUCTED", fill=1, font=font_sub)

mask_arr = np.array(mask_img, dtype=bool)

# 2. Generate Random One-Time Pad Noise Key (Share 1)
np.random.seed(42)
key_noise = np.random.randint(0, 2, size=(height, width), dtype=np.uint8) * 255

# 3. Generate Ciphertext Share (Share 2 = Key XOR Mask)
# Where mask is True (secret text), invert key pixel (255 - key). Where mask is False, keep key pixel.
cipher_noise = np.copy(key_noise)
cipher_noise[mask_arr] = 255 - cipher_noise[mask_arr]

# Save Share A and Share B
share_a_path = os.path.join(evidence_dir, "share_a_key.png")
share_b_path = os.path.join(evidence_dir, "share_b_cipher.png")

Image.fromarray(key_noise).save(share_a_path)
Image.fromarray(cipher_noise).save(share_b_path)

print(f"[+] Share A (Key Noise) saved: {share_a_path}")
print(f"[+] Share B (Cipher Noise) saved: {share_b_path}")
