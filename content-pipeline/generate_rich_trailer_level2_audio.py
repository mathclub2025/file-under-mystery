import os
import asyncio
import edge_tts
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, lfilter
import subprocess

output_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "trailer", "public", "evidence", "trailer_beacon.wav"))
temp_voice_mp3 = os.path.abspath(os.path.join(os.path.dirname(__file__), "temp_marrow_trailer.mp3"))

MARROW_SPEECH = "If you can hear this... the Blackbox has already initiated. Do not trust the surface signal. Look deeper into the carrier frequency at twenty-four hundred cycles. The proof is hidden in the silence."

async def generate_speech():
    print("[*] Generating clear voicemail speech for Dr. Marrow...")
    comm = edge_tts.Communicate(MARROW_SPEECH, "en-US-GuyNeural", rate="-4%", pitch="-3Hz")
    await comm.save(temp_voice_mp3)

def butter_lowpass_filter(data, cutoff, fs, order=4):
    nyq = 0.5 * fs
    normal_cutoff = max(0.01, min(0.99, cutoff / nyq))
    b, a = butter(order, normal_cutoff, btype='low', analog=False)
    y = lfilter(b, a, data)
    return y

def butter_bandpass_filter(data, lowcut, highcut, fs, order=3):
    nyq = 0.5 * fs
    low = max(0.01, min(0.99, lowcut / nyq))
    high = max(0.01, min(0.99, highcut / nyq))
    b, a = butter(order, [low, high], btype='band', analog=False)
    return lfilter(b, a, data)

def mix_audio():
    temp_voice_wav = os.path.abspath(os.path.join(os.path.dirname(__file__), "temp_marrow_trailer.wav"))
    
    try:
        subprocess.run(["ffmpeg", "-y", "-i", temp_voice_mp3, "-ar", "44100", "-ac", "1", temp_voice_wav], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        fs, speech_data = wavfile.read(temp_voice_wav)
        speech_data = speech_data.astype(np.float32)
        if np.max(np.abs(speech_data)) > 0:
            speech_data = speech_data / np.max(np.abs(speech_data))
    except Exception as e:
        print(f"[!] Fallback: {e}")
        fs = 44100
        duration = 24.0
        t = np.linspace(0, duration, int(fs * duration))
        speech_data = 0.3 * np.sin(2 * np.pi * 180 * t)

    sample_rate = 44100
    duration = 26.0
    total_samples = int(sample_rate * duration)
    t = np.linspace(0, duration, total_samples, endpoint=False)

    # 1. Warm Intelligible Voicemail Bandwidth (100Hz to 1900Hz)
    speech_padded = np.zeros(total_samples)
    speech_len = min(len(speech_data), total_samples)
    offset = int(1.2 * sample_rate)
    end_s = min(offset + speech_len, total_samples)
    speech_padded[offset:end_s] = speech_data[:end_s - offset]

    filtered_speech = butter_bandpass_filter(speech_padded, lowcut=100, highcut=1900, fs=sample_rate, order=3)

    # 2. Gentle Ambient Tape Hiss & Console Hum
    hum = 0.02 * np.sin(2 * np.pi * 60 * t) + 0.01 * np.sin(2 * np.pi * 120 * t)
    noise = np.random.normal(0, 0.015, total_samples)
    low_noise = butter_lowpass_filter(noise, cutoff=900, fs=sample_rate)

    # 3. High Frequency Carrier at 2400 Hz (Subtle amplitude 0.045 - completely masked in raw audio/lowpass, isolated via Bandpass)
    # Target Code: T 3 4 S 2
    carrier_freq = 2400.0
    dit_len = 0.10
    dah_len = dit_len * 3
    element_gap = 0.09
    letter_gap = 1.35

    morse_patterns = {
        'T': [('dah', dah_len)],
        '3': [('dit', dit_len), ('dit', dit_len), ('dit', dit_len), ('dah', dah_len), ('dah', dah_len)],
        '4': [('dit', dit_len), ('dit', dit_len), ('dit', dit_len), ('dit', dit_len), ('dah', dah_len)],
        'S': [('dit', dit_len), ('dit', dit_len), ('dit', dit_len)],
        '2': [('dit', dit_len), ('dit', dit_len), ('dah', dah_len), ('dah', dah_len), ('dah', dah_len)]
    }

    code_seq = ['T', '3', '4', 'S', '2']
    start_time = 3.5
    current_time = start_time

    morse_signal = np.zeros(total_samples)

    for char_idx, char in enumerate(code_seq):
        elements = morse_patterns[char]
        for elem_type, elem_dur in elements:
            start_idx = int(current_time * sample_rate)
            end_idx = int((current_time + elem_dur) * sample_rate)
            if end_idx < total_samples:
                elem_t = t[start_idx:end_idx]
                env = np.sin(np.linspace(0, np.pi, len(elem_t))) ** 0.5
                # Truly subtle carrier (0.045)
                morse_signal[start_idx:end_idx] = 0.045 * np.sin(2 * np.pi * carrier_freq * elem_t) * env
            current_time += elem_dur + element_gap
        current_time += letter_gap

    # Combine: Clear Speech (0.95) + Ambience + Hidden Carrier (0.045)
    combined = (filtered_speech * 0.95) + hum + low_noise + morse_signal

    max_val = np.max(np.abs(combined))
    if max_val > 0:
        combined = (combined / max_val * 0.92 * 32767).astype(np.int16)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    wavfile.write(output_path, sample_rate, combined)
    print(f"[+] Re-baked Level 2 audio with hidden 2400Hz carrier to {output_path}")

if __name__ == "__main__":
    asyncio.run(generate_speech())
    mix_audio()
