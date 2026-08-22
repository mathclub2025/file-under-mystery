export default {
  id: "level11",
  title: "Level 11: The Dual Transmission",
  category: "Binaural Harmonic Phase & Reverse Speech",
  shortDesc: "Dual-channel harmonic intercept hiding reversed coordinate pulses across 5 Schumann overtones.",
  storyBriefing: "Dual-channel stereo audio intercept from Dr. Marrow's safehouse transceiver. In normal playback, only an old man's muffled voice muttering forward telemetry is heard. Applying a 180-degree phase inversion to the right channel cancels the forward speech, revealing reversed coordinate pulses encoded across five harmonic overtone frequencies (f₀ = 432 Hz). Reverse the playback buffer and tune the resonator to decode the matrix coordinates.",
  evidenceType: "audioPhase",
  evidenceData: {
    audioUrl: "/evidence/stereo_phase_carrier.wav",
    solution: "PH4Z3"
  },
  hints: [
    { cost: 3, text: "Click 'Right Channel 180° Inversion: ACTIVE (L - R NULL)' in the console to cancel out the forward muffled speech." },
    { cost: 3, text: "The secret coordinate voice is reversed in time. Toggle 'PLAYBACK: REVERSED (START BEHIND)' so the spoken coordinate numbers play forwards." },
    { cost: 3, text: "The coordinates are tuned to the 5 harmonic overtones of 432 Hz: [432 Hz, 864 Hz, 1296 Hz, 1728 Hz, 2160 Hz]. Move the Resonant Frequency slider to each frequency." },
    { cost: 5, text: "Listen to the 5 coordinate pairs: (3,4), (2,2), (5,6), (5,2), (5,5). Cross-reference them with the 6x6 Polybius Matrix to get PH4Z3." }
  ],
  diaryFragment: {
    title: "Diary Fragment #11 // Harmonic Phase Inversion",
    date: "October 13, 2026",
    location: "Perimeter Listening Station",
    content:
      "I inverted the time arrow on the coordinates and split them across the five harmonic multiples of our fundamental node (432 Hz, 864 Hz, 1296 Hz, 1728 Hz, 2160 Hz). Normal listening reveals only forward noise. But when subtracted (L - R) and reversed in time, the five coordinates speak true."
  },
  correctAnswer: "PH4Z3",
  verificationToken: "PH4Z3"
};
