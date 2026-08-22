import os
import asyncio
import edge_tts
import subprocess
import numpy as np
from scipy.io import wavfile

evidence_dir = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\web\public\evidence"
out_stereo = os.path.join(evidence_dir, "stereo_phase_carrier.wav")

sr = 44100
total_dur = 25.0
total_samples = int(sr * total_dur)

text_layer1 = (
    "The observatory receivers captured harmonic interference across the perimeter antenna. "
    "The transmission was modulated into distinct resonance bands to evade surveillance. "
    "Only when the phase null is triggered will the reversed coordinate pulses emerge. "
    "Listen across the harmonic sequence."
)

temp_l1_mp3 = os.path.join(evidence_dir, "temp_base_l1.mp3")
temp_l1_wav = os.path.join(evidence_dir, "temp_base_l1.wav")

async def gen_base():
    tts = edge_tts.Communicate(text_layer1, voice="en-US-RogerNeural", rate="-8%", pitch="-4Hz")
    await tts.save(temp_l1_mp3)

asyncio.run(gen_base())

subprocess.run([
    "ffmpeg", "-y", "-i", temp_l1_mp3,
    "-af", "lowpass=f=2600,highpass=f=100,volume=1.0",
    "-ar", "44100", "-ac", "1",
    temp_l1_wav
], check=True, capture_output=True)

_, raw_base = wavfile.read(temp_l1_wav)
base_data = np.zeros(total_samples, dtype=np.float32)
blen = min(len(raw_base), total_samples)
base_data[:blen] = raw_base[:blen].astype(np.float32)

if np.max(np.abs(base_data)) > 0:
    base_data = base_data / np.max(np.abs(base_data)) * 0.70

# In-phase Left and Right
left_pcm = (base_data * 32767).astype(np.int16)
right_pcm = (base_data * 32767).astype(np.int16)

stereo_base = np.stack([left_pcm, right_pcm], axis=1)
wavfile.write(out_stereo, sr, stereo_base)
print(f"[SUCCESS] Clean base stereo phase audio created: {out_stereo}")

if os.path.exists(temp_l1_mp3): os.remove(temp_l1_mp3)
if os.path.exists(temp_l1_wav): os.remove(temp_l1_wav)
