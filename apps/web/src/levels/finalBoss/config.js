export default {
  id: "final",
  title: "Phase IV: Meta-Assembly Hardware Boot",
  evidenceType: "metaAssembly",
  evidenceFile: "/evidence/master_uplink.json",
  storyBriefing: "The air-gapped laboratory terminal hardware interface. Reverse concatenation of all 12 forensic tokens unlocks the system master firmware.",
  tools: ['tensorPermuter', 'tokenConcatenator', 'parityValidator'],
  defaultTool: "tokenConcatenator",
  basePoints: 20,
  durationSeconds: 1200,
  hintCosts: [3, 5, 5]
};
