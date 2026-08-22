import os
import glob
from PIL import Image, ImageDraw, ImageFont

manual_dir = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\web\public\evidence\manual generated"
evidence_dir = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\web\public\evidence"

hand_files = glob.glob(os.path.join(manual_dir, "*Handwritten*"))
if hand_files:
    hand_src = hand_files[0]
    img = Image.open(hand_src).convert("RGB")
    img = img.resize((1200, 600), Image.Resampling.LANCZOS)
    draw = ImageDraw.Draw(img)

    try:
        font_hand = ImageFont.truetype("arial.ttf", 22)
        font_cipher = ImageFont.truetype("cour.ttf", 26)
    except:
        font_hand = ImageFont.load_default()
        font_cipher = ImageFont.load_default()

    # Authentically inscribe the 4 prime indices across 4 distinct shredded parchment strips
    # Strip 1: near top left formula
    draw.text((160, 95), "n_1 = 219", fill=(55, 30, 20), font=font_hand)
    # Strip 2: near middle Riemann line
    draw.text((820, 195), "n_2 = 163", fill=(55, 30, 20), font=font_hand)
    # Strip 3: near prime sequence line
    draw.text((210, 345), "n_3 = 97", fill=(55, 30, 20), font=font_hand)
    # Strip 4: near bottom integral
    draw.text((760, 435), "n_4 = 59", fill=(55, 30, 20), font=font_hand)

    # Inscribe the raw ciphertext stream along the bottom shredded margin
    draw.text((380, 520), "STREAM: ETLVGTUJTATE", fill=(40, 25, 25), font=font_cipher)

    out_shred = os.path.join(evidence_dir, "shredded_notes.png")
    img.save(out_shred)
    print(f"[+] Authentically inscribed indices & ciphertext on parchment: {out_shred}")
