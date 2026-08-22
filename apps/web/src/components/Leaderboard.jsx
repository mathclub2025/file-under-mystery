import React from "react";
import { Trophy, Medal, Award, Flame, Timer, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function Leaderboard() {
  const sampleTeams = [
    { rank: 1, name: "Vector Space Cowboys", regNo: "23BCE1042", score: 184, solved: 12, lastSolve: "14:32:10", streak: 5 },
    { rank: 2, name: "Null Hypothesis", regNo: "23BME0819", score: 162, solved: 11, lastSolve: "14:35:45", streak: 3 },
    { rank: 3, name: "Eigenvalues", regNo: "23BIT0214", score: 148, solved: 10, lastSolve: "14:40:12", streak: 4 },
    { rank: 4, name: "Harmonic Oscillators", regNo: "23BCE3141", score: 130, solved: 9, lastSolve: "14:44:20", streak: 2 },
    { rank: 5, name: "Fourier Transform Unit", regNo: "23BEC0921", score: 115, solved: 8, lastSolve: "14:48:50", streak: 1 },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-16 font-mono">
      {/* Top Banner */}
      <div className="glass-panel-glow rounded-2xl p-6 border border-cyan-500/30 flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-400">
            <Trophy size={24} />
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-cyan-400 font-bold">
              REALTIME INVESTIGATION TELEMETRY
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white">Live Operations Leaderboard</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            LIVE SYNC ACTIVE
          </div>
          <Link
            to="/board"
            className="px-4 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-slate-300 hover:text-white text-xs"
          >
            Case Board &rarr;
          </Link>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider border-b border-white/10">
              <tr>
                <th className="p-4">Rank</th>
                <th className="p-4">Team Name & Reg No</th>
                <th className="p-4 text-center">Cases Solved</th>
                <th className="p-4 text-center">Current Streak</th>
                <th className="p-4 text-right">Net Score</th>
                <th className="p-4 text-right">Last Solved</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {sampleTeams.map((t) => (
                <tr
                  key={t.rank}
                  className="hover:bg-slate-800/40 transition-colors group"
                >
                  <td className="p-4 font-bold">
                    {t.rank === 1 ? (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold flex items-center gap-1 w-fit">
                        <Trophy size={13} /> #1
                      </span>
                    ) : t.rank === 2 ? (
                      <span className="px-2 py-0.5 rounded-lg bg-slate-300/10 border border-slate-400/40 text-slate-200 font-bold flex items-center gap-1 w-fit">
                        <Medal size={13} /> #2
                      </span>
                    ) : t.rank === 3 ? (
                      <span className="px-2 py-0.5 rounded-lg bg-amber-700/20 border border-amber-700/40 text-amber-500 font-bold flex items-center gap-1 w-fit">
                        <Award size={13} /> #3
                      </span>
                    ) : (
                      <span className="text-slate-400 pl-2">#{t.rank}</span>
                    )}
                  </td>

                  <td className="p-4">
                    <div className="font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {t.name}
                    </div>
                    <div className="text-[10px] text-slate-500">{t.regNo}</div>
                  </td>

                  <td className="p-4 text-center font-bold text-cyan-400">
                    <span className="px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-800/40">
                      {t.solved} / 12
                    </span>
                  </td>

                  <td className="p-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-orange-950/60 border border-orange-500/40 text-orange-300 text-[11px] font-bold">
                      <Flame size={12} className="text-orange-400" /> {t.streak}x
                    </span>
                  </td>

                  <td className="p-4 text-right font-bold text-emerald-400 text-sm">
                    {t.score} pts
                  </td>

                  <td className="p-4 text-right text-slate-400 text-[11px]">
                    <span className="inline-flex items-center gap-1">
                      <Timer size={12} /> {t.lastSolve}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
