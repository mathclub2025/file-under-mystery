export default {
  id: "level11",
  title: "Evidence Item #11: Differential Audio Inversion",
  evidenceType: "phaseAudio",
  evidenceFile: "/evidence/stereo_phase.wav",
  storyBriefing: "A stereo recording containing correlated ambient noise. Applying 180-degree phase inversion on the right channel cancels the masking noise and isolates the submerged voice.",
  tools: ['phaseInverter', 'stereoBalance', 'spectrogram'],
  defaultTool: "phaseInverter",
  basePoints: 24,
  durationSeconds: 1200,
  hintCosts: [2, 3, 3]
};
