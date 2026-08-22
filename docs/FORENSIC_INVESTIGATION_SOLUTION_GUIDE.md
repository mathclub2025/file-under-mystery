# FORENSIC INVESTIGATION SOLUTION GUIDE & BENCHMARK MANUAL

**Case File:** `#M-2026-0819`  
**Target:** Dr. Elias Marrow — 12 Mathematical Anomalies & Blackbox Hardware Bootstrap  
**VIT Mathematics Club // Event Forensics Benchmark Manual**

---

## 🎯 COMPLETE LEVEL-BY-LEVEL SOLUTION WORKBOOK

---

### 🌲 Level 01: The Photograph
* **Evidence Asset:** `forest.png`
* **Forensic Method:**
  1. Open the image forensic lab controls.
  2. Adjust **Dynamic Range Histogram Stretch** (Min $\approx 8\text{--}16$, Max $\approx 30\text{--}50$).
  3. Increase **Gamma Curve to $\sim 1.60$**.
  4. Use the **Zoom In** and **Drag-to-Pan** feature to inspect the dark tree root shadows.
  5. Find the 5 scattered numbered coordinates burned into the shadow pockets:
     $$\mathbf{1:A} \quad|\quad \mathbf{2:1} \quad|\quad \mathbf{3:9} \quad|\quad \mathbf{4:X} \quad|\quad \mathbf{5:7}$$
* **Mathematical Assembly:** Sequence tags in numerical order $1 \to 5$.
* **Verification Token:** `A19X7`

---

### 🎙️ Level 02: The Voicemail
* **Evidence Asset:** `voicemail.wav` & `spectrogram.png`
* **Forensic Method:**
  1. Start audio playback in the audio console. By default, the Low-Pass filter ($800\text{ Hz}$) lets players hear Dr. Marrow's clear voicemail.
  2. Switch the filter mode to **Bandpass Isolator** or tune the **Frequency Slider to $\approx 2400\text{ Hz}$**.
  3. The spoken voice fades away and the $2400\text{ Hz}$ Morse pulse train emerges clearly.
  4. Decode the 5 Morse characters starting at $2.8\text{s}$:
     $$-.- \text{ (K)} \quad ....- \text{ (4)} \quad .--. \text{ (P)} \quad ---.. \text{ (8)} \quad ..--- \text{ (2)}$$
* **Verification Token:** `K4P82`

---

### 📹 Level 03: The Corridor Video
* **Evidence Asset:** `hallway.mp4`
* **Forensic Method:**
  1. Use the **Frame Timeline Scrubber** or **Step +1 Frame** button to advance to **Frame 142** ($\approx 4.73\text{s}$).
  2. On Frame 142 only, an anomaly is submerged in the upper-left conduit shadow (`top: 14%, left: 7%`).
  3. Read the burned Base64 string: `VG9rZW46IFhUNFEx`.
  4. Decode Base64 in terminal or external tool: `VG9rZW46IFhUNFEx` $\longrightarrow$ `Token: XT4Q1`.
* **Verification Token:** `XT4Q1`

---

### 🏖️ Level 04: The Holiday Photo
* **Evidence Asset:** `holiday.png`
* **Forensic Method:**
  1. Use the **Color Channel Slicer** and **Bitplane Depth Slider** with $X, Y$ phase offset sliders.
  2. Locate the 5 submerged tags across color channels and bitplanes:
     * Red Channel $\times$ Bit 0 $\to$ `1:M`
     * Green Channel $\times$ Bit 1 $\to$ `2:7`
     * Blue Channel $\times$ Bit 0 $\to$ `3:7`
     * Blue Channel $\times$ Bit 2 $\to$ `4:R`
     * Blue Channel $\times$ Bit 3 $\to$ `5:B`
  3. Assemble the ordered tags: $1\text{:}M, 2\text{:}7, 3\text{:}7, 4\text{:}R, 5\text{:}B \implies \mathbf{M77RB}$.
* **Verification Token:** `M77RB`

---

### 📜 Level 05: The Shredded Notes
* **Evidence Asset:** `shredded_notes.png`
* **Forensic Method:**
  1. Inspect the handwritten prime sequence indices on the manuscript: $n_1=219, n_2=163, n_3=97, n_4=59$.
  2. Find the $n$-th prime numbers and compute modulo 26:
     * $P_{219} = 1367 \implies 1367 \bmod 26 = \mathbf{15\text{ (P)}}$
     * $P_{163} = 967 \implies 967 \bmod 26 = \mathbf{5\text{ (F)}}$
     * $P_{97} = 509 \implies 509 \bmod 26 = \mathbf{15\text{ (P)}}$
     * $P_{59} = 277 \implies 277 \bmod 26 = \mathbf{17\text{ (J)}}$
  3. Turn the **4 Running Key Shift Dials** to $[15, 5, 15, 17]$.
  4. The 12-letter cipher grid `ETLVGTUJTATE` shifts to spell `POWEROFSEVEN` $\implies \mathbf{P0W3R}$.
