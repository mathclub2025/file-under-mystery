export default {
  id: "level9",
  title: "Evidence Item #09: Celestial Astrometry",
  evidenceType: "astrometry",
  evidenceFile: "/evidence/sky_survey.json",
  storyBriefing: "Astronomical telescope survey data logging celestial beacons. Evaluating vector displacements and midpoint intersections locates an uncatalogued satellite beacon.",
  tools: ['vectorShift', 'midpointIntersect', 'starMapCrosshair'],
  defaultTool: "starMapCrosshair",
  basePoints: 22,
  durationSeconds: 1200,
  hintCosts: [2, 3, 3]
};
