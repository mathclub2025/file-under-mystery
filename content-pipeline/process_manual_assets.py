import os
import glob
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from scipy.io import wavfile
from scipy import signal
import matplotlib.pyplot as plt
import subprocess

manual_dir = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\web\public\evidence\manual generated"
evidence_dir = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\web\public\evidence"
os.makedirs(evidence_dir, exist_ok=True)

# -------------------------------------------------------------
# 1. PROCESS LEVEL 1: PINE FOREST IMAGE
# -------------------------------------------------------------
forest_files = glob.glob(os.path.join(manual_dir, "*Pine_forest*"))
if forest_files:
    forest_src = forest_files[0]
    print(f"[*] Processing Level 1 Forest Image: {forest_src}")
    img = Image.open(forest_src).convert("RGB")
    img = img.resize((1200, 800), Image.Resampling.LANCZOS)
    arr = np.array(img, dtype=np.uint8)

    # Embed scattered tokens in deep shadows: 1:A, 2:1, 3:9, 4:X, 5:7
    scattered = [
        (180, 480, "1:A"),
        (460, 580, "2:1"),
        (680, 520, "3:9"),
        (920, 620, "4:X"),
        (1080, 500, "5:7")
    ]

    img_burn = Image.fromarray(arr)
    draw = ImageDraw.Draw(img_burn)
    try:
        font = ImageFont.truetype("arial.ttf", 36)
    except:
        font = ImageFont.load_default()

    for sx, sy, stag in scattered:
        crop = arr[max(0, sy-10):min(800, sy+40), max(0, sx-10):min(1200, sx+80)]
        local_val = int(crop.mean())
        # Delta of only +4 luminance in shadow areas
        burn_val = (min(255, local_val + 3), min(255, local_val + 4), min(255, local_val + 5))
        draw.text((sx, sy), stag, fill=burn_val, font=font)

    out_forest = os.path.join(evidence_dir, "forest.png")
    img_burn.save(out_forest, compress_level=0)
    print(f"[+] Level 1 Forest PNG saved: {out_forest}")

# -------------------------------------------------------------
# 2. PROCESS LEVEL 2: AUDIO WITH MORSE FROM 3s TO 14s
# -------------------------------------------------------------
audio_src = os.path.join(manual_dir, "level2.ogg")
if os.path.exists(audio_src):
    print(f"[*] Processing Level 2 Audio: {audio_src}")
    # Convert OGG to WAV using ffmpeg if available, or generate multi-frequency phone audio
    temp_wav = os.path.join(manual_dir, "temp_in.wav")
    try:
        subprocess.run(["ffmpeg", "-y", "-i", audio_src, temp_wav], capture_output=True, check=True)
        sr, audio_data = wavfile.read(temp_wav)
    except Exception as e:
        print("Using direct procedural phone voice background:", e)
        sr = 44100
        duration = 18.0
        t = np.linspace(0, duration, int(sr * duration), endpoint=False)
        audio_data = (np.sin(2 * np.pi * 320 * t) * 0.2 + np.random.randn(len(t)) * 0.1)

    if audio_data.ndim > 1:
        audio_data = audio_data.mean(axis=1)

    # Normalize base audio
    max_val = np.max(np.abs(audio_data))
    if max_val > 0:
        base_audio = audio_data / max_val * 0.6
    else:
        base_audio = audio_data

    sr = 44100
    total_len = max(len(base_audio), int(sr * 18.0))
    final_audio = np.zeros(total_len, dtype=np.float32)
    final_audio[:len(base_audio)] = base_audio

    # Morse Code for K4P82:
    # K (-.-) 4 (....-) P (.--.) 8 (---..) 2 (..---)
    # Timed specifically to start at 3.0s and finish before 14.0s
    morse_pattern = [
        # K: - . -
        (3, 1), (1, 1), (3, 3),
        # 4: . . . . -
        (1, 1), (1, 1), (1, 1), (1, 1), (3, 3),
        # P: . - - .
        (1, 1), (3, 1), (3, 1), (1, 3),
        # 8: - - - . .
        (3, 1), (3, 1), (3, 1), (1, 1), (1, 3),
        # 2: . . - - -
        (1, 1), (1, 1), (3, 1), (3, 1), (3, 6)
    ]

    unit_sec = 0.12 # 1 dot = 120ms
    current_time = 3.0 # Starts at exactly 3.0 seconds as requested!
    carrier_freq = 3000.0 # 3000 Hz Morse Tone

    t_all = np.linspace(0, total_len / sr, total_len, endpoint=False)

    for tone_units, gap_units in morse_pattern:
        tone_dur = tone_units * unit_sec
        gap_dur = gap_units * unit_sec
        start_idx = int(current_time * sr)
        end_idx = int((current_time + tone_dur) * sr)
        if end_idx < total_len:
            sub_t = t_all[start_idx:end_idx]
            final_audio[start_idx:end_idx] += np.sin(2 * np.pi * carrier_freq * sub_t) * 0.35
        current_time += (tone_dur + gap_dur)

    print(f"[*] Morse code injected between 3.0s and {current_time:.2f}s!")

    # Normalize and write WAV
    norm_audio = final_audio / np.max(np.abs(final_audio)) * 0.95
    out_wav = os.path.join(evidence_dir, "voicemail.wav")
    wavfile.write(out_wav, sr, (norm_audio * 32767).astype(np.int16))
    print(f"[+] Level 2 Voicemail WAV saved: {out_wav}")

    # Generate matching high-res Spectrogram
    frequencies, times, Sxx = signal.spectrogram(norm_audio, sr, nperseg=2048, noverlap=1024)
    fig, ax = plt.subplots(figsize=(10, 3.5), dpi=150, facecolor="#000000")
    ax.set_facecolor("#000000")
    ax.pcolormesh(times, frequencies, 10 * np.log10(Sxx + 1e-9), shading='gouraud', cmap='magma')
    ax.set_ylim(0, 4500)
    ax.set_xlabel("Time (Seconds)", color="#94A3B8", fontsize=8)
    ax.set_ylabel("Frequency (Hz)", color="#94A3B8", fontsize=8)
    ax.tick_params(colors="#94A3B8", labelsize=7)
    for spine in ax.spines.values():
        spine.set_color("#1E293B")
    plt.tight_layout()
    out_spec = os.path.join(evidence_dir, "spectrogram.png")
    plt.savefig(out_spec, facecolor=fig.get_facecolor(), edgecolor="none")
    plt.close()
    print(f"[+] Level 2 Spectrogram PNG saved: {out_spec}")

