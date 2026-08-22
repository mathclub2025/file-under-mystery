import os
import glob
import numpy as np
from PIL import Image, ImageDraw, ImageFont

manual_dir = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\web\public\evidence\manual generated"
evidence_dir = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\web\public\evidence"

holiday_files = glob.glob(os.path.join(manual_dir, "*Professor_reading_notebook*"))
if holiday_files:
    holiday_src = holiday_files[0]
    print(f"[*] Embedding visual bitplane equation into: {holiday_src}")
    img = Image.open(holiday_src).convert("RGB")
    img = img.resize((1200, 800), Image.Resampling.LANCZOS)
    arr = np.array(img, dtype=np.uint8)

    # We will embed the equation text directly into Blue Channel Bit 1 (Bitplane 1)
    mask_img = Image.new("L", (1200, 800), color=0)
    draw = ImageDraw.Draw(mask_img)

    try:
        font_large = ImageFont.truetype("arial.ttf", 36)
        font_sub = ImageFont.truetype("arial.ttf", 24)
    except:
        font_large = ImageFont.load_default()
        font_sub = ImageFont.load_default()

    # Draw the equation across the cafe cobblestone in the bitplane mask
    draw.text((260, 680), "INVARIANT:  7x - 3 = 11x + 25", fill=255, font=font_large)
    draw.text((320, 730), "SOLVE INTEGER ROOT (x) -> MAP IN LEDGER MATRIX", fill=255, font=font_sub)

    mask_arr = np.array(mask_img) > 128
    blue = arr[:, :, 2].astype(np.uint16)

    # In the text region, set Bit 1 where mask is True, clear Bit 1 where mask is False
    for y in range(650, 780):
        for x in range(200, 1100):
            if mask_arr[y, x]:
                blue[y, x] = (blue[y, x] | 0x02) & 0xFF
            else:
                blue[y, x] = (blue[y, x] & 0xFD) & 0xFF

    arr[:, :, 2] = blue.astype(np.uint8)
    out_holiday = os.path.join(evidence_dir, "holiday.png")
    Image.fromarray(arr).save(out_holiday, compress_level=0)
    print(f"[+] Visual bitplane equation successfully embedded into holiday.png: {out_holiday}")