* **Verification Token:** `P0W3R`

---

### 🌐 Level 06: The Network Capture
* **Evidence Asset:** `network_capture.json`
* **Forensic Method:**
  1. Scroll through the 80 captured HTTP requests.
  2. Notice the large exfiltration payload anomaly: **Packet #47** ($64.8\text{ KB}$ vs routine $\sim 1\text{--}18\text{ KB}$).
  3. Inspect Packet #47 to read the authorization header: `Bearer TlQySzU=`.
  4. Decode the Base64 string: `TlQySzU=` $\longrightarrow \mathbf{NT2K5}$.
* **Verification Token:** `NT2K5`

---

### 〰️ Level 07: Harmonic Wave Superposition
* **Evidence Asset:** Continuous Oscilloscope Wave Generator
* **Forensic Method:**
  1. Inspect the CRT phosphor grid with 38 horizontal and 46 vertical flowing sinusoidal wave strands.
  2. Tune the carrier channels (`CH-01` through `CH-05`), harmonic frequency ratios, and interference phase angles.
  3. The continuous flowing background wave lines bend and warp into the 5 glyphs:
     $$\mathbf{B \quad X \quad Z \quad 1 \quad 9}$$
* **Verification Token:** `BXZ19`

---

### 🪐 Level 08: Orbital Telemetry & Astrometry Notebook Riddles
* **Evidence Asset:** Rooftop Observatory Telemetry Scope & Sector Logs
* **Forensic Method:**
  1. Read the 5 entries in the **Rooftop Observatory Notebook**:
     * **Sector 1 (Alpha Relay)**: Quarter-century ($X=25$) & $7 \times 5$ work days ($Y=35$) $\implies \mathbf{(25, 35)} \to \mathbf{1:E}$
     * **Sector 2 (Cygnus Nebula)**: Midpoint between 20 & 50 ($X=35$) and 30 & 50 ($Y=40$) $\implies \mathbf{(35, 40)} \to \mathbf{2:L}$
     * **Sector 3 (Orion Core)**: Human body temp in °C ($X=37$) & prime before 80 ($Y=79$) $\implies \mathbf{(37, 79)} \to \mathbf{3:7}$
     * **Sector 4 (Pegasus Cluster)**: Atomic number of Lead ($X=82$) & $40 - 2$ ($Y=38$) $\implies \mathbf{(82, 38)} \to \mathbf{4:P}$
     * **Sector 5 (Horizon Array)**: Around the world in 80 days ($X=80$) & $75\%$ of 100 ($Y=75$) $\implies \mathbf{(80, 75)} \to \mathbf{5:9}$
  2. Enter each calculated $(X, Y)$ coordinate into the **Telescope Reticle Finder** (or click the radar map).
  3. The optical crosshairs lock onto each beacon and reveal the 5 character tags:
     $$\mathbf{1:E} \quad|\quad \mathbf{2:L} \quad|\quad \mathbf{3:7} \quad|\quad \mathbf{4:P} \quad|\quad \mathbf{5:9}$$
  4. Sequence the 5 tags in numerical order:
     $$\mathbf{E \quad L \quad 7 \quad P \quad 9} \implies \mathbf{EL7P9}$$
* **Verification Token:** `EL7P9`

---

### 🌊 Level 09: 2D Fourier Dispersion
* **Evidence Asset:** `signal_fft.png`
* **Forensic Method:**
  1. Adjust the **Radial Bandpass Filter** $(r_{min}, r_{max})$ and **Angular Phase ($\theta$)** across 5 distinct harmonic resonance combinations:
     * $r \approx 26\text{ px} \times \theta \approx 30^\circ \implies \mathbf{1:F}$
     * $r \approx 48\text{ px} \times \theta \approx 75^\circ \implies \mathbf{2:I}$
     * $r \approx 70\text{ px} \times \theta \approx 120^\circ \implies \mathbf{3:N}$
     * $r \approx 92\text{ px} \times \theta \approx 45^\circ \implies \mathbf{4:4}$
     * $r \approx 110\text{ px} \times \theta \approx 150^\circ \implies \mathbf{5:L}$
  2. Assemble the 5 harmonic tags sequentially ($1\text{:}F, 2\text{:}I, 3\text{:}N, 4\text{:}4, 5\text{:}L$) $\implies \mathbf{FIN4L}$.
* **Verification Token:** `FIN4L`

---

### 🔺 Level 10: The Lattice Growth
* **Evidence Asset:** `rule30_lattice.png` & `rule30_matrix.json`
* **Forensic Method:**
  1. Open the **Rule 30 Predecessor Constraint Solver**.
  2. Test 8-bit predecessor seed candidates against Rule 30: $f(p,q,r) = p \oplus (q \lor r)$.
  3. The unique valid predecessor seed is `10100110` $\to$ token `R30S4`.
