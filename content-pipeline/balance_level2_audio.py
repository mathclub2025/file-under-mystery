import os
import subprocess
import numpy as np
from scipy.io import wavfile
from scipy import signal
import matplotlib.pyplot as plt

manual_dir = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\web\public\evidence\manual generated"
evidence_dir = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\web\public\evidence"

ogg_src = os.path.join(manual_dir, "level2.ogg")
temp_wav = os.path.join(manual_dir, "temp_level2_voice.wav")
wav_path = os.path.join(evidence_dir, "voicemail.wav")
spec_path = os.path.join(evidence_dir, "spectrogram.png")

# Convert original speech OGG to mono WAV
if os.path.exists(ogg_src):
    subprocess.run(["ffmpeg", "-y", "-i", ogg_src, "-ar", "44100", "-ac", "1", temp_wav], capture_output=True, check=True)
    sr, voice_data = wavfile.read(temp_wav)
else:
    sr = 44100
    voice_data = np.zeros(sr * 16, dtype=np.float32)

voice_data = voice_data.astype(np.float32)
max_v = np.max(np.abs(voice_data)) + 1e-6
voice_data = voice_data / max_v * 0.85 # Strong, clear voice audio!

total_samples = len(voice_data)
t = np.linspace(0, total_samples / sr, total_samples, endpoint=False)

# Morse: K (-.-) 4 (....-) P (.--.) 8 (---..) 2 (..---)
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

unit_sec = 0.12
current_time = 3.0 # Start morse at 3.0s into the voicemail
morse_layer = np.zeros(total_samples, dtype=np.float32)

for tone_units, gap_units in morse_pattern:
    tone_dur = tone_units * unit_sec
    gap_dur = gap_units * unit_sec
    
    start_idx = int(current_time * sr)
    end_idx = int((current_time + tone_dur) * sr)
    
    if end_idx < total_samples:
        t_sub = t[start_idx:end_idx]
        # Soft, subtle 3000 Hz continuous wave carrier (amplitude 0.045 - doesn't overpower voice!)
        window = np.hanning(len(t_sub))
        morse_layer[start_idx:end_idx] = np.sin(2 * np.pi * 3000 * t_sub) * 0.045 * window
    
    current_time += (tone_dur + gap_dur)

# Subtle background tape hiss
noise = np.random.randn(total_samples).astype(np.float32) * 0.015

combined = voice_data + morse_layer + noise
combined = combined / np.max(np.abs(combined)) * 0.90
wavfile.write(wav_path, sr, (combined * 32767).astype(np.int16))
print(f"[+] Level 2 Voicemail Audio balanced and saved: {wav_path}")

# Recompute high-contrast spectrogram
frequencies, times, Sxx = signal.spectrogram(combined, sr, nperseg=2048, noverlap=1024)

fig, ax = plt.subplots(figsize=(10, 3.5), dpi=150, facecolor="#000000")
ax.set_facecolor("#000000")
mesh = ax.pcolormesh(times, frequencies, 10 * np.log10(Sxx + 1e-9), shading='gouraud', cmap='magma')
ax.set_ylim(0, 4500)
ax.set_xlabel("Time (Seconds)", color="#94A3B8", fontsize=8)
ax.set_ylabel("Frequency (Hz)", color="#94A3B8", fontsize=8)
ax.tick_params(colors="#94A3B8", labelsize=7)
for spine in ax.spines.values():
    spine.set_color("#1E293B")
ax.axhline(3000, color="cyan", linestyle="--", linewidth=0.8, alpha=0.5, label="3000 Hz Morse Carrier")
ax.legend(facecolor="#05070B", edgecolor="#1E293B", labelcolor="white", fontsize=7, loc="upper right")

plt.tight_layout()
plt.savefig(spec_path, facecolor=fig.get_facecolor(), edgecolor="none")
plt.close()
print(f"[+] Level 2 Spectrogram recomputed: {spec_path}")

if os.path.exists(temp_wav):
    os.remove(temp_wav)
