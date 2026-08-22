import os
import glob
from PIL import Image

manual_dir = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\web\public\evidence\manual generated"
evidence_dir = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\web\public\evidence"

files = glob.glob(os.path.join(manual_dir, "*202608201928*.jpeg"))
if not files:
    files = glob.glob(os.path.join(manual_dir, "*Handwritten*.jpeg"))

if files:
    src_file = files[0]
    print(f"[*] Found newly generated image: {src_file}")
    img = Image.open(src_file)
    out_shred = os.path.join(evidence_dir, "shredded_notes.png")
    img.save(out_shred, format="PNG", quality=95)
    print(f"[+] Successfully converted and saved as: {out_shred}")
else:
    print("[-] No new image found.")
