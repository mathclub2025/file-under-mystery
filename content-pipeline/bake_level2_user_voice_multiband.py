import os
import subprocess
import numpy as np
from scipy.io import wavfile

def bake_multiband_voicemail():
    ogg_src = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\web\public\evidence\level2 voice.ogg"
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

    sr = 44100
    temp_wav = os.path.join(pub_dir, "temp_user_raw.wav")
    
    # 1. Convert user's original OGG file to 44.1kHz mono WAV
    subprocess.run(["ffmpeg", "-y", "-i", ogg_src, "-ar", str(sr), "-ac", "1", temp_wav], capture_output=True, check=True)
    
    sr_in, voice_raw = wavfile.read(temp_wav)
    if os.path.exists(temp_wav):
        os.remove(temp_wav)
        
    voice_raw = voice_raw.astype(np.float32)
    total_samples = len(voice_raw)
    dur = total_samples / sr
    t = np.linspace(0, dur, total_samples, endpoint=False)
    
    print(f"[+] User original voice duration: {dur:.3f} seconds ({total_samples} samples)")
    
    # Normalize user voice
    max_v = np.max(np.abs(voice_raw)) + 1e-6
    voice_norm = (voice_raw / max_v) * 0.85
    voice_pcm = (voice_norm * 32767).astype(np.int16)
    
    wavfile.write(voice_out, sr, voice_pcm)
    wavfile.write(voice_dist, sr, voice_pcm)
    print(f"[OK] Wrote voice track to {voice_out}")

    # 2. Multi-Band Morse Code Construction for "K 4 P 8 2"
    # Each character is emitted at a distinct carrier frequency at a specific start time:
    # 1. 'K' (- . -)    @ 800 Hz   (starts t = 2.0s)
    # 2. '4' (. . . . -)@ 1500 Hz  (starts t = 5.5s)
    # 3. 'P' (. - - .)  @ 2400 Hz  (starts t = 9.5s)
    # 4. '8' (- - - . .)@ 3200 Hz  (starts t = 13.5s)
    # 5. '2' (. . - - -)@ 3800 Hz  (starts t = 16.8s)

    morse_segments = [
        # (Char, freq_hz, start_sec, [(tone_units, gap_units)])
        (
            "K", 800.0, 2.0,
            [(3, 1), (1, 1), (3, 4)]
        ),
        (
            "4", 1500.0, 5.5,
            [(1, 1), (1, 1), (1, 1), (1, 1), (3, 4)]
        ),
        (
            "P", 2400.0, 9.5,
            [(1, 1), (3, 1), (3, 1), (1, 4)]
        ),
        (
            "8", 3200.0, 13.5,
            [(3, 1), (3, 1), (3, 1), (1, 1), (1, 4)]
        ),
        (
            "2", 3800.0, 16.8,
            [(1, 1), (1, 1), (3, 1), (3, 1), (3, 4)]
        )
    ]

    unit_sec = 0.10
    morse_layer = np.zeros(total_samples, dtype=np.float32)

    for char_label, freq, start_t, pattern in morse_segments:
        curr_t = start_t
        print(f" -> Encoding Morse '{char_label}' at {freq} Hz starting at {curr_t}s")
        for tone_units, gap_units in pattern:
            tone_dur = tone_units * unit_sec
            gap_dur = gap_units * unit_sec

            s_idx = int(curr_t * sr)
            e_idx = int((curr_t + tone_dur) * sr)

            if e_idx < total_samples:
                t_sub = t[s_idx:e_idx]
                N = len(t_sub)
                ramp = min(int(0.010 * sr), N // 4)
                env = np.ones(N, dtype=np.float32)
                if ramp > 0:
                    env[:ramp] = 0.5 * (1.0 - np.cos(np.pi * np.linspace(0, 1, ramp)))
                    env[-ramp:] = 0.5 * (1.0 + np.cos(np.pi * np.linspace(0, 1, ramp)))

                morse_layer[s_idx:e_idx] += np.sin(2 * np.pi * freq * t_sub) * env * 0.85

            curr_t += (tone_dur + gap_dur)

    morse_pcm = (morse_layer * 32767).astype(np.int16)
    wavfile.write(morse_out, sr, morse_pcm)
    wavfile.write(morse_dist, sr, morse_pcm)
    print(f"[OK] Wrote multi-band morse track to {morse_out}")

    # 3. Composite Master
    combined = voice_norm + morse_layer * 0.18
    max_c = np.max(np.abs(combined)) + 1e-6
    master_pcm = (combined / max_c * 0.90 * 32767).astype(np.int16)
    wavfile.write(master_out, sr, master_pcm)
    wavfile.write(master_dist, sr, master_pcm)
    print(f"[OK] Wrote master composite to {master_out}")

if __name__ == "__main__":
    bake_multiband_voicemail()
