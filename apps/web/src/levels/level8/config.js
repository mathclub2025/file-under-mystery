export default {
  id: "level8",
  title: "Evidence Item #08: The Orbital Trajectory",
  evidenceType: "elliptic",
  evidenceFile: "/evidence/orbital_plot.png",
  storyBriefing: "Astronomical telemetry recordings recovered from the campus rooftop observatory link. Dr. Marrow recorded 5 narrative notebook riddles to conceal his celestial beacon coordinates. Decipher the clues for each sector, then lock the optical telescope crosshairs onto each stellar beacon to isolate the callsign.",
  tools: ["starfieldRadar", "reticleFinder"],
  defaultTool: "reticleFinder",
  correctAnswer: "EL7P9",
  hints: [
    { cost: 3, text: "Read the 5 entries in the Rooftop Observatory Notebook. Each sector contains a narrative riddle describing the (X, Y) coordinates of a hidden beacon." },
    { cost: 3, text: "Sector 1: Quarter-century (X = 25) and 7 × 5 work days (Y = 35). Sector 2: Midpoints between 20 and 50 (X = 35) and 30 and 50 (Y = 40)." },
    { cost: 3, text: "Sector 3: Human body temp in °C (X = 37) and prime before 80 (Y = 79). Sector 4: Lead's atomic number (X = 82) and 40 - 2 (Y = 38). Sector 5: 80 days around the world (X = 80) and 75% (Y = 75)." },
    { cost: 5, text: "Aim at the 5 solved coordinates (25, 35), (35, 40), (37, 79), (82, 38), (80, 75) to unlock all 5 tags: 1:E, 2:L, 3:7, 4:P, 5:9 -> Token: EL7P9." }
  ],
  notebookFragment: "Eight was the orbit. When the curve closed upon itself, the boundary was sealed."
};
