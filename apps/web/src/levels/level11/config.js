export default {
  id: "level11",
  title: "Level 11: The Dual Transmission",
  category: "Audio Phase Cancellation",
  shortDesc: "Dual-channel radio telescope audio saturated with uncorrelated masking noise.",
  storyBriefing: "Dual-channel stereo audio intercept from the university radio telescope receiver. Both channels are saturated with uncorrelated Gaussian noise. Applying a 180-degree phase inversion to the right channel cancels the masking noise floor. Isolate the differential carrier whisper.",
  evidenceType: "audioPhase",
  evidenceData: {
    audioUrl: "/evidence/stereo_phase_carrier.wav",
    carrierFreq: 1200,
    startTime: 9.0,
    solution: "PH4Z3"
  },
  hints: [
    { cost: 3, text: "Both audio channels are overwhelmed with loud masking static, but the hidden voice signal was recorded with opposite polarity between channels." },
    { cost: 3, text: "Toggle the 'Phase Invert Right (180°)' switch in the audio console to perform common-mode rejection (L - R)." },
    { cost: 3, text: "Once the roaring background static cancels out, seek to precisely the 9.0-second mark on the playback timeline." },
    { cost: 5, text: "Listen to the isolated whisper voice at 9.0s stating the verification token: PH4Z3." }
  ],
  diaryFragment: {
    title: "Diary Fragment #11 // Phase Interference",
    date: "October 13, 2026",
    location: "Perimeter Listening Station",
    content:
      "Two microphones recorded the room simultaneously. In isolation, each track is pure deafening noise. But when subtracted from one another, the noise annihilates itself. The truth was hiding in the difference."
  },
  correctAnswer: "PH4Z3",
  verificationToken: "PH4Z3"
};
