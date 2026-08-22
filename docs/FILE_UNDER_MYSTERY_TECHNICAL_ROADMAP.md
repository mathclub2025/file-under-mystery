# FILE UNDER MYSTERY — Technical Architecture & Build Roadmap
*VIT Mathematics Club Event Documentation*

## 1. Executive Summary
**File Under Mystery** is an interactive, browser-based digital forensics and applied mathematics investigation platform.

## 2. Tech Stack
- **Frontend:** React 18 + Vite + Tailwind CSS + Lucide Icons
- **Audio & Signal:** wavesurfer.js, fft.js (2D FFT)
- **Math & Forensics:** mathjs, fflate (ZIP extractor in JS)
- **Backend & Auth:** Supabase (PostgreSQL, Realtime Leaderboard, Edge Functions)
- **Offline Pipeline:** Python 3.10+ (Pillow, NumPy, SciPy, Pydub, OpenCV)

## 3. Level Summary
- **Level 1 (Image):** Histogram dynamic range stretch [10,40] -> `A19X7`
- **Level 2 (Audio):** 3kHz Spectrogram Morse code pulse -> `K4P82`
- **Level 3 (Video):** Frame difference filter on strobe recording -> `XT4Q1`
- **Level 4 (Stego):** Blue channel bitplane 0 LSB extraction -> ZIP -> `M77RB`
- **Level 5 (Cipher):** Prime-indexed modular shift stream -> `P0W3R`
- **Level 6 (Network):** Triage packet size & inspect Base32 auth token -> `NT2K5`
- **Level 7 (Matrix):** 8x8 Permutation inversion + Transpose + 90° rotation -> `BXZ19`
- **Level 8 (Fourier):** 2D FFT Radial bandpass filter + IFFT -> `FIN4L`
- **Final Boss:** Reverse prime assembly [8..1] -> Vigenère decryption -> Final Truth

## 4. Execution Schedule
- **Week 1:** Scaffolding, Supabase DB & Edge Function, Shared LabEngine, Levels 1 & 5.
- **Week 2:** Audio (WaveSurfer) + Video (Diff) + Stego (LSB) + Realtime Leaderboard.
- **Week 3:** Matrix Permutation + 2D FFT Lab + Hint System + Internal Dry Run.
- **Week 4:** Final Boss assembly, Blind Playtesting with students, Campus WiFi load testing.
