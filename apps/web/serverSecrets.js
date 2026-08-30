// Secure Server-Side Level Secrets, Hints, and Solutions
// NEVER IMPORT THIS FILE ON THE CLIENT SIDE

export const SERVER_LEVEL_DATA = {
  level1: {
    validTokens: ["A19X7"],
    honeypots: ["FOREST", "CANOPY", "SURVEY5", "MARROW1", "DARKNESS"],
    hints: [
      {
        cost: 2,
        text: "The camera sensor recorded low non-zero pixel intensities clustered in the dark shadows. Adjust the Histogram Min and Max sliders to stretch this narrow dynamic range across the full scale."
      },
      {
        cost: 3,
        text: "Narrow the Min slider to ~8-16 and Max slider to ~30-50, then elevate the Gamma curve towards ~1.60 to brighten midtone shadows without blowing out highlights."
      },
      {
        cost: 3,
        text: "Zoom in and carefully inspect the illuminated quadrant regions (the upper canopy, dense foliage, tree trunk, and root shadows) to locate all five numbered coordinate markers in sequence (1 through 5)."
      }
    ],
    solutionExplanation: "By stretching the histogram min/max to the non-zero shadow region (10-45) and boosting gamma to 1.60, five hidden numbered survey markers emerge from the darkness: 1:A, 2:1, 3:9, 4:X, 5:7. Assembling them in numerical sequence yields the token A19X7.",
    notebookFragment: "Mirrors in the dark hold what the eye misses. Pull the exposure out of the shadows."
  },

  level2: {
    validTokens: ["K4P82"],
    honeypots: ["VOICEMAIL", "MORSE2400", "TELEGRAPH", "CARRIER", "MARROWVOICE"],
    hints: [
      {
        cost: 2,
        text: "The tape contains foreground speech masking a high-frequency carrier tone pulse. Switch to the Bandpass Isolator filter."
      },
      {
        cost: 3,
        text: "Tune the bandpass frequency to ~2400 Hz (between 2200 Hz and 2600 Hz) to eliminate the low human vocal range and isolate the continuous wave Morse carrier."
      },
      {
        cost: 3,
        text: "Translate the continuous CW Morse pulses into alphanumeric characters: Dash-Dot-Dash (-.-) for K, Dot-Dot-Dot-Dot-Dash (....-) for 4, etc."
      }
    ],
    solutionExplanation: "Applying a sharp 2400 Hz bandpass filter rejects the speaker's vocal frequencies and exposes an underlying telegraph tone. The sequence spells out K-4-P-8-2 in Morse code.",
    notebookFragment: "The acoustic carrier tone was hidden underneath the human voice all along."
  },

  level3: {
    validTokens: ["XT4Q1"],
    honeypots: ["HALLWAY", "CCTV14", "FAKE_CCTV_99", "BLACKBOARD", "CORRIDOR"],
    hints: [
      {
        cost: 2,
        text: "Static CCTV footage contains high ambient temporal noise. Use the Frame Differencing tool between adjacent frames."
      },
      {
        cost: 3,
        text: "Set Frame A to Frame 14 and Frame B to Frame 15, then invert the difference luminance to expose the micro-displacement."
      },
      {
        cost: 3,
        text: "The delta map reveals chalk strokes forming the coordinates XT4Q1."
      }
    ],
    solutionExplanation: "Computing temporal frame subtraction between Frame 14 and Frame 15 removes static background clutter and isolates micro-motions, revealing the chalk token XT4Q1 on the blackboard.",
    notebookFragment: "A sudden rhythm in the surveillance frames kept time when the lens glitched."
  },

  level4: {
    validTokens: ["M77RB"],
    honeypots: ["HOLIDAY", "BITPLANE0", "LSB_GREEN", "COLORHID", "BEACHPHOTO"],
    hints: [
      {
        cost: 2,
        text: "The holiday photograph has an auxiliary payload embedded in the Least Significant Bits (Bit 0) of the RGB color channels."
      },
      {
        cost: 3,
        text: "Switch to Bitplane 0 (LSB) and solo the Green channel to filter out visual luminance noise."
      },
      {
        cost: 3,
        text: "Adjust the spatial phase alignment slider until the pixel steganography grid snaps into the 5-character token M77RB."
      }
    ],
    solutionExplanation: "Isolating the least significant bit (Bit 0) in the green color plane eliminates the high-order luminance scene and renders the raw embedded bitmap string M77RB.",
    notebookFragment: "In the quiet records, the lowest bitplane remembers what color hid."
  },

  level5: {
    validTokens: ["P0W3R"],
    honeypots: ["POWEROFSEVEN", "POWER_OF_SEVEN", "PRIME219", "SEVEN", "POWER"],
    hints: [
      {
        cost: 2,
        text: "The cipher machine applies running key modular shifts derived from prime number sequences."
      },
      {
        cost: 3,
        text: "Compute the n-th prime number for each sequence index (n = 12, 18, 24...) and calculate its shift modulo 26."
      },
      {
        cost: 3,
        text: "Apply the inverse polyalphabetic shift to decode the ciphertext into the plaintext token P0W3R."
      }
    ],
    solutionExplanation: "Calculating prime values for each ciphertext position modulo 26 determines the polyalphabetic key, decoding the sequence to reveal the keyword P0W3R.",
    notebookFragment: "When numbers fold into one another, prime moduli never lose their origin."
  },

  level6: {
    validTokens: ["NT2K5"],
    honeypots: ["EXFILTRATION", "ROUTING", "BEARER_AUTH", "GATEWAY", "TLQYSZU="],
    hints: [
      {
        cost: 2,
        text: "The courier was careless with his luggage. Look through the gateway log for the lone traveler hauling over sixty thousand heavy bytes while everyone else slipped past with light pockets."
      },
      {
        cost: 3,
        text: "His pass was wrapped inside a nested envelope. Strip the outer wax seal, but don't stop at the first fold—unveil it a second time to catch the courier's true three-letter initials."
      },
      {
        cost: 3,
        text: "Examine the four mile markers of the road he came down. The penultimate marker counts its step through the alphabet from A, while the final marker stands as itself. Fuse the courier's initials to the road's tail."
      }
    ],
    solutionExplanation: "The rogue 64.8 KB packet (#47) carried a doubly-wrapped authorization token (VGxReQ== -> TlQy -> NT2). Combining this prefix with the origin IP 172.16.11.5 (11th letter 'K' + final digit '5') unlocks token NT2K5.",
    notebookFragment: "Two envelopes folded around the wayfarer could not conceal the road's tail."
  },

  level7: {
    validTokens: ["BXZ19"],
    honeypots: ["OSCILLOSCOPE", "HARMONIC", "LISSAJOUS", "WAVE5", "PHOSPHOR"],
    hints: [
      {
        cost: 2,
        text: "The five sleeping voices are faint beneath the noise floor—elevate the Resonance Q gain toward its ceiling so the electric phosphor catches their pull. Then awaken each carrier channel from one to five in turn, for each rules its own sector across the glass."
      },
      {
        cost: 3,
        text: "Waves will not bend to human eyes while their rhythm is mismatched. When a channel is engaged, slide the modulation ratio until the frantic flutter slows, and sweep the angle until the interference snaps into crystal focus."
      },
      {
        cost: 3,
        text: "Listen to the geometry of the five gates: First gate turns at half a right angle with a trio of pulses (3 / 45°). Second gate doubles the pulses and sits at a third of a circle (6 / 120°). Third gate drops to a pair at a true right corner (2 / 90°). Fourth gate doubles to an octave standing directly opposite on the horizon (8 / 180°). Fifth gate balances at five pulses, three quarters around the dial (5 / 270°). Read the five glyphs born from the light in numerical sequence."
      }
    ],
    solutionExplanation: "Tuning each of the five oscilloscope carrier channels to its harmonic resonance (CH1: ratio 3 / 45°, CH2: ratio 6 / 120°, CH3: ratio 2 / 90°, CH4: ratio 8 / 180°, CH5: ratio 5 / 270°) with high Q gain morphs the wave matrix to reveal the glyphs B, X, Z, 1, 9 in sequence, producing token BXZ19.",
    notebookFragment: "When five standing waves meet in balance, the phosphor draws the letters."
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
    validTokens: ["EL7P9"],
    honeypots: ["ORBITAL", "TELESCOPE", "ASTROMETRY", "BEACON5", "CELESTIAL"],
    hints: [
      {
        cost: 2,
        text: "The rooftop observatory logbook records five celestial sectors. Select each sector in the table to review Dr. Marrow's astronomical riddle for that coordinate."
      },
      {
        cost: 3,
        text: "Each riddle encodes a unique (X, Y) coordinate pair on the celestial grid using mathematical, literary, and physical constants (quarter-century age, work week multiples, midpoints, body temperature, primes, atomic numbers, and world journeys)."
      },
      {
        cost: 3,
        text: "Enter the calculated (X, Y) coordinates into the telescope reticle finder and lock crosshairs to capture each beacon signal. Assemble the five resolved tags in sector order (1 through 5) to forge the token."
      }
    ],
    solutionExplanation: "Deducing coordinates (25, 35), (35, 40), (37, 79), (82, 38), (80, 75) and locking the telescope reticle resolves the five stellar tags 1:E, 2:L, 3:7, 4:P, 5:9, unlocking token EL7P9.",
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
