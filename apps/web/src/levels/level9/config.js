export default {
  id: "level9",
  title: "Evidence Item #09: Celestial Astrometry",
  evidenceType: "astrometry",
  evidenceFile: "/evidence/sky_survey.json",
  storyBriefing: "Astronomical telescope survey data logging celestial beacons. Evaluating vector displacements and midpoint intersections locates an uncatalogued satellite beacon.",
  tools: ['vectorShift', 'midpointIntersect', 'starMapCrosshair'],
  defaultTool: "starMapCrosshair",
  basePoints: 20,
  durationSeconds: 1500,
  hintCosts: [2, 3, 3]
};
