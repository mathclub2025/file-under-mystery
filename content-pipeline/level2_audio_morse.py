import numpy as np
from scipy.io import wavfile
from scipy import signal
import matplotlib.pyplot as plt
import os

output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "web", "public", "evidence"))
os.makedirs(output_dir, exist_ok=True)

wav_path = os.path.join(output_dir, "voicemail.wav")
spec_path = os.path.join(output_dir, "spectrogram.png")

sample_rate = 44100
duration = 18.0
total_samples = int(sample_rate * duration)
t = np.linspace(0, duration, total_samples, endpoint=False)

# 1. Realistic distorted telephone audio + noise floor
np.random.seed(1337)
noise_floor = np.random.randn(total_samples) * 0.15

# Formant voice simulation (garbled spoken audio)
voice = np.zeros(total_samples)
for freq in [220, 380, 520, 780, 1100, 1450]:
    mod = 0.5 + 0.5 * np.sin(2 * np.pi * np.random.uniform(0.1, 0.8) * t)
    voice += np.sin(2 * np.pi * freq * t + np.sin(2 * np.pi * 3.0 * t)) * mod * 0.12

# 2. 3000 Hz Morse Tone for "K4P82"
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

unit_sec = 0.14
current_time = 1.2
morse_layer = np.zeros(total_samples)

for tone_units, gap_units in morse_pattern:
    tone_dur = tone_units * unit_sec
    gap_dur = gap_units * unit_sec
    
    start_idx = int(current_time * sample_rate)
    end_idx = int((current_time + tone_dur) * sample_rate)
    
    if end_idx < total_samples:
        t_sub = t[start_idx:end_idx]
        morse_layer[start_idx:end_idx] = np.sin(2 * np.pi * 3000 * t_sub) * 0.22
    
    current_time += (tone_dur + gap_dur)

combined = voice + noise_floor + morse_layer
combined = combined / np.max(np.abs(combined)) * 0.92

wavfile.write(wav_path, sample_rate, (combined * 32767).astype(np.int16))
print(f"[+] Level 2 audio generated: {wav_path}")

# Precompute spectrogram with dark scientific theme
frequencies, times, Sxx = signal.spectrogram(combined, sample_rate, nperseg=2048, noverlap=1024)

fig, ax = plt.subplots(figsize=(10, 3.5), dpi=150, facecolor="#000000")
ax.set_facecolor("#000000")
mesh = ax.pcolormesh(times, frequencies, 10 * np.log10(Sxx + 1e-9), shading='gouraud', cmap='magma')
ax.set_ylim(0, 4500)
ax.set_xlabel("Time (Seconds)", color="#94A3B8", fontsize=8)
ax.set_ylabel("Frequency (Hz)", color="#94A3B8", fontsize=8)
ax.tick_params(colors="#94A3B8", labelsize=7)
for spine in ax.spines.values():
    spine.set_color("#1E293B")
ax.axhline(3000, color="cyan", linestyle="--", linewidth=0.8, alpha=0.5, label="3000 Hz Carrier")
ax.legend(facecolor="#05070B", edgecolor="#1E293B", labelcolor="white", fontsize=7, loc="upper right")

plt.tight_layout()
plt.savefig(spec_path, facecolor=fig.get_facecolor(), edgecolor="none")
plt.close()
print(f"[+] Level 2 spectrogram precomputed: {spec_path}")
