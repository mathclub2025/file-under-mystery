import React, { useState, useEffect } from "react";
import { Trophy, Medal, Award, X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore.js";
import { useGameStore } from "../store/useGameStore.js";
import { apiGetLeaderboard } from "../lib/api.js";

const LEVEL_NAMES = {
  level1: "L01: The Photograph",
  level2: "L02: The Voicemail",
  level3: "L03: The Corridor Video",
  level4: "L04: The Holiday Photo",
  level5: "L05: The Shredded Notes",
  level6: "L06: The Network Capture",
  level7: "L07: Harmonic Waves",
  level8: "L08: The Orbital Plot",
  level9: "L09: 2D Fourier Dispersion",
  level10: "L10: The Lattice Growth",
  level11: "L11: Dual Transmission",
  level12: "L12: Chromatic Distance",
  final: "Phase IV: Meta-Assembly"
};

export default function LeaderboardModal({ onClose, currentLevelId }) {
  const { team } = useAuthStore();
  const { getScore, getSolvedCount, getTotalTimeSpentSeconds, getFormattedTotalTime } = useGameStore();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLiveLeaderboard = async () => {
    setLoading(true);
    try {
      const dbTeams = await apiGetLeaderboard();
      let list = [];

      if (dbTeams && dbTeams.length > 0) {
        list = dbTeams
          .filter((t) => (t.name || t.team_name || "").toLowerCase() !== "admin" && t.id !== "admin")
          .map((t, idx) => ({
            rank: idx + 1,
            id: t.id,
            name: t.name || t.team_name,
            regNo: t.regNo || t.captain_reg_no || t.captain_email || "23BCE0000",
            currentLevel: t.currentLevel || t.current_level || "level1",
            solved: t.solved !== undefined ? t.solved : 0,
            points: t.points !== undefined ? t.points : (t.total_points || 0),
            timeSeconds: t.timeSeconds !== undefined ? t.timeSeconds : (t.total_time_seconds || 0),
            isUser: team && (team.id === t.id || team.teamName?.toLowerCase() === (t.name || t.team_name)?.toLowerCase())
          }));
      }

      // Tie-breaker sorting: Points DESC -> Time Taken ASC (Faster = higher rank) -> Solved Count DESC
      list.sort((a, b) => b.points - a.points || (a.timeSeconds || 0) - (b.timeSeconds || 0) || b.solved - a.solved);

      const ranked = list.map((item, idx) => ({
        ...item,
        rank: idx + 1
      }));

      setTeams(ranked);
    } catch (err) {
      console.warn("Leaderboard live sync fallback:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveLeaderboard();
    const interval = setInterval(fetchLiveLeaderboard, 15000);
    return () => clearInterval(interval);
  }, [team, currentLevelId]);

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-3 sm:p-6 animate-fade-in font-mono select-none"
    >
      <div className="bg-[#0a0a0c] border border-white/15 rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <div className="text-white font-bold text-sm sm:text-base tracking-wide uppercase">
              OPERATIONS LEADERBOARD
            </div>
            <p className="text-[11px] text-slate-400">
              Real-time team standings, solve speed & performance points
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Your Team</div>
            <div className="font-bold text-white truncate mt-0.5">
              {team ? team.teamName : "Spectator"}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Your Net Score</div>
            <div className="font-bold text-white mt-0.5">
              {getScore()} PTS
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Cases Solved</div>
            <div className="font-bold text-white mt-0.5">
              {getSolvedCount()} / 13
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Time Taken</div>
            <div className="font-bold text-slate-200 mt-0.5">{getFormattedTotalTime()}</div>
          </div>
        </div>

        {/* Table Viewport */}
        <div className="flex-1 overflow-y-auto rounded-2xl border border-white/10 bg-black/40">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0e0e12] text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10 sticky top-0 backdrop-blur z-10">
              <tr>
                <th className="p-3 pl-4">Rank</th>
                <th className="p-3">Team & Reg No</th>
                <th className="p-3 text-center">Active Level</th>
                <th className="p-3 text-center">Solved</th>
                <th className="p-3 text-center">Time Taken</th>
                <th className="p-3 text-right pr-4">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {teams.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 italic text-xs">
                    No active team standings registered in database yet. Standings will populate dynamically as investigations progress.
                  </td>
                </tr>
              ) : (
                teams.map((t) => (
                  <tr
                    key={t.rank}
                    className={`transition-colors ${
                      t.isUser
                        ? "bg-white/[0.06] border-l-4 border-white"
                        : "hover:bg-white/[0.02]"
                    }`}
                  >
                    {/* Rank */}
                    <td className="p-3 pl-4 font-bold">
                      {t.rank === 1 ? (
                        <span className="px-2 py-0.5 rounded-lg bg-white/15 border border-white/30 text-white font-bold flex items-center gap-1 w-fit text-[11px]">
                          <Trophy size={12} /> #1
                        </span>
                      ) : t.rank === 2 ? (
                        <span className="px-2 py-0.5 rounded-lg bg-white/10 border border-white/20 text-slate-200 font-bold flex items-center gap-1 w-fit text-[11px]">
                          <Medal size={12} /> #2
                        </span>
                      ) : t.rank === 3 ? (
                        <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/15 text-slate-300 font-bold flex items-center gap-1 w-fit text-[11px]">
                          <Award size={12} /> #3
                        </span>
                      ) : (
                        <span className="text-slate-400 pl-1">#{t.rank}</span>
                      )}
                    </td>

                    {/* Team Details */}
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-bold ${t.isUser ? "text-white" : "text-slate-200"}`}>
                          {t.name}
                        </span>
                        {t.isUser && (
                          <span className="px-1.5 py-0.2 rounded bg-white/20 text-white text-[9px] font-extrabold border border-white/30">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500">{t.regNo}</div>
                    </td>

                    {/* Current Active Level */}
                    <td className="p-3 text-center">
                      <span className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-[11px] whitespace-nowrap">
                        {LEVEL_NAMES[t.currentLevel] || t.currentLevel}
                      </span>
                    </td>

                    {/* Cases Solved */}
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-[11px] font-bold">
                        {t.solved} / 13
                      </span>
                    </td>

                    {/* Time Taken */}
                    <td className="p-3 text-center font-mono text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[11px]">
                        {getFormattedTotalTime(t.timeSeconds)}
                      </span>
                    </td>

                    {/* Points */}
                    <td className="p-3 pr-4 text-right">
                      <span className="text-sm font-extrabold text-white">
                        {t.points} <span className="text-[10px] text-slate-400 font-normal">pts</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end text-[11px] text-slate-400 pt-2 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white text-black font-bold hover:bg-slate-200 transition-all cursor-pointer text-xs shadow"
          >
            Close Terminal
          </button>
        </div>
      </div>
    </div>
  );
}
