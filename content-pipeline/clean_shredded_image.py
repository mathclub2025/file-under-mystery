import os
import glob
from PIL import Image

manual_dir = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\web\public\evidence\manual generated"
evidence_dir = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\web\public\evidence"

# Load clean generated image without any programmatically drawn boxes
files = glob.glob(os.path.join(manual_dir, "*202608201928*.jpeg"))
if not files:
    files = glob.glob(os.path.join(manual_dir, "*Handwritten*.jpeg"))

src_file = files[0]
img = Image.open(src_file).convert("RGB")
out_shred = os.path.join(evidence_dir, "shredded_notes.png")
img.save(out_shred, format="PNG", quality=95)
print(f"[+] Pristine untouched parchment saved without synthetic overlays: {out_shred}")
