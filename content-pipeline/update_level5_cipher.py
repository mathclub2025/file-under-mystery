import os
import glob
from PIL import Image, ImageDraw, ImageFont

manual_dir = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\web\public\evidence\manual generated"
evidence_dir = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\web\public\evidence"

files = glob.glob(os.path.join(manual_dir, "*202608201928*.jpeg"))
if not files:
    files = glob.glob(os.path.join(manual_dir, "*Handwritten*.jpeg"))

src_file = files[0]
img = Image.open(src_file).convert("RGB")
img = img.resize((1600, 900), Image.Resampling.LANCZOS)
draw = ImageDraw.Draw(img)

try:
    font_box = ImageFont.truetype("arial.ttf", 26)
    font_stream = ImageFont.truetype("cour.ttf", 28)
except:
    font_box = ImageFont.load_default()
    font_stream = ImageFont.load_default()

# 4 Key Indices in 4 corners of the shredded strips
draw.text((120, 90), "[ KEY INDEX #1: n = 219 ]", fill=(80, 20, 20), font=font_box)
draw.text((1050, 110), "[ KEY INDEX #2: n = 163 ]", fill=(80, 20, 20), font=font_box)
draw.text((120, 720), "[ KEY INDEX #3: n = 97 ]", fill=(80, 20, 20), font=font_box)
draw.text((1050, 710), "[ KEY INDEX #4: n = 59 ]", fill=(80, 20, 20), font=font_box)

# Target Ciphertext Stream along the bottom center strip
cipher_stream = "CIPHER: ETLVGETIDFIKLTPESYWITJPKUTJI"
draw.text((420, 810), cipher_stream, fill=(20, 20, 40), font=font_stream)

out_shred = os.path.join(evidence_dir, "shredded_notes.png")
img.save(out_shred, quality=95)
print(f"[+] Re-inscribed new 28-char cipher stream to: {out_shred}")
