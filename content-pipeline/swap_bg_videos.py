import os
import shutil

public_bg = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\web\public\script_bg"
dist_bg = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\web\dist\script_bg"

def swap_bgs(bg_dir):
    if not os.path.exists(bg_dir):
        return
    l8 = os.path.join(bg_dir, "level8_bg.mp4")
    l9 = os.path.join(bg_dir, "level9_bg.mp4")
    tmp = os.path.join(bg_dir, "temp_swap_bg.mp4")
    
    if os.path.exists(l8) and os.path.exists(l9):
        shutil.move(l8, tmp)
        shutil.move(l9, l8)
        shutil.move(tmp, l9)
        print(f"[+] Swapped level8_bg.mp4 <-> level9_bg.mp4 in {bg_dir}")

swap_bgs(public_bg)
swap_bgs(dist_bg)
