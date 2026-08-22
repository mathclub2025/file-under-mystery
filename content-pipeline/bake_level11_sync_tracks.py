import os
import asyncio
import edge_tts
import subprocess
import numpy as np
from scipy.io import wavfile

evidence_dir = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\web\public\evidence"
os.makedirs(evidence_dir, exist_ok=True)

sr = 44100
total_dur = 25.0
total_samples = int(sr * total_dur)

# Base audio (Layer 1)
text_layer1 = (
    "Observatory perimeter receivers active... Harmonic interference detected across the eastern array. "
    "The transmission was split into discrete resonance overtones to bypass signal scanners... "
    "Trigger the differential phase null to isolate the reversed pulses... "
    "Listen across the harmonic nodes."
)

temp_l1_mp3 = os.path.join(evidence_dir, "temp_full_l1.mp3")
temp_l1_wav = os.path.join(evidence_dir, "temp_full_l1.wav")

# The 5 coordinates and their exact timeline positions
coords = [
    (432,  "Three... four.", 3.0),
    (864,  "Two... two.",    7.5),
    (1296, "Five... six.",   12.0),
    (1728, "Five... two.",   16.5),
    (2160, "Five... five.",  21.0)
]

async def gen_all():
    print("[*] Generating Layer 1 Forward Voice...")
    tts1 = edge_tts.Communicate(text_layer1, voice="en-US-RogerNeural", rate="-14%", pitch="-14Hz")
    await tts1.save(temp_l1_mp3)

    for freq, txt, _ in coords:
        tmp_mp3 = os.path.join(evidence_dir, f"temp_c_{freq}.mp3")
        tts_c = edge_tts.Communicate(txt, voice="en-US-RogerNeural", rate="-10%", pitch="-12Hz")
        await tts_c.save(tmp_mp3)

asyncio.run(gen_all())

# Process Layer 1 with deep muffled filter (1100 Hz)
subprocess.run([
    "ffmpeg", "-y", "-i", temp_l1_mp3,
    "-af", "lowpass=f=1100,highpass=f=100,volume=1.3",
    "-ar", "44100", "-ac", "1",
    temp_l1_wav
], check=True, capture_output=True)

_, raw_base = wavfile.read(temp_l1_wav)
base_data = np.zeros(total_samples, dtype=np.float32)
blen = min(len(raw_base), total_samples)
base_data[:blen] = raw_base[:blen].astype(np.float32)
if np.max(np.abs(base_data)) > 0:
    base_data = base_data / np.max(np.abs(base_data)) * 0.75

# Add static
np.random.seed(42)
rf_static = np.random.randn(total_samples) * 0.035
base_with_static = base_data + rf_static

out_stereo = os.path.join(evidence_dir, "stereo_phase_carrier.wav")
left_pcm = (base_with_static * 32767 * 0.85).astype(np.int16)
right_pcm = (base_with_static * 32767 * 0.85).astype(np.int16)
stereo_base = np.stack([left_pcm, right_pcm], axis=1)
wavfile.write(out_stereo, sr, stereo_base)
print(f"[SUCCESS] stereo_phase_carrier.wav written: {out_stereo}")

# Now bake each coordinate into its own 25-SECOND SYNCHRONIZED full-length WAV file
for freq, _, start_sec in coords:
    tmp_mp3 = os.path.join(evidence_dir, f"temp_c_{freq}.mp3")
    tmp_wav = os.path.join(evidence_dir, f"temp_c_{freq}.wav")
    final_wav = os.path.join(evidence_dir, f"coord_{freq}.wav")

    subprocess.run([
        "ffmpeg", "-y", "-i", tmp_mp3,
        "-af", "lowpass=f=1400,highpass=f=120,volume=1.6",
        "-ar", "44100", "-ac", "1",
        tmp_wav
    ], check=True, capture_output=True)

    _, c_raw = wavfile.read(tmp_wav)
    # Reverse the spoken speech
    c_rev = c_raw[::-1].astype(np.float32)
    if np.max(np.abs(c_rev)) > 0:
        c_rev = c_rev / np.max(np.abs(c_rev)) * 0.90

    # Place in full 25s array
    full_coord_track = np.zeros(total_samples, dtype=np.float32)
    s_idx = int(start_sec * sr)
    e_idx = min(s_idx + len(c_rev), total_samples)
    full_coord_track[s_idx:e_idx] = c_rev[:e_idx - s_idx]

    coord_pcm = (full_coord_track * 32767).astype(np.int16)
    wavfile.write(final_wav, sr, coord_pcm)
    print(f"[+] Baked 25s synchronized track for {freq} Hz at {start_sec}s: {final_wav}")

    if os.path.exists(tmp_mp3): os.remove(tmp_mp3)
    if os.path.exists(tmp_wav): os.remove(tmp_wav)

if os.path.exists(temp_l1_mp3): os.remove(temp_l1_mp3)
if os.path.exists(temp_l1_wav): os.remove(temp_l1_wav)
