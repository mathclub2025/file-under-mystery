export default {
  id: "level3",
  title: "Evidence Item #03: The Surveillance Recording",
  evidenceType: "video",
  evidenceFile: "/evidence/cctv.mp4",
  storyBriefing: "Timestamp: 04:55 AM. Security camera footage overlooking the faculty seminar room blackboard. The room appears completely still, but temporal frame subtraction exposes minute micro-displacements in the chalk dust.",
  tools: ['frameDiff', 'playbackSpeed', 'channelFilter'],
  defaultTool: "frameDiff",
  basePoints: 14,
  durationSeconds: 1200,
  hintCosts: [2, 3, 3]
};
