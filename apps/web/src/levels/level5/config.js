export default {
  id: "level5",
  title: "Evidence Item #05: The Cipher Machine",
  evidenceType: "cipher",
  evidenceFile: "/evidence/cipher_disk.json",
  storyBriefing: "A mechanical polyalphabetic rotor machine located in the laboratory safe. The dial shifts are governed by modular arithmetic reductions on prime number distribution sequences.",
  tools: ['rotorShift', 'primeMod', 'frequencyAnalysis'],
  defaultTool: "rotorShift",
  basePoints: 20,
  durationSeconds: 1200,
  hintCosts: [2, 3, 3]
};