* **Verification Token:** `R30S4`

---

### 📻 Level 11: The Dual Transmission
* **Evidence Asset:** `stereo_phase_carrier.wav`
* **Forensic Method:**
  1. Start audio playback in the audio console.
  2. Toggle the **Right Channel 180° Phase Inverter ($L - R$)**.
  3. Listen to the isolated whisper voice starting **precisely at 9.0s**: *"Phase Three. Token is P... H... 4... Z... 3..."*.
* **Verification Token:** `PH4Z3`

---

### 🗺️ Level 12: The Chromatic Distance Vector Cipher (VIT Chennai)
* **Evidence Asset:** `vit_chennai_map.jpg` (Digital Survey Map of VIT Chennai)
* **Forensic Method:**
  1. Inspect the 5 perimeter buildings on the map to sample their color signatures:
     * **Anchor (Central Admin Block)**: `SlateGray` (`#708090` $\implies \mathbf{RGB(112, 128, 144)}$)
     * **Pillar 1 (Due North - AB3 / North Square)**: `CadetSlate` (`#768392` $\implies \mathbf{RGB(118, 131, 146)}$)
     * **Pillar 2 (North-East - AB2 & East Wing)**: `HeatherBlue` (`#808892` $\implies \mathbf{RGB(128, 136, 146)}$)
     * **Pillar 3 (South-East - MG Auditorium)**: `SlateTeal` (`#708490` $\implies \mathbf{RGB(112, 132, 144)}$)
     * **Pillar 4 (South-West - Main Gate Plaza)**: `GraphiteSlate` (`#808090` $\implies \mathbf{RGB(128, 128, 144)}$)
     * **Pillar 5 (North-West - AB1 & West Complex)**: `CobaltDusk` (`#708098` $\implies \mathbf{RGB(112, 128, 152)}$)
  2. Compute the 3D Euclidean distance of each building's vector from `SlateGray` $(112, 128, 144)$:
     $$\text{Distance} = \sqrt{(R - 112)^2 + (G - 128)^2 + (B - 144)^2}$$
     * **Pillar 1 (North)**: $\sqrt{6^2 + 3^2 + 2^2} = \sqrt{36 + 9 + 4} = \sqrt{49} = \mathbf{7}$
     * **Pillar 2 (North-East)**: $\sqrt{16^2 + 8^2 + 2^2} = \sqrt{256 + 64 + 4} = \sqrt{324} = \mathbf{18}$
     * **Pillar 3 (South-East)**: $\sqrt{0^2 + 4^2 + 0^2} = \sqrt{16} = \mathbf{4}$
     * **Pillar 4 (South-West)**: $\sqrt{16^2 + 0^2 + 0^2} = \sqrt{256} = \mathbf{16}$
     * **Pillar 5 (North-West)**: $\sqrt{0^2 + 0^2 + 8^2} = \sqrt{64} = \mathbf{8}$
  3. Apply the **Silicon Translation Riddle**:
     * *"The third step belongs to the machine, while the other four speak the language of letters."*
     * Pillar 1 ($7$) $\to \mathbf{G}$
     * Pillar 2 ($18$) $\to \mathbf{R}$
     * Pillar 3 ($4$) $\to \mathbf{4}$ (Silicon machine digit)
     * Pillar 4 ($16$) $\to \mathbf{P}$
     * Pillar 5 ($8$) $\to \mathbf{H}$
  4. Sequence clockwise starting Due North:
     $$\mathbf{G \quad R \quad 4 \quad P \quad H} \implies \mathbf{GR4PH}$$
* **Verification Token:** `GR4PH`

---

### 🛸 Phase IV: The Blackbox Climax
* **Evidence Asset:** `blackbox_drive.png`
* **Reverse Permutation Assembly ($\Pi^{-1} = [12 \to 1]$):**
  $$\text{MASTER KEY} = \mathbf{GR4PH} \cdot \mathbf{PH4Z3} \cdot \mathbf{R30S4} \cdot \mathbf{FIN4L} \cdot \mathbf{EL7P9} \cdot \mathbf{BXZ19} \cdot \mathbf{NT2K5} \cdot \mathbf{P0W3R} \cdot \mathbf{M77RB} \cdot \mathbf{XT4Q1} \cdot \mathbf{K4P82} \cdot \mathbf{A19X7}$$
* **Master String:**
  ```
  GR4PHPH4Z3R30S4FIN4LEL7P9BXZ19NT2K5P0W3RM77RBXT4Q1K4P82A19X7
  ```
* **Outcome:** Unlocks the hardware bootstrap uplink and triggers Dr. Marrow's final beacon transmission!
