export default {
  id: "level4",
  title: "Level 04: The Holiday Photo",
  category: "Bitplane Steganography",
  shortDesc: "A photograph labeled 'Holiday in Vienna' containing scattered coordinates across color channel bitplanes.",
  storyBriefing: "Recovered from an unencrypted USB drive in the laboratory desk. A photograph labeled 'Holiday in Vienna' containing anomalous high-frequency noise across color channel bitplanes. Slice the raw bitplanes to recover the scattered coordinates.",
  evidenceType: "stego",
  evidenceData: {
    imageUrl: "/evidence/holiday.png",
    solution: "M77RB"
  },
  hints: [
    { cost: 3, text: "The photograph conceals 5 steganographic coordinate tags submerged across separate RGB color channels and bitplane depths." },
    { cost: 3, text: "Select individual color channels (RED, GREEN, BLUE) and test Bitplane depths (Bit 0 LSB through Bit 3) with X/Y phase alignment." },
    { cost: 3, text: "Locate tags: Red Bit 0 (1:M), Green Bit 1 (2:7), Blue Bit 0 (3:7), Blue Bit 2 (4:R), Blue Bit 3 (5:B)." },
    { cost: 5, text: "Assemble the 5 ordered tags from 1 to 5 to produce the verification token: M77RB." }
  ],
  diaryFragment: {
    title: "Diary Fragment #04 // Reversible Entropy",
    date: "July 22, 2018",
    location: "Vienna, Austria",
    content:
      "Vienna, 2018. That was the summer I realized entropy is reversible if you possess the seed state. I hid the derivation inside an ordinary vacation memory. Beauty is the best hiding place."
  },
  correctAnswer: "M77RB",
  verificationToken: "M77RB"
};
