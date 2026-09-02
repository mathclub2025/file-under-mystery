// Secure Server-Side Level Secrets, Hints, and Solutions
// NEVER IMPORT THIS FILE ON THE CLIENT SIDE

export const SERVER_LEVEL_DATA = {
  level1: {
    validTokens: ["A19X7"],
    honeypots: ["FOREST", "CANOPY", "SURVEY5", "MARROW1", "DARKNESS"],
    hints: [
      {
        cost: 2,
        text: "The camera sensor recorded low non-zero pixel intensities clustered in the dark shadows. Keep Min at 0 and lower the Max slider to ~80-120, then boost Gamma and Contrast to stretch the shadow spectrum."
      },
      {
        cost: 3,
        text: "Set Histogram Min: 0, Max: ~90-120, Contrast: +30 to +50, and Gamma: ~1.80 to 2.20. (For brighter canopy regions, keep Max higher around ~180-220 or use Channel Solo to prevent clipping)."
      },
      {
        cost: 3,
        text: "Zoom in and inspect these 5 visible landmarks in the photograph: (1) Upper-left tree trunk, (2) Mid-left lower foliage near the second trunk, (3) Central tree trunk directly left of the building, (4) Upper-right canopy pine branches, and (5) Lower-right root hollow on the ground."
      }
    ],
    solutionExplanation: "By keeping Min at 0, lowering Max to ~90-120, and boosting Gamma (1.8-2.2) with Contrast (+40), five hidden survey markers emerge: 1:A, 2:1, 3:9, 4:X, 5:7. Assembling them in numerical order yields the token A19X7.",
    notebookFragment: "Mirrors in the dark hold what the eye misses. Pull the exposure out of the shadows."
  },

  level2: {
    validTokens: ["K4P82"],
    honeypots: ["VOICEMAIL", "MORSE2400", "TELEGRAPH", "CARRIER", "MARROWVOICE"],
    hints: [
      {
        cost: 2,
        text: "Foreground speech masks multiple acoustic carrier pulses. Switch to the Bandpass Isolator filter to cut out the human vocal range."
      },
      {
        cost: 3,
        text: "The hidden Morse signals are distributed across 5 discrete carrier frequency bands centered around multiples of ~800 Hz (~800 Hz, ~1500 Hz, ~2400 Hz, ~3200 Hz, and ~3800 Hz). Sweep the frequency slider to isolate each band."
      },
      {
        cost: 3,
        text: "Each frequency band becomes active at a distinct timestamp along the 20-second timeline (from 2s up to 17s). Listen to the isolated dots and dashes across each band in chronological sequence to decode the message."
      }
    ],
    solutionExplanation: "Applying the Bandpass Isolator across the 5 discrete harmonic bands (800 Hz -> K, 1500 Hz -> 4, 2400 Hz -> P, 3200 Hz -> 8, 3800 Hz -> 2) isolates the Morse pulses along the timeline, assembling token K4P82.",
    notebookFragment: "The acoustic carrier tone was hidden underneath the human voice all along."
  },

  level3: {
    validTokens: ["XT4Q1"],
    honeypots: ["HALLWAY", "CCTV14", "FAKE_CCTV_99", "BLACKBOARD", "CORRIDOR"],
    hints: [
      {
        cost: 2,
        text: "The surveillance feed contains a single anomalous outlier glitch frame hidden among the static footage. Pause playback and use single-frame stepping controls to scrub through the video."
      },
      {
        cost: 3,
        text: "Step through the frames between Frame 130 and 160. Look closely at the bulletin board on the left wall to catch the flash frame anomaly."
      },
      {
        cost: 3,
        text: "The text string flashed on the bulletin board is encoded in standard Base64. Decode the Base64 ciphertext into plaintext to obtain the forensic clearance token."
      }
    ],
    solutionExplanation: "Scrubbing to the outlier glitch frame at Frame 142 reveals a high-contrast flash on the left bulletin board with the Base64 payload 'VG9rZW46IFhUNFEx'. Decoding from Base64 yields 'Token: XT4Q1'.",
    notebookFragment: "A sudden rhythm in the surveillance frames kept time when the lens glitched."
  },

  level4: {
    validTokens: ["M77RB"],
    honeypots: ["HOLIDAY", "BITPLANE0", "LSB_GREEN", "COLORHID", "BEACHPHOTO"],
    hints: [
      {
        cost: 2,
        text: "Select an individual Color Channel (Red, Green, or Blue) and increase the Noise Clarification slider above 80% to filter out ambient grain and sharpen submerged forensic bits."
      },
      {
        cost: 3,
        text: "The 5 hidden coordinate markers are embedded across specific RGB bitplanes in sequence: #1 on Red (Bit 0), #2 on Green (Bit 1), and #3, #4, #5 on Blue (Bits 0, 2, and 3 respectively). Adjust the Channel and Bitplane Depth accordingly."
      },
      {
        cost: 3,
        text: "Gently drift the X and Y Phase Alignment sliders toward center (around 0 px) to lock phase resonance. Once aligned, the noise grid will stabilize and reveal the numbered coordinate marker for that channel."
      }
    ],
    solutionExplanation: "Slicing through the target bitplanes (Red Bit 0 -> 1:M, Green Bit 1 -> 2:7, Blue Bit 0 -> 3:7, Blue Bit 2 -> 4:R, Blue Bit 3 -> 5:B) with >80% clarity and centered phase alignment reveals all five markers, assembling token M77RB.",
    notebookFragment: "In the quiet records, the lowest bitplane remembers what color hid."
  },

  level5: {
    validTokens: ["P0W3R", "POWER", "P0WER", "POW3R"],
    honeypots: ["POWEROFSEVEN", "POWER_OF_SEVEN", "PRIME219", "SEVEN", "PFPJ"],
    hints: [
      {
        cost: 2,
        text: "The shredded document contains a polyalphabetic substitution cipher with a 4-position repeating periodic key. Adjust the 4 shift dials in the console to decrypt the 25-character cipher stream."
      },
      {
        cost: 3,
        text: "The shift values for each dial correspond to modular reductions (mod 26) of the prime numbers noted in the manuscript fragments. Calculate the prime shifts to calibrate the 4 dial positions."
      },
      {
        cost: 3,
        text: "When the correct 4-dial key is applied, the cipher stream decrypts into a continuous English phrase with embedded numerical instructions. Read the phrase carefully to extract the 5 alphanumeric characters for the clearance token."
      }
    ],
    solutionExplanation: "Calculating the four prime indices modulo 26 yields key letters {F, P, J, P} (shifts 5, 15, 9, 15), engaging the emerald lock to decode the stream into 'POWER ZERO AT TWO THREE AT FOUR'. Applying the indicated character positions yields the token P0W3R.",
    notebookFragment: "When numbers fold into one another, prime moduli never lose their origin."
  },

  level6: {
    validTokens: ["NT2K5"],
    honeypots: ["EXFILTRATION", "ROUTING", "BEARER_AUTH", "GATEWAY", "TLQYSZU="],
    hints: [
      {
        cost: 2,
        text: "Search through the packet capture log for the anomalous outlier request. Look for a POST transaction with an unusually large payload size and a distinct Authorization Bearer header."
      },
      {
        cost: 3,
        text: "Inspect the Authorization Bearer header string on the outlier packet. The payload uses nested multi-layer encoding rather than single-stage plaintext."
      },
      {
        cost: 3,
        text: "Decode the outer layer using Base64, then decode the resulting string using Base32 to reveal the final 5-character clearance token."
      }
    ],
    solutionExplanation: "Locating the anomalous outlier packet (#47) reveals the nested Authorization Bearer token 'TlQySzU9PT0='. Decoding from Base64 yields 'NT2K5===', and subsequent Base32 decoding reveals the clearance token NT2K5.",
    notebookFragment: "Two envelopes folded around the wayfarer could not conceal the road's tail."
  },

  level7: {
    validTokens: ["BXZ19"],
    honeypots: ["SONIFICATION", "CHORD_CBC", "ACOUSTIC_VAULT", "FREQUENCY_CHAIN", "720HZ"],
    hints: [
      {
        cost: 2,
        text: "Listen to the reference broadcast (Button 1) and compare it with the tunable receiver (Button 2). Adjust the X-axis spectrum translation slider until clicking 'CHECK HARMONIC ALIGNMENT' confirms that harmonic resonance is locked."
      },
      {
        cost: 3,
        text: "Once resonance is locked, play the tuner receiver (Button 2). As the 5 tones stream in sequence, click 'HALT AUDIO' during each step to pause that step's peak on the spectrum canvas. Hover the cursor probe over each frozen peak to record its rounded carrier frequency across all 5 steps (n = 1 to 5)."
      },
      {
        cost: 3,
        text: "Open the DOCS modal under 'Acoustic Data Sonification & Cipher Block Chaining (CBC)'. Use formulas V_n = (Freq_n - 300)/15 and C_n = (V_n - V_{n-1}) mod 36 with initial seed V_0 = 17:\n• Tone 1 (720Hz): V_1 = (720 - 300)/15 = 28 ➔ C_1 = (28 - 17) mod 36 = 11 ➔ 'B'\n• Tone 2 (675Hz): V_2 = (675 - 300)/15 = 25 ➔ C_2 = (25 - 28) mod 36 = -3 ≡ 33 ➔ 'X'\nNow measure Tone 3, Tone 4, and Tone 5 to compute the remaining 3 characters and complete the 5-letter clearance token."
      }
    ],
    solutionExplanation: "Extracting the five sequential peak frequencies (720Hz, 675Hz, 660Hz, 675Hz, 810Hz) yields base values [28, 25, 24, 25, 34]. Reversing the cryptographic chain with initial seed 17 via (V_n - V_{n-1}) mod 36 recovers indices [11, 33, 35, 1, 9], corresponding to clearance token BXZ19.",
    notebookFragment: "The five tones whispered in unison, but the chain unlocked only from left to right."
  },

  level8: {
    validTokens: ["FIN4L"],
    honeypots: ["FOURIER", "KSPACE", "DISPERSION", "RADIAL", "IFFTSIGNAL"],
    hints: [
      {
        cost: 2,
        text: "The k-space frequency plane conceals five harmonic specks at distinct radial distances from the DC center. Adjust the inner and outer radial sliders to isolate each bandpass ring."
      },
      {
        cost: 3,
        text: "Each frequency speck resonates only along its own directional axis. Rotate the angular phase slider to align with the speck's orientation, and elevate the harmonic contrast gain past 70% to pierce the interference fog."
      },
      {
        cost: 3,
        text: "Isolate all five harmonic targets from lowest radius to highest (R=26 at 30°, R=48 at 75°, R=70 at 120°, R=92 at 45°, R=110 at 150°). Read the numbered character tags in ascending sequence (1 through 5) to reconstruct the clearance token."
      }
    ],
    solutionExplanation: "Synthesizing the 2D Inverse FFT spatial spectrum across all five radial/phase harmonic targets with >70% gain isolates the tags 1:F, 2:I, 3:N, 4:4, 5:L, forming the token FIN4L.",
    notebookFragment: "In the frequency domain every speck finds equilibrium along its own radial orbit."
  },

  level9: {
    validTokens: ["9SDFE"],
    honeypots: ["EL7P9", "ORBITAL", "TELESCOPE", "ASTROMETRY", "BEACON5", "25353540"],
    hints: [
      {
        cost: 2,
        text: "Examine the 5 sector logs in the rooftop observatory notebook. Solve the geometric vector and Cartesian grid clues to identify the (X, Y) coordinates of each celestial beacon (0 ≤ X, Y ≤ 100)."
      },
      {
        cost: 3,
        text: "Enter the deduced coordinates into the telescope reticle finder and lock crosshairs to capture each sector beacon telemetry node on the radar scope across all 5 sectors."
      },
      {
        cost: 3,
        text: "Open the DOCS modal under 'Celestial Astrometry & Parallax Modular Transformation'. Apply the formula C_n = (3·X_n + 5·Y_n + 11) mod 36 (Note: if value < 10, use the number directly; if ≥ 10, map 10=A, 11=B, ..., 35=Z):\n• Sector 1 (25, 35): C_1 = (3·25 + 5·35 + 11) mod 36 = 261 mod 36 = 9 (< 10) ➔ '9'\n• Sector 2 (35, 40): C_2 = (3·35 + 5·40 + 11) mod 36 = 316 mod 36 = 28 (≥ 10) ➔ 'S'\nNow calculate Sectors 3, 4, and 5 to determine the remaining 3 characters and complete the 5-letter clearance token."
      }
    ],
    solutionExplanation: "Deducing coordinates (25, 35), (35, 40), (37, 79), (82, 38), (80, 75) and applying the astrometric modular refinement formula C_n = (3·X_n + 5·Y_n + 11) mod 36 recovers characters [9, S, D, F, E], unlocking clearance token 9SDFE.",
    notebookFragment: "The constellations never shift but five coordinates reveal astronomical beacons in the deep sky."
  },

  level10: {
    validTokens: ["R30S4"],
    honeypots: ["RULE30", "AUTOMATA", "CELLULAR", "WOLFRAM", "SEED1010"],
    hints: [
      {
        cost: 2,
        text: "The cellular lattice follows Wolfram Rule 30 deterministic state evolution across descending time steps."
      },
      {
        cost: 3,
        text: "Trace the active pyramid triangles upward using the reverse Boolean constraint: c_i^(t+1) = p XOR (q OR r) to determine the ancestral seed row at t=0."
      },
      {
        cost: 3,
        text: "Convert the resolved ancestral initial seed state and rule designation into standard alphanumeric notation to authenticate the system state."
      }
    ],
    solutionExplanation: "Evaluating the reverse constraint lattice under Rule 30 identifies the ancestral initial state seed at t=0, producing token R30S4.",
    notebookFragment: "Beneath the tapestry of chaos every cellular row must conform to its ancestral seed."
  },

  level11: {
    validTokens: ["PH4Z3"],
    honeypots: ["BINAURAL", "PHASE180", "WHISPER", "POLYBIUS", "DUALAUDIO"],
    hints: [
      {
        cost: 2,
        text: "Marrow broadcast a decoy monologue across the stereo wire. Turn on 180° Right Channel Phase Inversion (L - R subtractive cancellation) to nullify the masking speech."
      },
      {
        cost: 3,
        text: "The true transmission was recorded in reverse time. Pause the stream and switch playback to REVERSED to hear the spoken coordinates clearly."
      },
      {
        cost: 3,
        text: "Deduce the base frequency from Marrow's campus landmarks: Cardinal Watchtowers, Trinity Courtyard, and Twin Spires (four-three-two). Tune the resonator across its five ascending harmonic integer echoes to transcribe all five Polybius grid coordinates."
      }
    ],
    solutionExplanation: "180-degree phase inversion and reverse playback across the five descending landmark overtones (432 Hz -> (3,4): P, 864 Hz -> (2,2): H, 1296 Hz -> (5,6): 4, 1728 Hz -> (5,2): Z, 2160 Hz -> (5,5): 3) decodes the 6x6 Polybius coordinates to reveal token PH4Z3.",
    notebookFragment: "Inverting the stereo channel nullifies masking noise when added in opposite phase to expose the voice."
  },

  level12: {
    validTokens: ["GR4PH"],
    honeypots: ["VITCHENNAI", "CAMPUSMAP", "EUCLIDEAN", "COLORVECTOR", "SLATEGRAY"],
    hints: [
      {
        cost: 2,
        text: "The campus security grid is modeled as an Eulerian graph topology of connected checkpoints and transit corridors."
      },
      {
        cost: 3,
        text: "Every corridor was traversed exactly once during Marrow's escape without retracing steps, forming an unbroken Eulerian path across the node network."
      },
      {
        cost: 3,
        text: "Trace the node-to-node route from the origin checkpoint to the perimeter exit. Map the vertex sequence traversal into the final forensic clearance key."
      }
    ],
    solutionExplanation: "Following the Eulerian circuit through the building topology vertices resolves the final graph traversal path GR4PH.",
    notebookFragment: "Traversing every corridor once without retracing steps connects each checkpoint to next perimeter gate."
  },

  final: {
    validTokens: [
      "A19X7XT4Q1P0W3RBXZ19EL7P9PH4Z3K4P82M77RBNT2K5FIN4LR30S4GR4PH",
      "MARROWBEACON",
      "THE_BEACON_IS_AWAKE"
    ],
    honeypots: ["BLACKBOX", "BOOTSTRAP", "THEPROOF", "FILEUNDERMYSTERY", "PROOFOFMARROW"],
    hints: [
      {
        cost: 3,
        text: "The firmware requires dual-stream frequency interleaving: concatenate all Odd Channel tokens in ascending order (L01 -> L11), followed immediately by all Even Channel tokens in ascending order (L02 -> L12)."
      },
      {
        cost: 5,
        text: "Alternatively, inspect the 12 Field Ledger notes in order (Case 1 to 12). Apply a diagonal stair index: extract the 1st word of note 1, 2nd word of note 2, 3rd word of note 3... down to the 12th word of note 12."
      },
      {
        cost: 5,
        text: "Take the initial letter of each diagonally indexed word to assemble the 12-letter master passphrase (MARROWBEACON)."
      }
    ],
    solutionExplanation: "Interleaving Odd Channels (L01, L03, L05, L07, L09, L11) and Even Channels (L02, L04, L06, L08, L10, L12) forms the tensor key A19X7XT4Q1P0W3RBXZ19EL7P9PH4Z3K4P82M77RBNT2K5FIN4LR30S4GR4PH. Alternatively, extracting the diagonal word progression from Marrow's 12 field notes forms the master passphrase MARROWBEACON.",
    notebookFragment: "The beacon is awake. The proof was hidden in plain sight across every note I left."
  }
};

