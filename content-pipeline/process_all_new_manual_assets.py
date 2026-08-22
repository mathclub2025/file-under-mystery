import os
import glob
import io
import zipfile
import shutil
import numpy as np
from PIL import Image
from scipy.io import wavfile
import subprocess

manual_dir = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\web\public\evidence\manual generated"
evidence_dir = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\web\public\evidence"
os.makedirs(evidence_dir, exist_ok=True)

# -------------------------------------------------------------
# 1. PROCESS LEVEL 4: HOLIDAY STEGANOGRAPHY PHOTO
# -------------------------------------------------------------
holiday_files = glob.glob(os.path.join(manual_dir, "*Professor_reading_notebook*"))
if holiday_files:
    holiday_src = holiday_files[0]
    print(f"[*] Processing Level 4 Holiday Stego Photo: {holiday_src}")
    img = Image.open(holiday_src).convert("RGB")
    img = img.resize((1200, 800), Image.Resampling.LANCZOS)

    # Build genuine ZIP archive in memory
    zip_buf = io.BytesIO()
    with zipfile.ZipFile(zip_buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("equation.txt", "DEPARTMENT OF MATHEMATICS // RECOVERED LEDGER\nDr. Elias Marrow - Private Computation Notes\n\nTo determine verification token, solve the linear invariant:\n7x - 3 = 11x + 25\n\nSolution -> -4x = 28 -> x = -7\nMap value through Event Card Table: [-7] => M77RB")

    zip_bytes = zip_buf.getvalue()
    zip_len = len(zip_bytes)
    print(f"[*] Embedding ZIP archive ({zip_len} bytes) into Blue LSB...")

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
    print(f"[+] Level 4 Holiday Stego PNG saved: {out_holiday}")

# -------------------------------------------------------------
# 2. PROCESS LEVEL 3: SECURITY CAMERA CORRIDOR VIDEO
# -------------------------------------------------------------
cctv_files = glob.glob(os.path.join(manual_dir, "*Security_camera_in_university*"))
if cctv_files:
    cctv_src = cctv_files[0]
    out_cctv = os.path.join(evidence_dir, "hallway.mp4")
    shutil.copy2(cctv_src, out_cctv)
    print(f"[+] Level 3 Security Camera Video saved: {out_cctv}")

# -------------------------------------------------------------
# 3. PROCESS LEVEL 11: STEREO PHASE AUDIO INTERCEPT
# -------------------------------------------------------------
audio11_src = os.path.join(manual_dir, "level11.mp3")
if os.path.exists(audio11_src):
    print(f"[*] Processing Level 11 Stereo Phase Audio: {audio11_src}")
    temp_wav11 = os.path.join(manual_dir, "temp_l11.wav")
    try:
        subprocess.run(["ffmpeg", "-y", "-i", audio11_src, temp_wav11], capture_output=True, check=True)
        sr, raw_audio = wavfile.read(temp_wav11)
    except Exception as e:
        print("Fallback audio synthesis for level 11:", e)
        sr = 44100
        dur = 16.0
        t = np.linspace(0, dur, int(sr * dur), endpoint=False)
        raw_audio = np.random.randn(len(t)) * 0.3

    if raw_audio.ndim > 1:
        mono_audio = raw_audio.mean(axis=1)
    else:
        mono_audio = raw_audio

    # Normalize base noise/voice
    norm_mono = mono_audio.astype(np.float32)
    norm_mono = norm_mono / (np.max(np.abs(norm_mono)) + 1e-5) * 0.45

    sr = 44100
    total_len = len(norm_mono)
    t = np.linspace(0, total_len / sr, total_len, endpoint=False)

    # Carrier signal for PH4Z3 (1200 Hz tone + whispered carrier)
    carrier = np.sin(2 * np.pi * 1200 * t) * 0.35

    # Left = Base + Carrier
    left_channel = norm_mono + carrier
    # Right = Base - Carrier (180 degree inverted)
    right_channel = norm_mono - carrier

    # Normalize stereo pair
    max_amp = max(np.max(np.abs(left_channel)), np.max(np.abs(right_channel)))
    left_channel = (left_channel / max_amp * 0.95 * 32767).astype(np.int16)
    right_channel = (right_channel / max_amp * 0.95 * 32767).astype(np.int16)

    stereo_audio = np.stack([left_channel, right_channel], axis=1)
    out_stereo = os.path.join(evidence_dir, "stereo_phase_carrier.wav")
    wavfile.write(out_stereo, sr, stereo_audio)
    print(f"[+] Level 11 Stereo Phase Audio saved: {out_stereo}")

# -------------------------------------------------------------
# 4. PROCESS PHASE IV: BLACKBOX SOLID STATE DRIVE PHOTO
# -------------------------------------------------------------
ssd_files = glob.glob(os.path.join(manual_dir, "*Solid_state_drive*"))
if ssd_files:
    ssd_src = ssd_files[0]
    out_ssd = os.path.join(evidence_dir, "blackbox_drive.png")
    img_ssd = Image.open(ssd_src).convert("RGB")
    img_ssd.save(out_ssd)
    print(f"[+] Phase IV Blackbox Drive Photo saved: {out_ssd}")
