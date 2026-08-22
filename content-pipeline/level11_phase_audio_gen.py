import numpy as np
from scipy.io import wavfile
import os

output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "web", "public", "evidence"))
out_path = os.path.join(output_dir, "stereo_phase_carrier.wav")

sr = 44100
dur = 8.0
t = np.linspace(0, dur, int(sr * dur), endpoint=False)

# Common masking noise
np.random.seed(77)
noise = np.random.randn(len(t)) * 0.4

# Whispered tone carrier at 1200 Hz
whisper_carrier = np.sin(2 * np.pi * 1200 * t) * 0.15

# Left channel = Noise + Carrier
# Right channel = Noise - Carrier (180 deg out of phase)
left = noise + whisper_carrier
right = noise - whisper_carrier

stereo = np.vstack([left, right]).T
stereo_norm = (stereo / np.max(np.abs(stereo)) * 32767).astype(np.int16)

wavfile.write(out_path, sr, stereo_norm)
print(f"[+] Level 11 stereo phase audio generated: {out_path} -> Flag: PH4Z3")
