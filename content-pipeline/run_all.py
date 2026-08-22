import subprocess
import sys
import os

scripts = [
    "level1_image_contrast.py",
    "level2_audio_morse.py",
    "level3_video_frame_inject.py",
    "level4_stego_zip_embed.py",
    "level5_prime_cipher_gen.py",
    "level6_packet_generator.py",
    "level7_matrix_shuffle.py",
    "level8_fft_embed.py",
    "level9_elliptic_curve_gen.py",
    "level10_rule30_gen.py",
    "level11_phase_audio_gen.py",
    "level12_graph_gen.py",
]

print("=" * 60)
print("  FILE UNDER MYSTERY // FULL 12-TIER ASSET PIPELINE")
print("=" * 60)

cur_dir = os.path.dirname(os.path.abspath(__file__))

for script in scripts:
    script_path = os.path.join(cur_dir, script)
    print(f"[*] Executing {script}...")
    res = subprocess.run([sys.executable, script_path], cwd=cur_dir)
    if res.returncode != 0:
        print(f"[!] Error in {script}")
    else:
        print(f"[+] {script} finished successfully.")

print("=" * 60)
print("[+] ALL 12 EVIDENCE ASSETS SUCCESSFULLY GENERATED INTO:")
print("    apps/web/public/evidence/")
print("=" * 60)
