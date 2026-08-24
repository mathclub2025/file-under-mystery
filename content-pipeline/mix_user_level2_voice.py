import os
import subprocess
import numpy as np
from scipy.io import wavfile
import tempfile

ogg_src = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\web\public\evidence\level2 voice.ogg"
wav_out = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\web\public\evidence\voicemail.wav"
dist_wav_out = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\web\dist\evidence\voicemail.wav"

sr = 44100
temp_wav = os.path.join(tempfile.gettempdir(), "user_level2_voice_full.wav")

# Convert full user ogg to mono WAV at 44.1kHz with zero truncation
subprocess.run(["ffmpeg", "-y", "-i", ogg_src, "-ar", str(sr), "-ac", "1", temp_wav], capture_output=True, check=True)

sr_in, voice_raw = wavfile.read(temp_wav)
voice_raw = voice_raw.astype(np.float32)
total_samples = len(voice_raw)
dur = total_samples / sr

print(f"[+] Loaded full original audio: {dur:.3f} seconds ({total_samples} samples)")

if np.max(np.abs(voice_raw)) > 0:
    voice_norm = voice_raw / np.max(np.abs(voice_raw)) * 0.85
else:
    voice_norm = voice_raw

t = np.linspace(0, dur, total_samples, endpoint=False)

# Morse: K (-.-)  [PAUSE]  4 (....-)  [PAUSE]  P (.--.)  [PAUSE]  8 (---..)  [PAUSE]  2 (..---)
# Distinct inter-character pauses
morse_pattern = [
    # K: - . -
    (3, 1), (1, 1), (3, 8),
    # 4: . . . . -
    (1, 1), (1, 1), (1, 1), (1, 1), (3, 8),
    # P: . - - .
    (1, 1), (3, 1), (3, 1), (1, 8),
    # 8: - - - . .
    (3, 1), (3, 1), (3, 1), (1, 1), (1, 8),
    # 2: . . - - -
    (1, 1), (1, 1), (3, 1), (3, 1), (3, 8)
]

unit_sec = 0.11
current_time = 3.0
morse_layer = np.zeros(total_samples, dtype=np.float32)
carrier_freq = 2400

for tone_units, gap_units in morse_pattern:
    tone_dur = tone_units * unit_sec
    gap_dur = gap_units * unit_sec
    
    start_idx = int(current_time * sr)
    end_idx = int((current_time + tone_dur) * sr)
    
    if end_idx < total_samples:
        t_sub = t[start_idx:end_idx]
        N = len(t_sub)
        ramp = min(int(0.008 * sr), N // 4)
        env = np.ones(N, dtype=np.float32)
        if ramp > 0:
            env[:ramp] = np.linspace(0, 1, ramp)
            env[-ramp:] = np.linspace(1, 0, ramp)
        morse_layer[start_idx:end_idx] = np.sin(2 * np.pi * carrier_freq * t_sub) * 0.20 * env
        
    current_time += (tone_dur + gap_dur)

# Preserve full original audio without truncating a single millisecond
combined = voice_norm + morse_layer
max_amp = np.max(np.abs(combined)) + 1e-6
combined_pcm = (combined / max_amp * 0.90 * 32767).astype(np.int16)

wavfile.write(wav_out, sr, combined_pcm)
if os.path.exists(os.path.dirname(dist_wav_out)):
    wavfile.write(dist_wav_out, sr, combined_pcm)

print(f"[SUCCESS] Exported full {dur:.2f}s voicemail.wav to: {wav_out}")
