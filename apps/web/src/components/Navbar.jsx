import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Terminal, Award, FolderLock, User, LogOut } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore.js";

export default function Navbar() {
  const location = useLocation();
  const { team, logout } = useAuthStore();

  return (
    <header className="glass-panel sticky top-0 z-50 border-b border-white/10 mb-6 backdrop-blur-xl">
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
          <Link
            to="/board"
            className={`px-3 py-1.5 rounded-lg transition-all ${
              location.pathname === "/board"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Terminal size={14} /> Case Board
            </span>
          </Link>

          <Link
            to="/leaderboard"
            className={`px-3 py-1.5 rounded-lg transition-all ${
              location.pathname === "/leaderboard"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Award size={14} /> Leaderboard
            </span>
          </Link>

          {team && (
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-white/10 text-slate-300">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-cyan-300 font-bold max-w-[130px] truncate">{team.teamName}</span>
              <span className="text-[10px] text-slate-500">({team.regNo})</span>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
