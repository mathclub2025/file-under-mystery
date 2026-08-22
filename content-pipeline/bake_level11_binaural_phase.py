import os
import asyncio
import edge_tts
import subprocess
import numpy as np
from scipy.io import wavfile

evidence_dir = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\web\public\evidence"
os.makedirs(evidence_dir, exist_ok=True)
out_stereo = os.path.join(evidence_dir, "stereo_phase_carrier.wav")

sr = 44100
total_dur = 25.0
total_samples = int(sr * total_dur)
t = np.linspace(0, total_dur, total_samples, endpoint=False)

# 1. LAYER 1: Muffled Old Man Forward Atmospheric Speech (Deep, muffled through wall)
text_layer1 = (
    "Observatory perimeter receivers active... Harmonic interference detected across the eastern array. "
    "The transmission was split into discrete resonance overtones to bypass signal scanners... "
    "Trigger the differential phase null to isolate the reversed pulses... "
    "Listen across the harmonic nodes."
)

temp_l1_mp3 = os.path.join(evidence_dir, "temp_muff_l1.mp3")
temp_l1_wav = os.path.join(evidence_dir, "temp_muff_l1.wav")

# 2. THE 5 HARMONIC COORDINATES
target_coords = [
    (432,  "Three... four."),
    (864,  "Two... two."),
    (1296, "Five... six."),
    (1728, "Five... two."),
    (2160, "Five... five.")
]

async def generate_elder_audio():
    print("[*] Generating Layer 1 Forward Old Professor Voice (Deep Muffled)...")
    tts1 = edge_tts.Communicate(text_layer1, voice="en-US-RogerNeural", rate="-14%", pitch="-14Hz")
    await tts1.save(temp_l1_mp3)

    for freq, txt in target_coords:
        tmp_mp3 = os.path.join(evidence_dir, f"temp_c_{freq}.mp3")
        tts_c = edge_tts.Communicate(txt, voice="en-US-RogerNeural", rate="-10%", pitch="-12Hz")
        await tts_c.save(tmp_mp3)

asyncio.run(generate_elder_audio())

# Process Layer 1 with deep muffled acoustic filter (1100 Hz cutoff) + room resonance
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

# Add realistic RF tape hiss and background radio static
np.random.seed(42)
rf_static = np.random.randn(total_samples) * 0.035
ground_hum = np.sin(2 * np.pi * 55 * t) * 0.015
base_with_static = base_data + rf_static + ground_hum

# Save base stereo phase carrier
left_pcm = (base_with_static * 32767 * 0.85).astype(np.int16)
right_pcm = (base_with_static * 32767 * 0.85).astype(np.int16)
stereo_base = np.stack([left_pcm, right_pcm], axis=1)
wavfile.write(out_stereo, sr, stereo_base)
print(f"[SUCCESS] Deep Muffled Old Man Carrier created: {out_stereo}")

# 3. PROCESS THE 5 COORDINATE FILES (Muffled + Cleanly Reversed)
for freq, _ in target_coords:
    tmp_mp3 = os.path.join(evidence_dir, f"temp_c_{freq}.mp3")
    final_wav = os.path.join(evidence_dir, f"coord_{freq}.wav")
    
    # Process speech with warm vintage radio filter (1350 Hz)
    subprocess.run([
        "ffmpeg", "-y", "-i", tmp_mp3,
        "-af", "lowpass=f=1350,highpass=f=120,volume=1.5",
        "-ar", "44100", "-ac", "1",
        final_wav
    ], check=True, capture_output=True)
    
    _, c_raw = wavfile.read(final_wav)
    # Reverse the audio
    c_rev = c_raw[::-1]
    wavfile.write(final_wav, sr, c_rev)
    print(f"[+] Processed reversed coordinate audio for {freq} Hz: {final_wav}")
    if os.path.exists(tmp_mp3): os.remove(tmp_mp3)

if os.path.exists(temp_l1_mp3): os.remove(temp_l1_mp3)
if os.path.exists(temp_l1_wav): os.remove(temp_l1_wav)
