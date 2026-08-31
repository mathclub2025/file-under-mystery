import os
import subprocess
import numpy as np
from scipy.io import wavfile

def bake_balanced_tracks():
    ogg_src = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\web\public\evidence\level2 voice.ogg"
    pub_dir = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\web\public\evidence"
    dist_dir = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\web\dist\evidence"
    
    os.makedirs(pub_dir, exist_ok=True)
    os.makedirs(dist_dir, exist_ok=True)

    sr = 44100
    temp_wav = os.path.join(pub_dir, "temp_raw_user.wav")
    subprocess.run(["ffmpeg", "-y", "-i", ogg_src, "-ar", str(sr), "-ac", "1", temp_wav], capture_output=True, check=True)
    
    sr_in, voice_raw = wavfile.read(temp_wav)
    if os.path.exists(temp_wav):
        os.remove(temp_wav)

    voice_raw = voice_raw.astype(np.float32)
    total_samples = len(voice_raw)
    dur = total_samples / sr
    t = np.linspace(0, dur, total_samples, endpoint=False)
    
    print(f"[+] Voice track: {dur:.3f}s ({total_samples} samples)")

    # 1. Pure Voice File (ZERO MORSE)
    max_v = np.max(np.abs(voice_raw)) + 1e-6
    voice_norm = (voice_raw / max_v) * 0.85
    voice_pcm = (voice_norm * 32767).astype(np.int16)
    
    wavfile.write(os.path.join(pub_dir, "voicemail_voice.wav"), sr, voice_pcm)
    wavfile.write(os.path.join(dist_dir, "voicemail_voice.wav"), sr, voice_pcm)
    wavfile.write(os.path.join(pub_dir, "voicemail.wav"), sr, voice_pcm)
    wavfile.write(os.path.join(dist_dir, "voicemail.wav"), sr, voice_pcm)
    print(f"[OK] Pure voice track saved with 0 Morse bleed.")

    # 2. Five Separate Morse WAV Files (Clean, non-piercing amplitude = 0.35, 12ms smooth cosine ramp)
    # (Char, filename, freq_hz, start_sec, [(tone_units, gap_units)])
    unit_sec = 0.10
    morse_definitions = [
        ("K", "morse_k.wav", 800.0,  2.0,  [(3, 1), (1, 1), (3, 4)]),
        ("4", "morse_4.wav", 1500.0, 5.5,  [(1, 1), (1, 1), (1, 1), (1, 1), (3, 4)]),
        ("P", "morse_p.wav", 2400.0, 9.5,  [(1, 1), (3, 1), (3, 1), (1, 4)]),
        ("8", "morse_8.wav", 3200.0, 13.5, [(3, 1), (3, 1), (3, 1), (1, 1), (1, 4)]),
        ("2", "morse_2.wav", 3800.0, 16.8, [(1, 1), (1, 1), (3, 1), (3, 1), (3, 4)])
    ]

    for char_label, filename, freq, start_t, pattern in morse_definitions:
        morse_layer = np.zeros(total_samples, dtype=np.float32)
        curr_t = start_t
        for tone_units, gap_units in pattern:
            tone_dur = tone_units * unit_sec
            gap_dur = gap_units * unit_sec

            s_idx = int(curr_t * sr)
            e_idx = int((curr_t + tone_dur) * sr)

            if e_idx < total_samples:
                t_sub = t[s_idx:e_idx]
                N = len(t_sub)
                ramp = min(int(0.012 * sr), N // 4)
                env = np.ones(N, dtype=np.float32)
                if ramp > 0:
                    # Raised cosine envelope
                    env[:ramp] = 0.5 * (1.0 - np.cos(np.pi * np.linspace(0, 1, ramp)))
                    env[-ramp:] = 0.5 * (1.0 + np.cos(np.pi * np.linspace(0, 1, ramp)))

                # Gentle 0.40 amplitude
                morse_layer[s_idx:e_idx] = np.sin(2 * np.pi * freq * t_sub) * env * 0.40

            curr_t += (tone_dur + gap_dur)

        pcm = (morse_layer * 32767).astype(np.int16)
        out_p = os.path.join(pub_dir, filename)
        out_d = os.path.join(dist_dir, filename)
        wavfile.write(out_p, sr, pcm)
        wavfile.write(out_d, sr, pcm)
        print(f"[OK] Generated '{char_label}' ({freq} Hz, start {start_t}s) -> {filename}")

if __name__ == "__main__":
    bake_balanced_tracks()
