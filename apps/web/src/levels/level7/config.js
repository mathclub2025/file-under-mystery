export default {
  id: "level7",
  title: "Evidence Item #07: Harmonic Wave Superposition",
  evidenceType: "oscilloscope",
  evidenceFile: "/evidence/waveform_carrier.json",
  storyBriefing: "An analog oscilloscope recording intercepted from Dr. Marrow's signal bench. Continuous traveling sinusoidal waves oscillate across the screen. Tune the carrier channels, harmonic frequency ratios, and interference phase angles to observe standing wave convergence.",
  tools: ["harmonicOscillator", "phaseTuner"],
  defaultTool: "harmonicOscillator",
  correctAnswer: "BXZ19",
  hints: [
    { cost: 3, text: "Inspect each carrier channel (CH-01 through CH-05) on the oscilloscope. Each channel corresponds to one letter of the 5-character token." },
    { cost: 3, text: "As you tune the Frequency Ratio and Phase sliders for each channel, observe how the continuous flowing background sinusoidal wave lines physically warp into letter shapes." },
    { cost: 3, text: "Find the standing wave resonance for each channel: CH-01 produces 'B', CH-02 produces 'X', CH-03 produces 'Z', CH-04 produces '1', CH-05 produces '9'." },
    { cost: 5, text: "The five converged standing wave glyphs across CH-01 to CH-05 spell out the verification token: BXZ19." }
  ],
  notebookFragment: "Seven harmonics weave the standing wave. When phases align, the trajectory is unbroken."
};
