export default {
  id: "level7",
  title: "Evidence Item #07: Acoustic Sonification Cipher",
  evidenceType: "signal",
  evidenceFile: "/evidence/oscilloscope.dat",
  storyBriefing: "An encrypted 5-digit alphanumeric payload broadcast over an acoustic carrier channel. Five microtonal frequencies are cryptographically chained and masked beneath acoustic pink noise.",
  tools: ['sonificationDecoder', 'dspFilter', 'spectrumAnalyzer'],
  defaultTool: "sonificationDecoder",
  basePoints: 20,
  durationSeconds: 1500,
  hintCosts: [2, 3, 3]
};
