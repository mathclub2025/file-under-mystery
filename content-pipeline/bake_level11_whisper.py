import os
import asyncio
import edge_tts
import numpy as np
from scipy.io import wavfile
import subprocess

manual_dir = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\web\public\evidence\manual generated"
evidence_dir = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\web\public\evidence"
os.makedirs(evidence_dir, exist_ok=True)

audio11_src = os.path.join(manual_dir, "level11.mp3")
whisper_mp3 = os.path.join(manual_dir, "whisper_temp.mp3")
whisper_wav = os.path.join(manual_dir, "whisper_temp.wav")
temp_base_wav = os.path.join(manual_dir, "base_temp.wav")
out_stereo = os.path.join(evidence_dir, "stereo_phase_carrier.wav")

async def make_whisper():
    # Spoken whispered token starting at 9.0s
    whisper_text = "Phase Three. Token is P... H... 4... Z... 3... Repeat: P... H... 4... Z... 3."
    # Use Jenny or Christopher neural voice with soft low rate
    comm = edge_tts.Communicate(whisper_text, "en-US-JennyNeural", rate="-15%", pitch="-4Hz")
    await comm.save(whisper_mp3)
    print("[+] Whispered token audio generated!")

def bake_stereo_whisper():
    # Convert whisper MP3 to WAV
    subprocess.run(["ffmpeg", "-y", "-i", whisper_mp3, "-ar", "44100", "-ac", "1", whisper_wav], capture_output=True, check=True)
    # Convert base audio MP3 to WAV
    subprocess.run(["ffmpeg", "-y", "-i", audio11_src, "-ar", "44100", "-ac", "1", temp_base_wav], capture_output=True, check=True)

    sr, base_audio = wavfile.read(temp_base_wav)
    _, whisper_audio = wavfile.read(whisper_wav)

    # Normalize base audio (mono)
    base_audio = base_audio.astype(np.float32)
    base_audio = base_audio / (np.max(np.abs(base_audio)) + 1e-5) * 0.40

    # Normalize whisper audio
    whisper_audio = whisper_audio.astype(np.float32)
    whisper_audio = whisper_audio / (np.max(np.abs(whisper_audio)) + 1e-5) * 0.65

    # Total duration at least 22 seconds
    total_len = max(len(base_audio), int(sr * 22.0), int(sr * 9.0) + len(whisper_audio) + int(sr * 2.0))
    final_base = np.zeros(total_len, dtype=np.float32)
    final_base[:len(base_audio)] = base_audio

    # Position whisper starting precisely at 9.0 seconds!
    carrier_whisper = np.zeros(total_len, dtype=np.float32)
    start_sample = int(9.0 * sr)
    end_sample = min(total_len, start_sample + len(whisper_audio))
    carrier_whisper[start_sample:end_sample] = whisper_audio[:end_sample - start_sample]

    print(f"[*] Whispered voice inserted starting at 9.0s through {(end_sample / sr):.2f}s!")

    # Left = Base + Whisper
    left_channel = final_base + carrier_whisper
    # Right = Base - Whisper (180 degree phase inverted)
    right_channel = final_base - carrier_whisper

    # Normalize stereo pair
    max_amp = max(np.max(np.abs(left_channel)), np.max(np.abs(right_channel)))
    left_channel = (left_channel / max_amp * 0.95 * 32767).astype(np.int16)
    right_channel = (right_channel / max_amp * 0.95 * 32767).astype(np.int16)

    stereo_audio = np.stack([left_channel, right_channel], axis=1)
    wavfile.write(out_stereo, sr, stereo_audio)
    print(f"[+] Level 11 Whispered Stereo Phase Audio saved: {out_stereo}")

    # Cleanup temp files
    for temp_f in [whisper_mp3, whisper_wav, temp_base_wav]:
        if os.path.exists(temp_f):
            os.remove(temp_f)

if __name__ == "__main__":
    asyncio.run(make_whisper())
    bake_stereo_whisper()
