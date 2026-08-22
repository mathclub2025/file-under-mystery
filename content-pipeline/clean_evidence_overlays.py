import os
import glob
from PIL import Image, ImageDraw, ImageFont

manual_dir = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\web\public\evidence\manual generated"
evidence_dir = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\web\public\evidence"

hand_files = glob.glob(os.path.join(manual_dir, "*Handwritten*"))
if hand_files:
    hand_src = hand_files[0]
    img = Image.open(hand_src).convert("RGB")
    img = img.resize((1000, 480), Image.Resampling.LANCZOS)
    
    # Save clean authentic manuscript without giant red giveaway answers stamped across it!
    out_shred = os.path.join(evidence_dir, "shredded_notes.png")
    img.save(out_shred)
    print(f"[+] Clean Level 5 Shredded Notes saved without answer overlays: {out_shred}")

# Also clean Level 7 scrambled_page.png so it has authentic proof markings
journal_files = glob.glob(os.path.join(manual_dir, "*Mathematics_journal*"))
if journal_files:
    journal_src = journal_files[0]
    img_j = Image.open(journal_src).convert("RGB")
    img_j = img_j.resize((800, 1000), Image.Resampling.LANCZOS)
    draw_j = ImageDraw.Draw(img_j)
    try:
        font_j = ImageFont.truetype("arial.ttf", 20)
    except:
        font_j = ImageFont.load_default()
    
    # Subtle authentic margin notation on the journal proof
    draw_j.text((80, 940), "lemma 4.2 -> coordinate trace: BXZ19", fill=(90, 40, 40), font=font_j)
    out_j = os.path.join(evidence_dir, "scrambled_page.png")
    img_j.save(out_j)
    print(f"[+] Clean Level 7 Scrambled Page saved: {out_j}")
