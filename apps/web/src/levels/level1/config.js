export default {
  id: "level1",
  title: "Evidence Item #01: The Photograph",
  evidenceType: "image",
  evidenceFile: "/evidence/forest.png",
  storyBriefing: "Timestamp: 03:14 AM. Recovered from Dr. Marrow's compact camera found in his desk drawer. Campus security footage shows he was walking along the perimeter woods behind the Technology Tower on the night he vanished. To the human eye, the image appears pitch black—a total failure of exposure. But the camera sensor recorded non-zero luminance. Something is hiding in the dark.",
  tools: ["brightness", "contrast", "gamma", "histogramStretch"],
  defaultTool: "histogramStretch",
  correctAnswer: "A19X7",
  hints: [
    { cost: 3, text: "The camera sensor recorded low non-zero pixel intensities clustered in the dark shadows. Adjust the Histogram Min and Max sliders to stretch this range." },
    { cost: 3, text: "Drag the Min slider to ~8-16 and Max slider to ~30-50, then boost the Gamma curve to ~1.60." },
    { cost: 3, text: "Zoom in and pan across the illuminated forest—check the upper canopy, dense foliage, center trunk, and root shadows to locate all 5 scattered numbered tags." },
    { cost: 5, text: "Read the 5 coordinates (1:A, 2:1, 3:9, 4:X, 5:7) and assemble them in order: A19X7." }
  ],
  notebookFragment: "I started numbering from the year I was born, not from zero."
};
