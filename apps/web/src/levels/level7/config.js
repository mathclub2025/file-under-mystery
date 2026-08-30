export default {
  id: "level7",
  title: "Evidence Item #07: Harmonic Waves",
  evidenceType: "signal",
  evidenceFile: "/evidence/oscilloscope.dat",
  storyBriefing: "Continuous analog oscilloscope recordings from Marrow's laboratory signal bench. Five dispersed harmonic frequencies interfere destructively until each carrier channel is tuned to its resonance phase.",
  tools: ['harmonicTuner', 'phaseAligner', 'resonanceAnalyzer'],
  defaultTool: "harmonicTuner",
  basePoints: 18,
  durationSeconds: 1200,
  hintCosts: [2, 3, 3]
};
