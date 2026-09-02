export default {
  id: "level2",
  title: "Evidence Item #02: The Voicemail",
  evidenceType: "audio",
  evidenceFile: "/evidence/voicemail.wav",
  storyBriefing: "Timestamp: 04:22 AM. Audio snippet extracted from the department answering machine. A distorted message with dense ambient interference and masking speech. Hidden in the background static is a high-frequency carrier wave transmitting a continuous telegraph pulse.",
  tools: ['bandpass', 'speed', 'waveform'],
  defaultTool: "bandpass",
  basePoints: 20,
  durationSeconds: 1500,
  hintCosts: [2, 3, 3]
};
