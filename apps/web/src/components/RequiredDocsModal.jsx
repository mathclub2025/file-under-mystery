import React, { useState } from "react";
import { BookOpen, X, ChevronDown, ChevronRight, FileText, Binary, Activity, Waves, Hash, Radio, Cpu, Network, Compass, Layers } from "lucide-react";

export const FORENSIC_DOCS = [
  {
    id: "doc-base64",
    title: "Base64 Encoding & Radix-64 Binary-to-Text Translation",
    icon: Binary,
    subtitle: "6-bit Block Chunking, Character Translation & Padding Rules",
    sections: [
      {
        heading: "PRINCIPLE",
        body: "Base64 represents arbitrary binary sequences, byte payloads, or ASCII strings using an invariant character set of 64 printable ASCII characters (A-Z, a-z, 0-9, +, /) with '=' padding."
      },
      {
        heading: "ENCODING SCHEME",
        formula: "3 Bytes (24 bits)  ───>  4 Base64 Characters (6 bits each)",
        notes: [
          "Binary bytes [b₁, b₂, b₃] are concatenated into 24 bits and split into 4 six-bit chunks.",
          "Each 6-bit chunk (integer 0 to 63) maps directly to the standard Base64 index table.",
          "Incomplete trailing 24-bit blocks are padded with '=' or '=='."
        ]
      },
      {
        heading: "WORKED EXAMPLE",
        formula: "Sample ASCII Text: \"KEY\"  ───>  Base64: \"S0VZ\"",
        notes: [
          "1. Convert characters to ASCII values: 'K' = 75, 'E' = 69, 'Y' = 89.",
          "2. Binary representation (24 bits): 01001011 01000101 01011001.",
          "3. Split into four 6-bit groups: [010010] [110100] [010101] [011001].",
          "4. Decimal values: 18, 52, 21, 25.",
          "5. Table lookup: 18 -> 'S', 52 -> '0', 21 -> 'V', 25 -> 'Z'  ───>  \"S0VZ\"."
        ]
      }
    ]
  },
  {
    id: "doc-astrometry",
    title: "Celestial Astrometry & Coordinate Vector Triangulation",
    icon: Compass,
    subtitle: "2D Vector Displacements, Midpoint Intersections & Sector Navigation",
    sections: [
      {
        heading: "PRINCIPLE",
        body: "Astronomical telescope tracking systems locate and track uncatalogued celestial beacons by applying geometric shift vectors and calculating midpoint intersections across known stellar references."
      },
      {
        heading: "MATHEMATICAL FORMULATIONS",
        formula: "Vector Shift: (X, Y) = (X₀ + ΔX, Y₀ + ΔY),     Midpoint: (X_mid, Y_mid) = ((X₁ + X₂)/2, (Y₁ + Y₂)/2)",
        notes: [
          "Vector Displacement: Adding a directional offset (ΔX, ΔY) to a base reference beacon gives the target coordinate.",
          "Midpoint Triangulation: Averaging coordinates of two bounding stars finds the exact center intersect."
        ]
      },
      {
        heading: "WORKED EXAMPLE",
        formula: "Sample Beacon A at (10, 20) with Vector Δ = (+15, +10)",
        notes: [
          "1. Vector Calculation: X = 10 + 15 = 25,  Y = 20 + 10 = 30  ───>  Target Coordinate: (25, 30).",
          "2. Sample Midpoint between (40, 60) and (80, 80): X = (40+80)/2 = 60,  Y = (60+80)/2 = 70  ───>  Midpoint: (60, 70).",
          "3. Aiming telescope crosshairs at the target coordinates resolves the deep space beacon."
        ]
      }
    ]
  },
  {
    id: "doc-morse",
    title: "Acoustic Demodulation, Bandpass Filtering & Morse Code",
    icon: Radio,
    subtitle: "High-Frequency Carrier Isolation & Telegraph Translation",
    sections: [
      {
        heading: "PRINCIPLE",
        body: "Foreground speech noise predominantly occupies lower speech frequencies (100 Hz to 1200 Hz). High-frequency carrier pulses (> 2000 Hz) can be extracted using sharp digital bandpass filtering."
      },
      {
        heading: "DIGITAL BIQUAD BANDPASS FILTER",
        formula: "H(s) = [ (ω₀ / Q) · s ] / [ s² + (ω₀ / Q) · s + ω₀² ],   Q = f₀ / Bandwidth",
        notes: [
          "Tuning center frequency f₀ to the carrier frequency attenuates masking speech and isolates continuous wave tones."
        ]
      },
      {
        heading: "WORKED EXAMPLE",
        formula: "Sample Pulse Sequence: \"- . - .   - - -   - . .\"  ───>  Text: \"COD\"",
        notes: [
          "1. First symbol: '- . - .' (Dash-Dot-Dash-Dot)  ───>  'C'",
          "2. Second symbol: '- - -' (3 Dashes)  ───>  'O'",
          "3. Third symbol: '- . .' (Dash-Dot-Dot)  ───>  'D'",
          "4. Resulting decoded string: \"COD\""
        ]
      }
    ]
  },
  {
    id: "doc-histogram",
    title: "Dynamic Range Expansion & Histogram Exposure Correction",
    icon: FileText,
    subtitle: "Low-Light Digital Imaging & Non-Linear Gamma Transforms",
    sections: [
      {
        heading: "PRINCIPLE",
        body: "When digital camera sensors capture in near pitch-black darkness, raw pixel intensities cluster in the low-luminance range [0, 35]. The human eye perceives black, but spatial luminance data remains encoded in the deep sensor bits."
      },
      {
        heading: "MATHEMATICAL FORMULATION",
        formula: "I_out(x, y) = 255 × [ (I(x, y) - Min) / (Max - Min) ]^(1 / γ)",
        notes: [
          "Min Threshold: Clamps deep shadow black floor to 0.",
          "Max Threshold: Stretches the upper limit of low luminance to 255.",
          "Gamma Curve (γ): Non-linear midtone expansion curve without highlight clipping."
        ]
      },
      {
        heading: "WORKED EXAMPLE",
        formula: "Raw Pixel I = 18,  Min = 10,  Max = 40,  Gamma γ = 1.5",
        notes: [
          "1. Linear Normalization: (18 - 10) / (40 - 10) = 8 / 30 ≈ 0.267.",
          "2. Gamma Transform: (0.267)^(1 / 1.5) = (0.267)^0.667 ≈ 0.414.",
          "3. Scaled Output: 255 × 0.414 ≈ 106 (illuminated visible midtone from near-black)."
        ]
      }
    ]
  },
  {
    id: "doc-automata",
    title: "Wolfram Rule 30 Deterministic Cellular Automata",
    icon: Binary,
    subtitle: "Local Boolean Transition Functions & Ancestral Seed Inversion",
    sections: [
      {
        heading: "PRINCIPLE",
        body: "Rule 30 is an elementary 1D cellular automaton that generates deterministic chaotic evolution from an initial 8-bit binary seed."
      },
      {
        heading: "BOOLEAN STATE TRANSITION",
        formula: "c_i^(t+1) = p ⊕ (q ∨ r) = (p + q + r + q·r) mod 2",
        notes: [
          "[p, q, r] represents the three-cell neighborhood [c_(i-1), c_i, c_(i+1)] at time t.",
          "Ancestral Solving: Reverse constraint validation checks which candidate seed at t=0 produces the observed lattice pattern."
        ]
      },
      {
        heading: "WORKED EXAMPLE",
        formula: "Evaluating 3-Cell Neighborhoods under Rule 30",
        notes: [
          "Example A: Neighborhood [p=1, q=1, r=0]  ───>  1 ⊕ (1 ∨ 0) = 1 ⊕ 1 = 0.",
          "Example B: Neighborhood [p=0, q=1, r=0]  ───>  0 ⊕ (1 ∨ 0) = 0 ⊕ 1 = 1.",
          "Example C: Neighborhood [p=0, q=0, r=1]  ───>  0 ⊕ (0 ∨ 1) = 0 ⊕ 1 = 1.",
          "Example D: Neighborhood [p=0, q=0, r=0]  ───>  0 ⊕ (0 ∨ 0) = 0 ⊕ 0 = 0."
        ]
      }
    ]
  },
  {
    id: "doc-prime-cipher",
    title: "Prime Number Sequences & Modular Polyalphabetic Shifts",
    icon: Hash,
    subtitle: "Running Key Cryptanalysis via Prime Index Modulo Reductions",
    sections: [
      {
        heading: "PRINCIPLE",
        body: "Prime distribution sequences serve as deterministic running keys. Discrete sequence indices are evaluated to their n-th prime values and reduced modulo 26 to calibrate shift dials."
      },
      {
        heading: "MATHEMATICAL FORMULAS",
        formula: "Shift_k = P_(n_k) mod 26,     Decrypted_j = (Cipher_j - Shift_(j mod 4)) mod 26",
        notes: [
          "P_n denotes the n-th prime number (P₁=2, P₂=3, P₃=5, P₄=7, ...)."
        ]
      },
      {
        heading: "WORKED EXAMPLE",
        formula: "Sample Index n = 12,  Cipher Letter 'W' (22)",
        notes: [
          "1. Look up 12th prime number: P₁₂ = 37.",
          "2. Calculate shift modulo 26: 37 mod 26 = 11.",
          "3. Decrypt ciphertext letter 'W' (index 22): (22 - 11) mod 26 = 11.",
          "4. Map index 11 back to alphabet: Index 11 = 'L'."
        ]
      }
    ]
  },
  {
    id: "doc-wave-superposition",
    title: "Sinusoidal Wave Superposition & Harmonic Resonance",
    icon: Waves,
    subtitle: "Multi-Wave Traveling Interference & Standing Wave Glyphs",
    sections: [
      {
        heading: "PRINCIPLE",
        body: "When multiple continuous sinusoidal waveforms with integer frequency ratios and phase shifts interact across a medium, constructive interference creates stable standing wave trajectories."
      },
      {
        heading: "TRAVELING WAVE SUPERPOSITION",
        formula: "y(x, t) = A₁ sin(k₁ x - ω₁ t + ϕ₁) + A₂ sin(k₂ x + ω₂ t + ϕ₂)",
        notes: [
          "Harmonic Ratio (f₂ / f₁): Integer ratios lock waves into stable harmonic modes.",
          "Interference Phase (ϕ): Directs the spatial convergence of wave crests."
        ]
      },
      {
        heading: "WORKED EXAMPLE",
        formula: "Superposition of Mode f₁ = 2 and Harmonic Ratio f₂ = 4 with Phase ϕ = 90°",
        notes: [
          "1. Wave 1: y₁(x, t) = sin(2x - t).",
          "2. Wave 2: y₂(x, t) = sin(4x + t + π/2) = cos(4x + t).",
          "3. Composite Wave: y(x, t) = sin(2x - t) + cos(4x + t).",
          "4. The 2:1 harmonic ratio produces a stationary dual-lobed envelope with nodal intersections."
        ]
      }
    ]
  },
  {
    id: "doc-lsb",
    title: "Spatial Domain Bitplane Steganography (LSB)",
    icon: Cpu,
    subtitle: "Color Channel Slicing & Least Significant Bit Extraction",
    sections: [
      {
        heading: "PRINCIPLE",
        body: "In 8-bit RGB color channels, Bits 6 & 7 dictate overall luminance, while Bits 0 & 1 carry minimal visual weight. Watermarks submerged in lower bitplanes remain completely invisible to the eye."
      },
      {
        heading: "BITPLANE EXTRACTION FORMULA",
        formula: "Bit_k(x, y) = floor( Color(x, y) / 2^k ) mod 2",
        notes: [
          "Bit 0 (LSB): High-entropy noise layer where steganographic fragments are embedded.",
          "Spatial Phase Offset: Adjusting X/Y phase alignment reveals multi-channel stego patterns."
        ]
      },
      {
        heading: "WORKED EXAMPLE",
        formula: "Extracting Bits from Sample Color Byte: 179 (Decimal)",
        notes: [
          "1. Convert 179 to 8-bit binary: 179 = 10110011₂.",
          "2. Bit 0 (LSB): 1011001[1] -> Value = 1 (Active Stego Bit).",
          "3. Bit 1: 101100[1]1 -> Value = 1.",
          "4. Bit 2: 10110[0]11 -> Value = 0.",
          "5. Bit 7 (MSB): [1]0110011 -> Value = 1 (Visual Luminance Bit)."
        ]
      }
    ]
  },
  {
    id: "doc-fourier",
    title: "2D Discrete Fourier Transforms & K-Space Harmonics",
    icon: Activity,
    subtitle: "K-Space Magnitude Spectrum & Spatial Inverse Fourier Synthesis",
    sections: [
      {
        heading: "PRINCIPLE",
        body: "The 2D Fast Fourier Transform (FFT) decomposes spatial signals into discrete 2D frequency components characterized by radial magnitude and angular phase."
      },
      {
        heading: "TRANSFORM EQUATIONS",
        formula: "r = sqrt(u² + v²),     θ = arctan(v / u)",
        notes: [
          "Radial Distance (r): Frequency magnitude (center = low DC, outer = high detail).",
          "Angular Phase (θ): Directional orientation of the harmonic wavefront."
        ]
      },
      {
        heading: "WORKED EXAMPLE",
        formula: "Harmonic Peak at Frequency Coordinates (u = 30 px, v = 40 px)",
        notes: [
          "1. Compute Radial Distance: r = sqrt(30² + 40²) = sqrt(900 + 1600) = sqrt(2500) = 50 px.",
          "2. Compute Wavefront Orientation: θ = arctan(40 / 30) = arctan(1.333) ≈ 53.1°.",
          "3. Setting Radial Bandpass filter to r ∈ [48, 52] and Phase to 53° isolates this harmonic peak."
        ]
      }
    ]
  },
  {
    id: "doc-pcap",
    title: "Network Protocol Capture & Exfiltration Payloads",
    icon: Network,
    subtitle: "HTTP Authorization Headers & Data Volume Outliers",
    sections: [
      {
        heading: "PRINCIPLE",
        body: "Routine network traffic produces consistent small payloads (1 KB to 18 KB). Exfiltration events and unauthorized data transfers manifest as statistical payload anomalies."
      },
      {
        heading: "HEADER INSPECTION",
        formula: "Authorization: Bearer <Base64_Payload_Token>",
        notes: [
          "Bearer and Basic authentication headers encode credentials using Base64.",
          "Inspect Authorization headers on outlier packets to extract raw encoded credentials."
        ]
      },
      {
        heading: "WORKED EXAMPLE",
        formula: "Sample Header: \"Authorization: Basic dXNlcjpwYXNz\"",
        notes: [
          "1. Strip prefix \"Basic \"  ───>  Payload string: \"dXNlcjpwYXNz\".",
          "2. Decode Base64 string \"dXNlcjpwYXNz\"  ───>  \"user:pass\".",
          "3. Credentials extracted: Username = \"user\", Password = \"pass\"."
        ]
      }
    ]
  },
  {
    id: "doc-phase-stereo",
    title: "Differential Audio Cancellation & 180° Phase Inversion",
    icon: Waves,
    subtitle: "Common-Mode Rejection & Submerged Voice Recovery",
    sections: [
      {
        heading: "PRINCIPLE",
        body: "When two coherent channels contain identical correlated masking noise N(t) but the concealed transmission S(t) is inverted on one channel:"
      },
      {
        heading: "SUBTRACTIVE DEMODULATION",
        formula: "L(t) = N(t) + S(t),   R(t) = N(t) - S(t)   ───>   L(t) - R(t) = 2 · S(t)",
        notes: [
          "Inverting the right channel by 180° cancels the masking static and amplifies the hidden whisper."
        ]
      },
      {
        heading: "WORKED EXAMPLE",
        formula: "Left Channel: L = [Noise + Voice],  Right Channel: R = [Noise - Voice]",
        notes: [
          "1. Invert Right Channel: -R = -[Noise - Voice] = -Noise + Voice.",
          "2. Sum Left and Inverted Right: L + (-R) = (Noise + Voice) + (-Noise + Voice).",
          "3. Common Noise cancels: Noise - Noise = 0.",
          "4. Voice doubles: Voice + Voice = 2 × Voice (Pure isolated voice recovered)."
        ]
      }
    ]
  },
  {
    id: "doc-euclidean-distance",
    title: "3D Euclidean Vector Norms & Chromatic Distance",
    icon: Compass,
    subtitle: "3D Coordinate Space, Euclidean Metric & Color Vector Magnitudes",
    sections: [
      {
        heading: "PRINCIPLE",
        body: "In digital spatial forensics and 3D color vector spaces, the straight-line geometric distance between a reference anchor (x₀, y₀, z₀) and a target coordinate vector (x₁, y₁, z₁) is evaluated using the 3D Euclidean metric."
      },
      {
        heading: "EUCLIDEAN DISTANCE FORMULATION",
        formula: "Distance D = √[ (x₁ - x₀)² + (y₁ - y₀)² + (z₁ - z₀)² ]",
        notes: [
          "Calculates the straight-line Euclidean norm (spatial distance) between two 3D vector points.",
          "Applicable across spatial Cartesian grids and 3-channel RGB digital color spaces (Red, Green, Blue)."
        ]
      },
      {
        heading: "WORKED EXAMPLE",
        formula: "Sample Anchor P₀ = (50, 50, 50) and Target Point P₁ = (53, 54, 50)",
        notes: [
          "1. Evaluate coordinate differences: Δx = 53 - 50 = 3,  Δy = 54 - 50 = 4,  Δz = 50 - 50 = 0.",
          "2. Sum squares of differences: 3² + 4² + 0² = 9 + 16 + 0 = 25.",
          "3. Take square root: D = √25 = 5  ───>  Straight-line magnitude is 5."
        ]
      }
    ]
  },
  {
    id: "doc-tensor-bootstrap",
    title: "Cryptographic Permutations & Reverse Assembly Bootstrap",
    icon: Layers,
    subtitle: "Multi-Token Reverse Permutations & Hardware Master Uplink",
    sections: [
      {
        heading: "PRINCIPLE",
        body: "Air-gapped solid-state security modules require a composite cryptographic tensor key assembled by reverse concatenation of all recovered forensic tokens."
      },
      {
        heading: "REVERSE PERMUTATION FORMULA",
        formula: "K_master = Token₁₂ || Token₁₁ || Token₁₀ || ... || Token₀₂ || Token₀₁",
        notes: [
          "Concatenate all 12 forensic tokens in exact reverse order (Level 12 down to Level 01) to unlock hardware firmware."
        ]
      },
      {
        heading: "WORKED EXAMPLE",
        formula: "Sample 3-Token Key Array: [\"ALPHA\", \"BETA7\", \"GAMMA\"]",
        notes: [
          "1. Reverse the order of recovered tokens: [\"GAMMA\", \"BETA7\", \"ALPHA\"].",
          "2. Concatenate into continuous master string: \"GAMMABETA7ALPHA\".",
          "3. Submit master payload to hardware uplink terminal."
        ]
      }
    ]
  }
];

