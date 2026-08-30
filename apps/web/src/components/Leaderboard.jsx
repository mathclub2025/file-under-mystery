import React, { useState, useEffect } from "react";
import { Trophy, Medal, Award } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore.js";
import { useGameStore } from "../store/useGameStore.js";
import { apiGetLeaderboard } from "../lib/api.js";
import Navbar from "./Navbar.jsx";

export default function Leaderboard() {
  const { team } = useAuthStore();
  const { getScore, getSolvedCount, getTotalTimeSpentSeconds, getFormattedTotalTime } = useGameStore();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchStandings = async () => {
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
            solved: t.solved !== undefined ? t.solved : 0,
            points: t.points !== undefined ? t.points : (t.total_points || 0),
            timeSeconds: t.timeSeconds !== undefined ? t.timeSeconds : (t.total_time_seconds || 0),
            currentLevel: t.currentLevel || "level1",
            isUser: team && (team.id === t.id || team.teamName?.toLowerCase() === (t.name || t.team_name)?.toLowerCase())
          }));
      }

      // Tie-breaker sorting: Points DESC -> Time Taken ASC (Faster = higher rank) -> Solved Count DESC
      list.sort((a, b) => b.points - a.points || (a.timeSeconds || 0) - (b.timeSeconds || 0) || b.solved - a.solved);
      setTeams(list.map((t, idx) => ({ ...t, rank: idx + 1 })));
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStandings();
    const interval = setInterval(fetchStandings, 15000);
    return () => clearInterval(interval);
  }, [team]);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-4 min-h-screen flex flex-col font-mono">
      <Navbar />

      <div className="flex flex-col gap-6 pb-16">
        {/* Top Banner (Clean, no trophy box, no sync pills) */}
        <div className="rounded-3xl p-6 border border-white/15 flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xl bg-[#0a0a0c]">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
              OPERATIONS TELEMETRY
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-wide">Live Operations Leaderboard</h1>
          </div>

          <div>
            <Link
              to={`/investigate/${useGameStore.getState().getActiveLevelId() || "level1"}`}
              className="px-6 py-2.5 rounded-xl bg-white text-black font-bold hover:bg-slate-200 text-xs transition-all shadow cursor-pointer flex items-center gap-2"
            >
              <span>Resume Case</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>

        {/* Leaderboard Table with Time Taken Column */}
        <div className="rounded-3xl border border-white/15 overflow-hidden shadow-2xl bg-[#0a0a0c]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0e0e12] text-slate-400 uppercase tracking-wider border-b border-white/10">
                <tr>
                  <th className="p-4">Rank</th>
                  <th className="p-4">Team Name & Reg No</th>
                  <th className="p-4 text-center">Cases Solved</th>
                  <th className="p-4 text-center">Time Taken</th>
                  <th className="p-4 text-center">Active Case</th>
                  <th className="p-4 text-right pr-6">Net Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
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
                        t.isUser ? "bg-white/[0.06] border-l-4 border-white" : "hover:bg-white/[0.02]"
                      }`}
                    >
                      <td className="p-4 font-bold">
                        {t.rank === 1 ? (
                          <span className="px-2.5 py-1 rounded-xl bg-white/15 border border-white/30 text-white font-bold flex items-center gap-1 w-fit">
                            <Trophy size={13} /> #1
                          </span>
                        ) : t.rank === 2 ? (
                          <span className="px-2 py-0.5 rounded-xl bg-white/10 border border-white/20 text-slate-200 font-bold flex items-center gap-1 w-fit">
                            <Medal size={13} /> #2
                          </span>
                        ) : t.rank === 3 ? (
                          <span className="px-2 py-0.5 rounded-xl bg-white/5 border border-white/15 text-slate-300 font-bold flex items-center gap-1 w-fit">
                            <Award size={13} /> #3
                          </span>
                        ) : (
                          <span className="text-slate-400 pl-2">#{t.rank}</span>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-2">
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

                      <td className="p-4 text-center font-bold text-white">
                        <span className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10">
                          {t.solved} / 13
                        </span>
                      </td>

                      <td className="p-4 text-center font-mono text-slate-300">
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[11px]">
                          {getFormattedTotalTime(t.timeSeconds)}
                        </span>
                      </td>

                      <td className="p-4 text-center">
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300 text-[11px]">
                          {t.currentLevel.toUpperCase()}
                        </span>
                      </td>

                      <td className="p-4 pr-6 text-right font-extrabold text-white text-sm">
                        {t.points} <span className="text-[10px] text-slate-400 font-normal">pts</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
