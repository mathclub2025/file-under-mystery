export default {
  id: "level5",
  title: "Level 05: The Shredded Notes",
  category: "Prime Stream Cryptography",
  shortDesc: "Recovered cross-cut paper strips from the office shredder containing prime indices [219, 163, 97, 59] and ciphertext.",
  storyBriefing: "Cross-cut paper strips retrieved from the office wastebasket. Dr. Marrow appears to have shredded his preliminary notes on prime modular arithmetic. Reconstruct the prime sequence index to decipher the running key ciphertext.",
  evidenceType: "cipher",
  evidenceData: {
    cipherText: "ETLVGTUJTATE",
    indices: [219, 163, 97, 59],
    solution: "P0W3R"
  },
  hints: [
    { cost: 3, text: "Inspect the handwritten notes on the shredded parchment to find four prime sequence indices: n = [219, 163, 97, 59]." },
    { cost: 3, text: "Find the n-th prime numbers for each index: P_219 = 1367, P_163 = 967, P_97 = 509, P_59 = 277." },
    { cost: 3, text: "Calculate the shift dials using modulo 26: 1367 mod 26 = 15, 967 mod 26 = 5, 509 mod 26 = 15, 277 mod 26 = 17." },
    { cost: 5, text: "Set the 4 Running Key dials to [15, 5, 15, 17] to decrypt the ciphertext into 'POWEROFSEVEN' -> Token: P0W3R." }
  ],
  diaryFragment: {
    title: "Diary Fragment #05 // Prime Harmonic Lattices",
    date: "August 14, 2026",
    location: "Department of Mathematics",
    content:
      "Primes are not milestones on an infinite line; they are resonance nodes of a standing wave. When you index them by their harmonic distances, the noise of the universe turns into plain text."
  },
  correctAnswer: "P0W3R",
  verificationToken: "P0W3R"
};
