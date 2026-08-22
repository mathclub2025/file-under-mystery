import numpy as np
from PIL import Image, ImageDraw
import os

output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "web", "public", "evidence"))
os.makedirs(output_dir, exist_ok=True)
out_path = os.path.join(output_dir, "signal_fft.png")

size = 256

# 1. Create watermark image with text "FIN4L"
watermark = Image.new("L", (size, size), 0)
draw = ImageDraw.Draw(watermark)
draw.text((75, 115), "FIN4L", fill=255)
wm_arr = np.array(watermark, dtype=np.float64)

# 2. Build 2D frequency spectrum with a synthetic annular harmonic ring at radius r ~ 50
F_spectrum = np.zeros((size, size), dtype=np.complex128)
cx, cy = size // 2, size // 2
target_r = 50

for y in range(size):
    for x in range(size):
        r = np.sqrt((x - cx) ** 2 + (y - cy) ** 2)
        if abs(r - target_r) <= 3:
            # Map watermark pixels into this harmonic frequency band
            F_spectrum[y, x] = wm_arr[y, x] * 3000.0 * np.exp(1j * np.random.uniform(0, 2*np.pi))

# Add standard low-frequency natural falloff
for y in range(size):
    for x in range(size):
        r = np.sqrt((x - cx) ** 2 + (y - cy) ** 2) + 1.0
        if r > 4:
            F_spectrum[y, x] += (10000.0 / (r ** 1.2)) * np.exp(1j * np.random.uniform(0, 2*np.pi))

# 3. Compute 2D Inverse FFT to generate synthetic spatial noise
spatial = np.fft.ifft2(np.fft.ifftshift(F_spectrum))
spatial_mag = np.abs(spatial)

# Normalize spatial intensities to 0-255 uint8
spatial_norm = (spatial_mag - spatial_mag.min()) / (spatial_mag.max() - spatial_mag.min()) * 255.0
spatial_img = Image.fromarray(spatial_norm.astype(np.uint8))
spatial_img.save(out_path)
print(f"[+] Level 8 2D FFT signal asset generated: {out_path}")
