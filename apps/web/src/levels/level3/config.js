export default {
  id: "level3",
  title: "Evidence Item #03: The Corridor Video",
  evidenceType: "video",
  evidenceFile: "/evidence/hallway.mp4",
  storyBriefing: "Timestamp: 00:00 Midnight. Corridor CCTV camera outside Room 418. The overhead fluorescent lights are buzzing and strobing. Watching at normal speed shows nothing out of the ordinary, but Dr. Marrow was a master of temporal harmonics. Scrutinize the surveillance tape to isolate the anomaly.",
  tools: ["scrubber", "frameStep"],
  defaultTool: "scrubber",
  correctAnswer: "XT4Q1",
  hints: [
    { cost: 3, text: "A subtle voltage fluctuation occurred when the fourth second gave way to the fifth." },
    { cost: 3, text: "The anomaly resides within a fifty-frame interval surrounding the tape's midpoint." },
    { cost: 3, text: "Examine each single frame closely across the 120 to 170 interval." },
    { cost: 5, text: "Decode the recovered payload string: 'VG9rZW46IFhUNFEx' -> 'Token: XT4Q1'." }
  ],
  notebookFragment: "The temporal anomaly is locked within a fifty-frame window as the fourth second turns to the fifth."
};
