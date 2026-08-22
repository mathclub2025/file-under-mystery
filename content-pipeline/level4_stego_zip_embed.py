import urllib.request
import zipfile
import io
import numpy as np
from PIL import Image
import os

output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "web", "public", "evidence"))
os.makedirs(output_dir, exist_ok=True)
out_path = os.path.join(output_dir, "holiday.png")

# 1. Download real photograph
url = "https://picsum.photos/id/1015/960/640"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
try:
    with urllib.request.urlopen(req) as resp:
        img_bytes = resp.read()
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
except Exception as e:
    print("Fallback local generation:", e)
    img = Image.new("RGB", (960, 640), color=(100, 140, 180))

# 2. Build real ZIP archive in memory
zip_buf = io.BytesIO()
with zipfile.ZipFile(zip_buf, "w", zipfile.ZIP_DEFLATED) as zf:
    zf.writestr("equation.txt", "DEPARTMENT OF MATHEMATICS // RECOVERED LEDGER\nDr. Elias Marrow - Private Computation Notes\n\nTo determine verification token, solve the linear invariant:\n7x - 3 = 11x + 25\n\nSolution -> -4x = 28 -> x = -7\nMap value through Event Card Table: [-7] => M77RB")

zip_bytes = zip_buf.getvalue()
zip_len = len(zip_bytes)
print(f"[*] Embedding genuine ZIP payload: {zip_len} bytes")

# Convert length + payload to bits
header_bits = [int(b) for b in format(zip_len, '032b')]
payload_bits = []
for b in zip_bytes:
    payload_bits.extend([int(x) for x in format(b, '08b')])

all_bits = header_bits + payload_bits

# 3. Embed into Blue channel LSB
arr = np.array(img, dtype=np.uint8)
blue = arr[:, :, 2].flatten()

for i, bit in enumerate(all_bits):
    if i < len(blue):
        blue[i] = (int(blue[i]) & 0xFE) | bit

arr[:, :, 2] = blue.reshape(arr[:, :, 2].shape)
result_img = Image.fromarray(arr)
result_img.save(out_path, compress_level=0)
print(f"[+] Level 4 asset generated with real photo: {out_path}")
