import { create } from "zustand";

export const useAuthStore = create((set, get) => ({
  team: null,
  setTeam: (team) => set({ team }),
  logout: () => {
    localStorage.removeItem("mystery_team_session");
    set({ team: null });
  },
  isAdmin: () => {
    const current = get().team;
    return current && (current.role === "admin" || current.isAdmin === true || current.teamName?.toLowerCase() === "admin");
  }
}));

