import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Terminal, FolderLock, Trophy } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore.js";
import { useGameStore } from "../store/useGameStore.js";
import LeaderboardModal from "./LeaderboardModal.jsx";

export default function Navbar() {
  const { team } = useAuthStore();
  const { getActiveLevelId } = useGameStore();
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);

  const activeLevel = getActiveLevelId() || "level1";

  return (
    <>
      <header className="glass-panel sticky top-0 z-50 border-b border-white/10 mb-6 backdrop-blur-xl bg-black/60 font-mono">
        <div className="container mx-auto px-4 max-w-6xl h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 group-hover:border-cyan-400 group-hover:shadow-[0_0_15px_rgba(56,189,248,0.3)] transition-all">
              <FolderLock size={20} />
            </div>
            <div>
              <div className="font-mono font-bold tracking-wider text-sm text-white group-hover:text-cyan-300 transition-colors">
                FILE UNDER MYSTERY
              </div>
              <div className="text-[9px] text-slate-400 font-mono tracking-widest uppercase">
                VIT Mathematics Club // Forensics Unit
              </div>
            </div>
          </Link>

          {/* Center / Right Links */}
          <nav className="flex items-center gap-3 md:gap-6 text-xs font-mono">
            {team && (
              <div className="flex items-center gap-2 pl-3 text-slate-300">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="text-white font-bold max-w-[150px] truncate">{team.teamName}</span>
                <span className="text-[10px] text-slate-400">({team.regNo || team.captainRegNo})</span>
              </div>
            )}
          </nav>
        </div>
      </header>

      {showLeaderboardModal && (
        <LeaderboardModal onClose={() => setShowLeaderboardModal(false)} />
      )}
    </>
  );
}
