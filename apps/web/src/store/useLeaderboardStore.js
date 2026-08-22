import { create } from "zustand";

export const useLeaderboardStore = create((set) => ({
  scores: [],
  setScores: (scores) => set({ scores }),
}));
