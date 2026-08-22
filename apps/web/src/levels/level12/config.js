export default {
  id: "level12",
  title: "Evidence Item #12: The Chromatic Distance Cipher",
  evidenceType: "graph",
  evidenceFile: "/evidence/vit_chennai_map.jpg",
  storyBriefing: "Digital chromatic survey map of the VIT Chennai campus. Dr. Marrow encoded an elite-tier firewall passcode across 5 campus structural pillars using 3D color vector coordinates relative to the central foundation in SlateGray.",
  tools: ["colorSpectrometer", "distanceCalculator"],
  defaultTool: "colorSpectrometer",
  correctAnswer: "GR4PH",
  hints: [
    { cost: 3, text: "Click on the buildings on the map to sample their spectrum color signatures: SlateGray, CadetSlate, HeatherBlue, SlateTeal, GraphiteSlate, and CobaltDusk." },
    { cost: 3, text: "Determine the hex codes for each color, enter them into the sensor table to extract RGB, and calculate 3D Euclidean distances from the SlateGray anchor (112, 128, 144)." },
    { cost: 3, text: "Calculated magnitudes: Due North = 7; North-East = 18; South-East = 4; South-West = 16; North-West = 8." },
    { cost: 5, text: "Translate magnitudes in clockwise order from North: 7 -> 'G', 18 -> 'R', 4 stays as '4' (the machine digit), 16 -> 'P', 8 -> 'H' -> Token: GR4PH." }
  ],
  notebookFragment: "Twelve was the chromatic anchor. The distance from the center unlocks the boundary."
};
