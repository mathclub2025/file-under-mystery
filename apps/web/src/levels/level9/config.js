export default {
  id: "level9",
  title: "Evidence Item #09: 2D Fourier Dispersion",
  evidenceType: "fourier",
  evidenceFile: "/evidence/signal_fft.png",
  storyBriefing: "A synthetic digital signal recovered from the university core backup drive. Dr. Marrow dispersed his watermark across multiple harmonic frequencies and angular phases in the 2D Fourier frequency domain. Sweep through the radial bandpass filter and phase angles to isolate all five harmonic fragments.",
  tools: ["fftSpectrum", "radialMask", "phaseIsolator"],
  defaultTool: "radialMask",
  correctAnswer: "FIN4L",
  hints: [
    { cost: 3, text: "The watermark is dispersed into five separate harmonic resonance points across 2D frequency space (K-space)." },
    { cost: 3, text: "Adjust both the Radial Bandpass slider and the Angular Phase angle to search across low, mid, and high frequencies." },
    { cost: 3, text: "Locate the 5 resonance combinations: r ≈ 26px / 30° (1:F), r ≈ 48px / 75° (2:I), r ≈ 70px / 120° (3:N), r ≈ 92px / 45° (4:4), r ≈ 110px / 150° (5:L)." },
    { cost: 5, text: "Collect the 5 ordered tags (1:F, 2:I, 3:N, 4:4, 5:L) and assemble the token: FIN4L." }
  ],
  notebookFragment: "Nine harmonic rings upon the transform plane. Each carries a single frequency fragment."
};
