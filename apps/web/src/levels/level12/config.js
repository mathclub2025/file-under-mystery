export default {
  id: "level12",
  title: "Evidence Item #12: Campus Topology Graph",
  evidenceType: "graph",
  evidenceFile: "/evidence/campus_grid.json",
  storyBriefing: "A topological graph representing the campus building corridor network. Finding the unique Eulerian path resolves the final coordinate traversal sequence.",
  tools: ['eulerianTrace', 'adjacencyMatrix', 'degreeCounter'],
  defaultTool: "eulerianTrace",
  basePoints: 20,
  durationSeconds: 1500,
  hintCosts: [2, 3, 3]
};
