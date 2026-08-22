import os
import numpy as np
from scipy.io import wavfile
import subprocess

manual_dir = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\web\public\evidence\manual generated"
evidence_dir = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\web\public\evidence"
os.makedirs(evidence_dir, exist_ok=True)

audio11_src = os.path.join(manual_dir, "level11.mp3")
out_stereo = os.path.join(evidence_dir, "stereo_phase_carrier.wav")

print(f"[*] Processing Level 11 Audio starting at 9.0 seconds from source: {audio11_src}")

temp_wav11 = os.path.join(manual_dir, "temp_l11_9s.wav")
try:
    subprocess.run(["ffmpeg", "-y", "-i", audio11_src, temp_wav11], capture_output=True, check=True)
    sr, raw_audio = wavfile.read(temp_wav11)
except Exception as e:
    print("Direct synthesis fallback:", e)
    sr = 44100
    dur = 22.0
    t = np.linspace(0, dur, int(sr * dur), endpoint=False)
    raw_audio = np.random.randn(len(t)) * 0.3

if raw_audio.ndim > 1:
    mono_audio = raw_audio.mean(axis=1)
else:
    mono_audio = raw_audio

# Normalize base noise
norm_mono = mono_audio.astype(np.float32)
norm_mono = norm_mono / (np.max(np.abs(norm_mono)) + 1e-5) * 0.45

sr = 44100
total_len = max(len(norm_mono), int(sr * 22.0))
final_mono = np.zeros(total_len, dtype=np.float32)
final_mono[:len(norm_mono)] = norm_mono

t_all = np.linspace(0, total_len / sr, total_len, endpoint=False)

# Morse sequence for PH4Z3:
# P (.--.) H (....) 4 (....-) Z (--..) 3 (...--)
morse_ph4z3 = [
    # P: . - - .
    (1, 1), (3, 1), (3, 1), (1, 3),
    # H: . . . .
    (1, 1), (1, 1), (1, 1), (1, 3),
    # 4: . . . . -
    (1, 1), (1, 1), (1, 1), (1, 1), (3, 3),
    # Z: - - . .
    (3, 1), (3, 1), (1, 1), (1, 3),
    # 3: . . . - -
    (1, 1), (1, 1), (1, 1), (3, 1), (3, 6)
]

carrier = np.zeros(total_len, dtype=np.float32)
start_time = 9.0 # Starts exactly from the 9th second as requested!
unit_sec = 0.12 # 120ms per dot

current_t = start_time
for tone_units, gap_units in morse_ph4z3:
    tone_dur = tone_units * unit_sec
    gap_dur = gap_units * unit_sec
    s_idx = int(current_t * sr)
    e_idx = int((current_t + tone_dur) * sr)
    if e_idx < total_len:
        sub_t = t_all[s_idx:e_idx]
        # 1200 Hz harmonic carrier with subtle whisper harmonics
        tone = np.sin(2 * np.pi * 1200 * sub_t) * 0.4 + np.sin(2 * np.pi * 2400 * sub_t) * 0.08
        carrier[s_idx:e_idx] = tone
    current_t += (tone_dur + gap_dur)

print(f"[*] Level 11 Carrier injected starting at 9.0s through {current_t:.2f}s!")

# Left Channel = Base + Carrier
left_channel = final_mono + carrier
# Right Channel = Base - Carrier (180 degree inverted)
right_channel = final_mono - carrier

# Normalize stereo pair
max_amp = max(np.max(np.abs(left_channel)), np.max(np.abs(right_channel)))
left_channel = (left_channel / max_amp * 0.95 * 32767).astype(np.int16)
right_channel = (right_channel / max_amp * 0.95 * 32767).astype(np.int16)

stereo_audio = np.stack([left_channel, right_channel], axis=1)
wavfile.write(out_stereo, sr, stereo_audio)
print(f"[+] Level 11 Stereo Phase Audio saved with 9.0s start: {out_stereo}")

if os.path.exists(temp_wav11):
    os.remove(temp_wav11)
