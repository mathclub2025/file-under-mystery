export default {
  id: "level10",
  title: "Evidence Item #10: The Lattice Growth",
  evidenceType: "automata",
  evidenceFile: "/evidence/rule30_lattice.png",
  storyBriefing: "A triangular matrix of discrete binary states generated using Wolfram's Rule 30 1D cellular automaton. To find the initialization vector, work backwards from the chaotic pyramid to recover the 8-bit seed.",
  tools: ["automataViewer", "seedValidator"],
  defaultTool: "seedValidator",
  correctAnswer: "R30S4",
  hints: [
    { cost: 3, text: "The lattice pattern grows downwards according to Wolfram Rule 30 boolean transition: c_i^(t+1) = p ⊕ (q ∨ r)." },
    { cost: 3, text: "Work backwards from the observed top rows of the evidence image to find the unique 8-bit predecessor seed at time t=0." },
    { cost: 3, text: "Enter and test candidate 8-bit binary seeds in the Predecessor Seed Validator (e.g. 10100110)." },
    { cost: 5, text: "Validating seed 10100110 produces zero entropy discrepancy, corresponding to token: R30S4." }
  ],
  notebookFragment: "Ten is the ancestor of chaos. Find the root before the pyramid grows."
};
