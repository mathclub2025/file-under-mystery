export default {
  id: "level8",
  title: "Evidence Item #08: The Harmonic Signal",
  evidenceType: "fourier",
  evidenceFile: "/evidence/harmonic_glyph.png",
  storyBriefing: "A 2D spatial frequency spectrogram containing a standing wave glyph. Synthesizing spatial coordinates via Inverse Fast Fourier Transform isolates the hidden contour.",
  tools: ['radialBandpass', 'phaseAlignment', 'ifft2d'],
  defaultTool: "ifft2d",
  basePoints: 20,
  durationSeconds: 1500,
  hintCosts: [2, 3, 3]
};
