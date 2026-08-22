import os
import glob
from PIL import Image, ImageDraw, ImageFont

manual_dir = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\web\public\evidence\manual generated"
evidence_dir = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\web\public\evidence"

hand_files = glob.glob(os.path.join(manual_dir, "*Handwritten*"))
if hand_files:
    hand_src = hand_files[0]
    img = Image.open(hand_src).convert("RGB")
    # Resize to high resolution for clear zooming
    w, h = 1400, 750
    img = img.resize((w, h), Image.Resampling.LANCZOS)
    draw = ImageDraw.Draw(img)

    try:
        font_note = ImageFont.truetype("arial.ttf", 26)
        font_box = ImageFont.truetype("arial.ttf", 22)
        font_stream = ImageFont.truetype("arial.ttf", 28)
    except:
        font_note = ImageFont.load_default()
        font_box = ImageFont.load_default()
        font_stream = ImageFont.load_default()

    # We inscribe Dr. Marrow's 4 handwritten index cards on 4 different parchment strips with dark ink:
    # 1. Top left strip
    draw.text((120, 85), "[ KEY INDEX #1: n = 219 ]", fill=(80, 20, 20), font=font_box)
    # 2. Top right strip
    draw.text((920, 110), "[ KEY INDEX #2: n = 163 ]", fill=(80, 20, 20), font=font_box)
    # 3. Lower left strip
    draw.text((120, 600), "[ KEY INDEX #3: n = 97 ]", fill=(80, 20, 20), font=font_box)
    # 4. Lower right strip
    draw.text((920, 580), "[ KEY INDEX #4: n = 59 ]", fill=(80, 20, 20), font=font_box)

    # Inscribe the Target Ciphertext Stream along the center bottom strip
    draw.text((450, 660), "CIPHER STREAM:  E T L V G T U J T A T E", fill=(20, 20, 40), font=font_stream)

    out_shred = os.path.join(evidence_dir, "shredded_notes.png")
    img.save(out_shred, quality=95)
    print(f"[+] High-contrast inscribed parchment saved to: {out_shred}")
