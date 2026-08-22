export default {
  id: "level2",
  title: "Evidence Item #02: The Voicemail",
  evidenceType: "audio",
  evidenceFile: "/evidence/voicemail.wav",
  storyBriefing: "Timestamp: 03:41 AM. Received on the Mathematics Department voicemail server from an unlisted campus node. The audio is forty seconds of howling static and what sounds like Dr. Marrow speaking in backwards gibberish. Junior analysts spent hours trying to reverse the speech—only to find it's a decoy. Look at the sound through the lens of frequency space.",
  tools: ["waveform", "spectrogram", "bandpass"],
  defaultTool: "spectrogram",
  correctAnswer: "K4P82",
  hints: [
    { cost: 3, text: "The spoken voice is an acoustic decoy masking a high-frequency telegraph carrier pulse train." },
    { cost: 3, text: "Switch the filter mode to Bandpass and tune the center frequency slider toward ~2400 Hz." },
    { cost: 3, text: "Listen carefully starting at 2.8s: the voice cuts out and clean continuous wave Morse beeps emerge." },
    { cost: 5, text: "Decode the 5 Morse pulse groups: -.- (K), ....- (4), .--. (P), ---.. (8), ..--- (2) -> K4P82." }
  ],
  notebookFragment: "The second fragment always comes right after silence. Listen for the gap, not the sound."
};
