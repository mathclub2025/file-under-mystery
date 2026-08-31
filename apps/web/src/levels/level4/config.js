export default {
  id: "level4",
  title: "Evidence Item #04: The Holiday Photograph",
  evidenceType: "stego",
  evidenceFile: "/evidence/holiday.png",
  storyBriefing: "Recovered from Dr. Marrow's personal archive. An innocent-looking landscape photo hiding auxiliary forensic bitplanes submerged in the least significant bit (LSB) channel layer.",
  tools: ['bitplaneSlicer', 'channelSolo', 'phaseShift'],
  defaultTool: "bitplaneSlicer",
  basePoints: 20,
  durationSeconds: 1200,
  hintCosts: [2, 3, 3]
};
