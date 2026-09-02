export default {
  id: "level6",
  title: "Evidence Item #06: Network Protocol Capture",
  evidenceType: "pcap",
  evidenceFile: "/evidence/traffic.pcap",
  storyBriefing: "A network packet capture log recorded between 02:00 AM and 05:00 AM from the laboratory gateway router. One outlier packet contains an abnormally large authorization payload.",
  tools: ['packetFilter', 'streamReassembler', 'entropyGraph'],
  defaultTool: "packetFilter",
  basePoints: 20,
  durationSeconds: 1500,
  hintCosts: [2, 3, 3]
};
