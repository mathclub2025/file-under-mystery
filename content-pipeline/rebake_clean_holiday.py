import os
import glob
import io
import zipfile
import numpy as np
from PIL import Image

manual_dir = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\web\public\evidence\manual generated"
evidence_dir = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\web\public\evidence"

holiday_files = glob.glob(os.path.join(manual_dir, "*Professor_reading_notebook*"))
if holiday_files:
    holiday_src = holiday_files[0]
    print(f"[*] Re-baking Level 4 Holiday Stego Photo without any solved answers: {holiday_src}")
    img = Image.open(holiday_src).convert("RGB")
    img = img.resize((1200, 800), Image.Resampling.LANCZOS)

    # Clean unsolved equation text
    raw_content = (
        "DEPARTMENT OF MATHEMATICS // RECOVERED LEDGER\n"
        "Dr. Elias Marrow - Private Computation Notes\n\n"
        "To determine verification token, solve the linear invariant:\n"
        "7x - 3 = 11x + 25\n\n"
        "Lookup the calculated integer root in the Ledger Index Matrix below."
    )

    zip_buf = io.BytesIO()
    with zipfile.ZipFile(zip_buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("equation.txt", raw_content)

    zip_bytes = zip_buf.getvalue()
    zip_len = len(zip_bytes)

    header_bits = [int(b) for b in format(zip_len, '032b')]
    payload_bits = []
    for b in zip_bytes:
        payload_bits.extend([int(x) for x in format(b, '08b')])
    all_bits = header_bits + payload_bits

    arr = np.array(img, dtype=np.uint8)
    blue = arr[:, :, 2].flatten()
    for i, bit in enumerate(all_bits):
        if i < len(blue):
            blue[i] = (int(blue[i]) & 0xFE) | bit

    arr[:, :, 2] = blue.reshape(arr[:, :, 2].shape)
    out_holiday = os.path.join(evidence_dir, "holiday.png")
    Image.fromarray(arr).save(out_holiday, compress_level=0)
    print(f"[+] Level 4 Holiday Stego PNG re-saved cleanly: {out_holiday}")
