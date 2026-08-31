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

def bake_dual_tracks(voice_wav_path):
    pub_dir = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\web\public\evidence"
    dist_dir = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\web\dist\evidence"
    os.makedirs(pub_dir, exist_ok=True)
    os.makedirs(dist_dir, exist_ok=True)

    voice_out = os.path.join(pub_dir, "voicemail_voice.wav")
    morse_out = os.path.join(pub_dir, "voicemail_morse.wav")
    master_out = os.path.join(pub_dir, "voicemail.wav")

    voice_dist = os.path.join(dist_dir, "voicemail_voice.wav")
    morse_dist = os.path.join(dist_dir, "voicemail_morse.wav")
    master_dist = os.path.join(dist_dir, "voicemail.wav")
    
    sr, voice_raw = wavfile.read(voice_wav_path)
    voice_raw = voice_raw.astype(np.float32)
    voice_raw = voice_raw / (np.max(np.abs(voice_raw)) + 1e-6)
    
    # Target duration: 20.0 seconds
    target_dur = 20.0
    total_samples = int(sr * target_dur)
    t = np.linspace(0, target_dur, total_samples, endpoint=False)
    
    # 1. VOICE LAYER (Speech + room tape hiss + 60Hz hum)
    voice_layer = np.zeros(total_samples, dtype=np.float32)
    start_sample = int(sr * 0.8)
    v_len = min(len(voice_raw), total_samples - start_sample)
    voice_layer[start_sample:start_sample + v_len] = voice_raw[:v_len] * 0.80
    
    # Apply telephone bandpass (300Hz - 1400Hz) to speech
    sos = signal.butter(4, [300, 1400], btype='bandpass', fs=sr, output='sos')
    voice_filtered = signal.sosfilt(sos, voice_layer) * 0.90
    
    np.random.seed(42)
    tape_hiss = np.random.randn(total_samples).astype(np.float32) * 0.012
    hum = (np.sin(2 * np.pi * 60 * t) * 0.015).astype(np.float32)
    voice_final = voice_filtered + tape_hiss + hum
    
    # Normalize Voice
    max_v = np.max(np.abs(voice_final)) + 1e-6
    voice_pcm = (voice_final / max_v * 0.88 * 32767).astype(np.int16)
    wavfile.write(voice_out, sr, voice_pcm)
    wavfile.write(voice_dist, sr, voice_pcm)
    print(f"[OK] Wrote voice track to {voice_out}")
    
    # 2. MORSE LAYER: 3000 Hz Carrier Tone pulsing "K4P82"
    # K: - . -   (3, 1), (1, 1), (3, 8)
    # 4: . . . . -  (1, 1), (1, 1), (1, 1), (1, 1), (3, 8)
    # P: . - - . (1, 1), (3, 1), (3, 1), (1, 8)
    # 8: - - - . .  (3, 1), (3, 1), (3, 1), (1, 1), (1, 8)
    # 2: . . - - -  (1, 1), (1, 1), (3, 1), (3, 1), (3, 12)
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
        (1, 1), (1, 1), (3, 1), (3, 1), (3, 12)
    ]
    
    unit_sec = 0.11
    current_time = 2.2
    morse_layer = np.zeros(total_samples, dtype=np.float32)
    carrier_freq = 3000.0  # 3 kHz carrier
    
    for tone_units, gap_units in morse_pattern:
        tone_dur = tone_units * unit_sec
        gap_dur = gap_units * unit_sec
        
        start_idx = int(current_time * sr)
        end_idx = int((current_time + tone_dur) * sr)
        
        if end_idx < total_samples:
            t_sub = t[start_idx:end_idx]
            N = len(t_sub)
            ramp = min(int(0.010 * sr), N // 4)
            env = np.ones(N, dtype=np.float32)
            if ramp > 0:
                # Cosine smoothing envelope to prevent click harmonics in low frequencies
                env[:ramp] = 0.5 * (1.0 - np.cos(np.pi * np.linspace(0, 1, ramp)))
                env[-ramp:] = 0.5 * (1.0 + np.cos(np.pi * np.linspace(0, 1, ramp)))
            morse_layer[start_idx:end_idx] = np.sin(2 * np.pi * carrier_freq * t_sub) * env
            
        current_time += (tone_dur + gap_dur)
        
    morse_pcm = (morse_layer * 0.85 * 32767).astype(np.int16)
    wavfile.write(morse_out, sr, morse_pcm)
    wavfile.write(morse_dist, sr, morse_pcm)
    print(f"[OK] Wrote morse track to {morse_out}")
    
    # 3. COMPOSITE MASTER (Subtle blend)
    combined = voice_final + morse_layer * 0.20
    max_c = np.max(np.abs(combined)) + 1e-6
    master_pcm = (combined / max_c * 0.88 * 32767).astype(np.int16)
    wavfile.write(master_out, sr, master_pcm)
    wavfile.write(master_dist, sr, master_pcm)
    print(f"[OK] Wrote master composite to {master_out}")

async def main():
    voice_wav = await generate_speech()
    bake_dual_tracks(voice_wav)

if __name__ == "__main__":
    asyncio.run(main())
