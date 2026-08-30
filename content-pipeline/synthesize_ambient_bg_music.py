import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, lfilter
import subprocess
import os

output_wav = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\trailer\public\audio\mystery_ambient_bg.wav"
output_mp3 = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery\apps\trailer\public\audio\mystery_ambient_bg.mp3"
review_dir = r"c:\Personal\VIT\Maths Club\Events\File Under Mystery"
review_mp3 = os.path.join(review_dir, "mystery_ambient_bg_for_review.mp3")

def butter_lowpass(cutoff, fs, order=4):
    nyq = 0.5 * fs
    normal_cutoff = max(0.01, min(0.99, cutoff / nyq))
    return butter(order, normal_cutoff, btype='low', analog=False)

def butter_bandpass(lowcut, highcut, fs, order=3):
    nyq = 0.5 * fs
    low = max(0.01, min(0.99, lowcut / nyq))
    high = max(0.01, min(0.99, highcut / nyq))
    return butter(order, [low, high], btype='band', analog=False)

def generate_mysterious_music():
    fs = 44100
    duration = 54.0  # 54-second evolving loop
    total_samples = int(fs * duration)
    t = np.linspace(0, duration, total_samples, endpoint=False)

    print("[*] Generating Heightened Mystery Soundtrack with Dynamic Tension Spikes...")

    # 1. Deep Tritone / Diminished Sub-Bass Drone (Eerie A1 - D#2 cluster)
    sub_lfo = 0.5 + 0.5 * np.sin(2 * np.pi * 0.04 * t)
    sub_pitch_drift = 55.0 + 1.2 * np.sin(2 * np.pi * 0.03 * t)
    sub_drone = (
        0.38 * np.sin(2 * np.pi * sub_pitch_drift * t) +
        0.22 * np.sin(2 * np.pi * (sub_pitch_drift * 1.4142) * t + 0.6) +  # Tritone harmonic
        0.18 * np.sin(2 * np.pi * 32.7 * t + 1.2)  # Low C sub
    ) * (0.65 + 0.35 * sub_lfo)

    # 2. Dark Microtonal Dissonant Synth Pads (Suspense cluster: A2, C#3, D#3, G3, Bb3)
    pad_freqs = [110.0, 138.59, 155.56, 196.0, 233.08, 311.13]
    pad_signal = np.zeros(total_samples)

    for i, freq in enumerate(pad_freqs):
        # Slow random microtonal wandering
        wobble = np.sin(2 * np.pi * (0.02 + 0.008 * i) * t) * 2.5
        detune = 1.0 + (i * 0.002 - 0.005)
        lfo_phase = np.sin(2 * np.pi * (0.03 + 0.012 * i) * t)

        osc1 = np.sin(2 * np.pi * (freq + wobble) * t)
        osc2 = 0.45 * np.sin(2 * np.pi * ((freq * detune) - wobble) * t + 1.8)
        osc3 = 0.25 * np.sin(2 * np.pi * (freq * 0.5) * t)
        
        pad_signal += (osc1 + osc2 + osc3) * (0.55 + 0.45 * lfo_phase) / len(pad_freqs)

    b_pad, a_pad = butter_lowpass(cutoff=420, fs=fs, order=4)
    filtered_pad = lfilter(b_pad, a_pad, pad_signal)

    # 3. Eerie Gliding Waterphone / Cold Metallic Reverb Drone
    glide_freq = 440.0 + 80.0 * np.sin(2 * np.pi * 0.025 * t)
    shimmer = 0.06 * np.sin(2 * np.pi * glide_freq * t) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.06 * t))
    shimmer += 0.04 * np.sin(2 * np.pi * (glide_freq * 1.414) * t + 0.9) * (0.5 + 0.5 * np.cos(2 * np.pi * 0.05 * t))
    b_shim, a_shim = butter_bandpass(250, 850, fs, order=3)
    filtered_shimmer = lfilter(b_shim, a_shim, shimmer)

    # 4. MYSTERIOUS TENSION SPIKES (Sudden eerie cinematic bursts & drops)
    spike_signal = np.zeros(total_samples)

    spike_events = [
        # (time_sec, spike_type, duration_sec, intensity)
        (7.5, "sub_drop_ping", 3.5, 0.65),     # Spike 1: Sub drop + eerie high metallic chime
        (18.0, "reverse_swell_sting", 4.0, 0.75), # Spike 2: Rising reversed tape sting + echoing tail
        (30.5, "dissonant_surge", 3.8, 0.70),    # Spike 3: Dissonant microtonal cluster surge
        (43.0, "hollow_clang_drop", 4.2, 0.80),  # Spike 4: Heavy hollow acoustic impact with sub decay
    ]

    for start_sec, stype, dur_sec, amp in spike_events:
        idx_start = int(start_sec * fs)
        idx_end = min(total_samples, int((start_sec + dur_sec) * fs))
        spike_len = idx_end - idx_start
        st = np.linspace(0, dur_sec, spike_len, endpoint=False)

        if stype == "sub_drop_ping":
            # Pitch drop from 90Hz to 35Hz + subtle high ping at 620Hz
            pitch_env = 90.0 * np.exp(-st * 2.0) + 35.0
            sub_burst = np.sin(2 * np.pi * pitch_env * st) * np.exp(-st * 1.2)
            ping = np.sin(2 * np.pi * 622.25 * st) * np.exp(-st * 3.5) * 0.35
            spike_signal[idx_start:idx_end] += (sub_burst + ping) * amp

        elif stype == "reverse_swell_sting":
            # Reverse crescendo rising in intensity then sharp cutoff with reverb tail
            crescendo_len = int(2.5 * fs)
            if idx_start + crescendo_len <= total_samples:
                c_t = np.linspace(0, 2.5, crescendo_len)
                swell = np.sin(2 * np.pi * (180.0 + 80.0 * (c_t**2)) * c_t) * (c_t / 2.5)**2.5
                tail = np.sin(2 * np.pi * 311.0 * st[crescendo_len:]) * np.exp(-st[crescendo_len:] * 2.0) if len(st) > crescendo_len else np.array([])
                full_event = np.concatenate([swell, tail])[:spike_len]
                spike_signal[idx_start:idx_start+len(full_event)] += full_event * amp

        elif stype == "dissonant_surge":
            # Swelling dissonant cluster at D# and E
            cluster = (np.sin(2 * np.pi * 311.13 * st) + np.sin(2 * np.pi * 329.63 * st)) * np.sin(np.pi * (st / dur_sec))
            spike_signal[idx_start:idx_end] += cluster * amp

        elif stype == "hollow_clang_drop":
            # Dark hollow metallic resonance and deep sub impact
            clang = (np.sin(2 * np.pi * 123.47 * st) + 0.5 * np.sin(2 * np.pi * 246.94 * st)) * np.exp(-st * 1.5)
            sub_thud = np.sin(2 * np.pi * 45.0 * st) * np.exp(-st * 0.8)
            spike_signal[idx_start:idx_end] += (clang + sub_thud) * amp

    # 5. Analog Tape Atmosphere & Resonant Texture
    noise = np.random.normal(0, 0.02, total_samples)
    b_noise, a_noise = butter_bandpass(70, 1400, fs, order=2)
    tape_hiss = lfilter(b_noise, a_noise, noise) * 0.35
    mains_hum = 0.03 * np.sin(2 * np.pi * 60.0 * t) + 0.015 * np.sin(2 * np.pi * 120.0 * t)

    # 6. Composite Mix
    mix = (sub_drone * 0.40) + (filtered_pad * 0.38) + (filtered_shimmer * 0.15) + (spike_signal * 0.35) + tape_hiss + mains_hum

    # 7. Apply Seamless Looping Equal-Power Crossfade (3-second boundary fade)
    fade_len = int(fs * 3.0)
    fade_in = np.sin(np.linspace(0, np.pi / 2, fade_len)) ** 2
    fade_out = np.cos(np.linspace(0, np.pi / 2, fade_len)) ** 2

    mix[:fade_len] = mix[:fade_len] * fade_in + mix[-fade_len:] * fade_out
    mix[-fade_len:] = mix[:fade_len]

    # Normalize
    max_amp = np.max(np.abs(mix))
    if max_amp > 0:
        mix = (mix / max_amp * 0.90 * 32767).astype(np.int16)

    # Save lossless WAV and MP3
    os.makedirs(os.path.dirname(output_wav), exist_ok=True)
    wavfile.write(output_wav, fs, mix)
    print(f"[+] Saved WAV: {output_wav}")

    try:
        subprocess.run(["ffmpeg", "-y", "-i", output_wav, "-b:a", "192k", output_mp3], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        subprocess.run(["ffmpeg", "-y", "-i", output_wav, "-b:a", "192k", review_mp3], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print(f"[+] Saved updated mysterious MP3 with spikes: {review_mp3}")
    except Exception as e:
        print(f"[!] Ffmpeg conversion note: {e}")

if __name__ == "__main__":
    generate_mysterious_music()