export function verifyServerToken(levelId, guess) {
  const levelData = SERVER_LEVEL_DATA[levelId];
  if (!levelData || !guess) return { success: false };

  const cleanGuess = String(guess).trim().toUpperCase().replace(/[\s_-]/g, "");

  // 1. Check for AI Honeypot Bait
  if (levelData.honeypots && levelData.honeypots.length > 0) {
    const isHoneypot = levelData.honeypots.some(
      (hp) => hp.replace(/[\s_-]/g, "").toUpperCase() === cleanGuess
    );
    if (isHoneypot) {
      return {
        success: false,
        honeypot: true,
        message: "⚠️ AI DETECTED // Nice try with ChatGPT/Gemini, but this is a tracked decoy code! We see you — solve the forensics yourself on the workbench."
      };
    }
  }

  // 2. Check for Valid Master Tokens
  const isMatch = levelData.validTokens.some(
    (tok) => tok.replace(/[\s_-]/g, "").toUpperCase() === cleanGuess
  );

  if (isMatch) {
    return {
      success: true,
      verifiedToken: cleanGuess,
      solutionExplanation: levelData.solutionExplanation,
      notebookFragment: levelData.notebookFragment
    };
  }

  return { success: false };
}

export function getServerHint(levelId, hintIndex) {
  const levelData = SERVER_LEVEL_DATA[levelId];
  if (!levelData || !levelData.hints || !levelData.hints[hintIndex]) {
    return null;
  }
  return {
    index: hintIndex,
    cost: levelData.hints[hintIndex].cost,
    text: levelData.hints[hintIndex].text
  };
}

export function getServerSolutionMemo(levelId) {
  const levelData = SERVER_LEVEL_DATA[levelId];
  if (!levelData) return null;
  return {
    solutionExplanation: levelData.solutionExplanation,
    notebookFragment: levelData.notebookFragment
  };
}
