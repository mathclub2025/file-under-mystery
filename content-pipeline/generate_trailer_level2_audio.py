import os
import numpy as np
from scipy.io import wavfile

output_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "trailer", "public", "evidence", "trailer_beacon.wav"))
os.makedirs(os.path.dirname(output_path), exist_ok=True)

def generate_trailer_audio():
    sample_rate = 44100
    duration = 22.0  # seconds
    total_samples = int(sample_rate * duration)
    t = np.linspace(0, duration, total_samples, endpoint=False)

    # 1. Atmospheric low-frequency background hum and filtered rumble (50 - 600 Hz)
    hum = 0.25 * np.sin(2 * np.pi * 120 * t) + 0.15 * np.sin(2 * np.pi * 240 * t) + 0.1 * np.sin(2 * np.pi * 360 * t)
    noise = np.random.normal(0, 0.12, total_samples)
    
    # Lowpass filter the noise using simple moving average
    window_size = 35
    low_noise = np.convolve(noise, np.ones(window_size)/window_size, mode='same')
    
    ambient = hum + low_noise * 1.5

    # 2. Morse Code Carrier Pulse Train at 2400 Hz
    # Target Code: T 3 4 S 2
    # T: -
    # 3: ...--
    # 4: ....-
    # S: ...
    # 2: ..---
    carrier_freq = 2400.0
    dit_len = 0.12  # 120ms
    dah_len = dit_len * 3
    element_gap = dit_len
    char_gap = dit_len * 3
    word_gap = dit_len * 7

    morse_patterns = {
        'T': [('dah', dah_len)],
        '3': [('dit', dit_len), ('dit', dit_len), ('dit', dit_len), ('dah', dah_len), ('dah', dah_len)],
        '4': [('dit', dit_len), ('dit', dit_len), ('dit', dit_len), ('dit', dit_len), ('dah', dah_len)],
        'S': [('dit', dit_len), ('dit', dit_len), ('dit', dit_len)],
        '2': [('dit', dit_len), ('dit', dit_len), ('dah', dah_len), ('dah', dah_len), ('dah', dah_len)]
    }

    code_seq = ['T', '3', '4', 'S', '2']
    start_time = 3.5  # Start Morse beeps after 3.5 seconds of atmospheric build-up
    current_time = start_time

    morse_signal = np.zeros(total_samples)

    for char_idx, char in enumerate(code_seq):
        elements = morse_patterns[char]
        for elem_type, elem_dur in elements:
            start_idx = int(current_time * sample_rate)
            end_idx = int((current_time + elem_dur) * sample_rate)
            if end_idx < total_samples:
                elem_t = t[start_idx:end_idx]
                # Smooth cosine envelope to avoid audio clicks
                env = np.sin(np.linspace(0, np.pi, len(elem_t))) ** 0.5
                morse_signal[start_idx:end_idx] = 0.45 * np.sin(2 * np.pi * carrier_freq * elem_t) * env
            current_time += elem_dur + element_gap
        current_time += (char_gap - element_gap)

    # Combine ambient noise with Morse signal
    combined = ambient + morse_signal
    
    # Normalize to 16-bit range
    max_val = np.max(np.abs(combined))
    if max_val > 0:
        combined = (combined / max_val * 0.9 * 32767).astype(np.int16)

    wavfile.write(output_path, sample_rate, combined)
    print(f"[+] Saved Level 2 Trailer Audio to {output_path}")

if __name__ == "__main__":
    generate_trailer_audio()
