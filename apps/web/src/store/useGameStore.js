import { create } from "zustand";

export const useGameStore = create((set, get) => ({
  solvedLevels: {},
  revealedHints: {},
  hintDeductions: 0,

  markLevelSolved: (levelId) =>
    set((state) => ({
      solvedLevels: { ...state.solvedLevels, [levelId]: true }
    })),

  revealHint: (levelId, hintIndex, cost = 25) =>
    set((state) => {
      const key = `${levelId}_${hintIndex}`;
      if (state.revealedHints[key]) return state;
      return {
        revealedHints: { ...state.revealedHints, [key]: true },
        hintDeductions: state.hintDeductions + cost
      };
    }),

  isLevelSolved: (levelId) => !!get().solvedLevels[levelId],
  isHintRevealed: (levelId, hintIndex) => !!get().revealedHints[`${levelId}_${hintIndex}`],

  getScore: () => {
    const solvedCount = Object.keys(get().solvedLevels).length;
    const base = solvedCount * 100;
    const net = Math.max(0, base - get().hintDeductions);
    return net;
  }
}));
