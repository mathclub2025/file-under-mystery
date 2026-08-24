import asyncio
import edge_tts
import numpy as np
from scipy.io import wavfile
from scipy import signal
import os
import subprocess

async def generate_speech():
    text = (
        "If anyone in the department is receiving this... Room 418 has been breached. "
        "The security keys have been scattered across the harmonic relays. "
        "Do not trust the perimeter cameras. "
        "Listen carefully to the carrier tone... before the line goes dead."
    )
    temp_mp3 = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\content-pipeline\temp_marrow_voicemail.mp3"
    temp_wav = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\content-pipeline\temp_marrow_voicemail.wav"
    
    communicate = edge_tts.Communicate(text, "en-US-RogerNeural", rate="-8%", pitch="-10Hz")
    await communicate.save(temp_mp3)
    
    # Convert to 44.1kHz mono WAV
    subprocess.run(["ffmpeg", "-y", "-i", temp_mp3, "-ar", "44100", "-ac", "1", temp_wav], capture_output=True, check=True)
    return temp_wav

def bake_voicemail(voice_wav_path):
    out_wav = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\web\public\evidence\voicemail.wav"
    dist_wav = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\web\dist\evidence\voicemail.wav"
    spec_path = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\web\public\evidence\spectrogram.png"
    
    sr, voice_raw = wavfile.read(voice_wav_path)
    voice_raw = voice_raw.astype(np.float32)
    voice_raw = voice_raw / (np.max(np.abs(voice_raw)) + 1e-6)
    
    # Target duration: ~18 seconds
    target_dur = 18.0
    total_samples = int(sr * target_dur)
    t = np.linspace(0, target_dur, total_samples, endpoint=False)
    
    # Pad or fit voice
    voice_layer = np.zeros(total_samples, dtype=np.float32)
    v_len = min(len(voice_raw), total_samples - int(sr * 0.5))
    voice_layer[int(sr * 0.5):int(sr * 0.5) + v_len] = voice_raw[:v_len] * 0.70
    
    # Apply telephone bandpass (300Hz - 1400Hz) to speech so it sounds like a real voicemail
    sos = signal.butter(4, [300, 1400], btype='bandpass', fs=sr, output='sos')
    voice_filtered = signal.sosfilt(sos, voice_layer) * 0.85
    
    # Add room tape hiss and 60Hz ground hum
    np.random.seed(42)
    tape_hiss = np.random.randn(total_samples) * 0.015
    hum = np.sin(2 * np.pi * 60 * t) * 0.02
    
    # Morse code at 2400 Hz: K (-.-) [PAUSE] 4 (....-) [PAUSE] P (.--.) [PAUSE] 8 (---..) [PAUSE] 2 (..---)
    # Generous inter-letter pauses (8 units = ~0.96s)
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
        (1, 1), (1, 1), (3, 1), (3, 1), (3, 10)
    ]
    
    unit_sec = 0.11
    current_time = 2.2
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
            morse_layer[start_idx:end_idx] = np.sin(2 * np.pi * carrier_freq * t_sub) * 0.22 * env
            
        current_time += (tone_dur + gap_dur)
        
    combined = voice_filtered + tape_hiss + hum + morse_layer
    max_amp = np.max(np.abs(combined)) + 1e-6
    combined_pcm = (combined / max_amp * 0.90 * 32767).astype(np.int16)
    
    wavfile.write(out_wav, sr, combined_pcm)
    if os.path.exists(os.path.dirname(dist_wav)):
        wavfile.write(dist_wav, sr, combined_pcm)
    print(f"[SUCCESS] Voicemail audio baked with real speech + Morse to: {out_wav}")

async def main():
    voice_wav = await generate_speech()
    bake_voicemail(voice_wav)

if __name__ == "__main__":
    asyncio.run(main())
