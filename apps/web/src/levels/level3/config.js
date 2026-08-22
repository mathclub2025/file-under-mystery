export default {
  id: "level3",
  title: "Evidence Item #03: The Corridor Video",
  evidenceType: "video",
  evidenceFile: "/evidence/hallway.mp4",
  storyBriefing: "Timestamp: 00:00 Midnight. Corridor CCTV camera outside Room 418. The overhead fluorescent lights are buzzing and strobing. Watching at normal speed shows nothing out of the ordinary, but Dr. Marrow was a master of temporal harmonics. Scrutinize the surveillance tape frame by frame to isolate anomalies.",
  tools: ["scrubber", "frameStep"],
  defaultTool: "scrubber",
  correctAnswer: "XT4Q1",
  hints: [
    { cost: 3, text: "A single corrupted frame out of several hundred contains an embedded forensic artifact. Advance frame by frame." },
    { cost: 3, text: "Use the Frame Timeline Scrubber or Step +1 button to navigate to Frame 142 (~4.73 seconds into the recording)." },
    { cost: 3, text: "Inspect the upper-left conduit shadow on Frame 142 to locate the burned Base64 string: 'VG9rZW46IFhUNFEx'." },
    { cost: 5, text: "Decode the Base64 string 'VG9rZW46IFhUNFEx' (using external tool or terminal) -> 'Token: XT4Q1'." }
  ],
  notebookFragment: "Three is a corner. Corners change direction."
};
