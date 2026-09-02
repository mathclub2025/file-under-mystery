export default {
  id: "level10",
  title: "Evidence Item #10: Cellular Automata Lattice",
  evidenceType: "automata",
  evidenceFile: "/evidence/rule30_lattice.json",
  storyBriefing: "A 1D elementary cellular automata lattice generating deterministic state evolution under Wolfram Rule 30. Reverse constraint solving determines the ancestral seed.",
  tools: ['ruleDial', 'ancestorSolver', 'latticeScroller'],
  defaultTool: "ancestorSolver",
  basePoints: 20,
  durationSeconds: 1500,
  hintCosts: [2, 3, 3]
};
