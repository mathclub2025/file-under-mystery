export default {
  id: "final",
  title: "Phase IV: The Marrow Meta-Assembly & Uplink",
  evidenceType: "finalBoss",
  storyBriefing: "All 12 evidence tokens recovered. All 12 notebook fragments in possession. Synthesize the 12 rules to discover the reverse permutation sequence, assemble the 60-character master key, and decrypt Dr. Marrow's final terminal transmission.",
  correctAnswer: "THE_BEACON_IS_AWAKE",
  masterKeystream: "GR4PH-PH4Z3-R30S4-FIN4L-EL7P9-BXZ19-NT2K5-P0W3R-M77RB-XT4Q1-K4P82-A19X7",
  hints: [
    { cost: 3, text: "The solid-state security module requires all 12 recovered tokens assembled into a continuous 60-character cryptographic key." },
    { cost: 3, text: "The hardware bootstrap protocol specifies a reverse chronological permutation: concatenate the tokens from Level 12 down to Level 01." },
    { cost: 3, text: "Reverse token sequence: [GR4PH, PH4Z3, R30S4, FIN4L, EL7P9, BXZ19, NT2K5, P0W3R, M77RB, XT4Q1, K4P82, A19X7]." },
    { cost: 5, text: "Concatenate into the master key: GR4PHPH4Z3R30S4FIN4LEL7P9BXZ19NT2K5P0W3RM77RBXT4Q1K4P82A19X7 to trigger the final transmission flag: THE_BEACON_IS_AWAKE." }
  ]
};
