export default {
  id: "level6",
  title: "Evidence Item #06: The Network Capture",
  evidenceType: "packets",
  evidenceFile: "/evidence/network_capture.json",
  storyBriefing: "Captured from the department's gateway router during an unauthorized connection. 80 network requests are stored in the buffer. 79 represent standard university web traffic. But one packet carries an abnormal payload signature in its Authorization header.",
  tools: ["packetFilter", "headerInspector"],
  defaultTool: "packetFilter",
  correctAnswer: "NT2K5",
  hints: [
    { cost: 3, text: "Most of the 80 network requests are routine university traffic (~1 to 18 KB). Look for a massive data volume outlier." },
    { cost: 3, text: "Scroll down the packet sequence to find Packet #47, which has an anomalous payload size of 64.8 KB." },
    { cost: 3, text: "Inspect Packet #47's HTTP headers to find the authorization string: 'Authorization: Bearer TlQySzU='." },
    { cost: 5, text: "Decode the Base64 token 'TlQySzU=' (using terminal or external tool) -> 'NT2K5'." }
  ],
  notebookFragment: "Six was the year everything changed. Not the sixth thing I found."
};