export default function RequiredDocsModal({ onClose }) {
  const [expandedDocId, setExpandedDocId] = useState("doc-base64");

  const toggleDoc = (id) => {
    setExpandedDocId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 select-none font-mono">
      <div className="bg-black border border-white/20 rounded-2xl max-w-4xl w-full h-[88vh] p-5 sm:p-6 text-xs shadow-2xl flex flex-col gap-4 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
          <div className="flex items-center gap-2.5 text-white font-bold text-sm">
            <BookOpen size={18} className="text-white shrink-0" />
            <span>REQUIRED FORENSIC DOCUMENTATION & TECHNICAL REFERENCE</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-slate-400 text-[11px] leading-relaxed shrink-0">
          Departmental technical reference manual. Consult these documentation modules to understand the underlying mathematics, signal equations, and cryptographic theories required across the investigation.
        </p>

        {/* Accordion Documentation Scrollable List */}
        <div className="overflow-y-auto flex-1 pr-2 flex flex-col gap-2.5">
          {FORENSIC_DOCS.map((doc) => {
            const isExpanded = expandedDocId === doc.id;
            const Icon = doc.icon;

            return (
              <div
                key={doc.id}
                className={`rounded-xl border transition-all overflow-hidden shrink-0 ${
                  isExpanded
                    ? "bg-white/10 border-white/35 shadow-lg"
                    : "bg-white/5 border-white/10 hover:border-white/25"
                }`}
              >
                {/* Accordion Header Button - Perfectly Vertically Centered */}
                <button
                  onClick={() => toggleDoc(doc.id)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0 pr-2">
                    <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <Icon size={16} className={isExpanded ? "text-white" : "text-slate-400"} />
                    </div>

                    <div className="flex flex-col justify-center min-w-0">
                      <span className={`font-bold text-xs tracking-wide leading-snug truncate ${isExpanded ? "text-white" : "text-slate-200"}`}>
                        {doc.title}
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal leading-tight truncate mt-0.5">
                        {doc.subtitle}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 pl-2">
                    {isExpanded ? (
                      <ChevronDown size={18} className="text-white" />
                    ) : (
                      <ChevronRight size={18} className="text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Clean Formatted Content */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 border-t border-white/10 bg-black/80 text-slate-300 leading-relaxed text-xs space-y-4 animate-fade-in select-text">
                    {doc.sections.map((sec, sIdx) => (
                      <div key={sIdx} className="flex flex-col gap-1.5">
                        <span className="text-white font-bold text-[11px] uppercase tracking-wider">
                          {sec.heading}
                        </span>

                        {sec.body && (
                          <p className="text-slate-300 text-xs leading-relaxed font-sans">
                            {sec.body}
                          </p>
                        )}

                        {sec.formula && (
                          <div className="p-3 my-1 bg-white/5 rounded-xl border border-white/15 text-white font-mono text-center font-bold text-xs tracking-wide overflow-x-auto">
                            {sec.formula}
                          </div>
                        )}

                        {sec.notes && (
                          <div className="flex flex-col gap-1.5 pl-1 pt-1 font-mono text-[11px] text-slate-300">
                            {sec.notes.map((note, nIdx) => (
                              <div key={nIdx} className="flex items-start gap-2">
                                <span className="text-slate-500 font-bold">•</span>
                                <span>{note}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
