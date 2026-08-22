import { create } from "zustand";

export const useAuthStore = create((set) => ({
  team: null,
  setTeam: (team) => set({ team }),
  logout: () => set({ team: null }),
}));