# -------------------------------------------------------------
# 3. PROCESS LEVEL 5: HANDWRITTEN EQUATIONS IMAGE
# -------------------------------------------------------------
hand_files = glob.glob(os.path.join(manual_dir, "*Handwritten*"))
if hand_files:
    hand_src = hand_files[0]
    print(f"[*] Processing Level 5 Handwriting Image: {hand_src}")
    img = Image.open(hand_src).convert("RGB")
    img = img.resize((1000, 420), Image.Resampling.LANCZOS)
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("arial.ttf", 22)
    except:
        font = ImageFont.load_default()

    # Overlay prime sequence indices and ciphertext
    draw.text((40, 30), "PRIME INDICES STREAM: [ 219 , 163 , 97 , 59 ]", fill=(120, 20, 20), font=font)
    draw.text((40, 70), "TARGET CIPHERTEXT STREAM: ETLVGTUJTATE", fill=(30, 30, 40), font=font)

    out_shred = os.path.join(evidence_dir, "shredded_notes.png")
    img.save(out_shred)
    print(f"[+] Level 5 Shredded Notes PNG saved: {out_shred}")

# -------------------------------------------------------------
# 4. PROCESS LEVEL 7: MATHEMATICS JOURNAL SCRAMBLED PAGE
# -------------------------------------------------------------
journal_files = glob.glob(os.path.join(manual_dir, "*Mathematics_journal*"))
if journal_files:
    journal_src = journal_files[0]
    print(f"[*] Processing Level 7 Journal Image: {journal_src}")
    img = Image.open(journal_src).convert("RGB")
    img = img.resize((800, 1000), Image.Resampling.LANCZOS)
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("arial.ttf", 28)
    except:
        font = ImageFont.load_default()

    # Burn token in proof margin
    draw.text((120, 880), "PROOF CONVERGENCE COORDINATE // BXZ19", fill=(180, 20, 20), font=font)

    out_scramble = os.path.join(evidence_dir, "scrambled_page.png")
    img.save(out_scramble)
    print(f"[+] Level 7 Journal Page saved: {out_scramble}")

# -------------------------------------------------------------
# 5. PROCESS LEVEL 9: ASTRONOMICAL TELEMETRY SCATTER PLOT
# -------------------------------------------------------------
astro_files = glob.glob(os.path.join(manual_dir, "*Astronomical*"))
if astro_files:
    astro_src = astro_files[0]
    print(f"[*] Processing Level 9 Astronomical Image: {astro_src}")
    img = Image.open(astro_src).convert("RGB")
    img = img.resize((900, 600), Image.Resampling.LANCZOS)
    out_astro = os.path.join(evidence_dir, "orbital_plot.png")
    img.save(out_astro)
    print(f"[+] Level 9 Astronomical Plot saved: {out_astro}")

# -------------------------------------------------------------
# 6. PROCESS LEVEL 3: CORRIDOR VIDEO
# -------------------------------------------------------------
video_src = os.path.join(manual_dir, "empty hallway for night.mp4")
if os.path.exists(video_src):
    out_vid = os.path.join(evidence_dir, "hallway.mp4")
    shutil_copy = True
    import shutil
    shutil.copy2(video_src, out_vid)
    print(f"[+] Level 3 Hallway Video saved: {out_vid}")
