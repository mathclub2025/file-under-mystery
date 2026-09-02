import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Coffee, Trophy, ShieldCheck, ArrowRight, Loader2, Award, FolderLock, BarChart3, LogOut } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore.js";
import { useGameStore } from "../store/useGameStore.js";
import { apiGetEventStatus } from "../lib/api.js";
import LeaderboardModal from "./LeaderboardModal.jsx";
import EvidenceVaultModal from "./EvidenceVaultModal.jsx";

export default function RefreshmentScreen() {
  const navigate = useNavigate();
  const { team, logout } = useAuthStore();
  const { getScore, solvedLevels } = useGameStore();

  const [isResuming, setIsResuming] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showVault, setShowVault] = useState(false);

  // Stop any lingering speech synthesis on mount
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // Poll event status: auto-resume to level7 as soon as Phase 2 is unlocked
  useEffect(() => {
    let isMounted = true;

    const checkPhase2 = async () => {
      try {
        const res = await apiGetEventStatus();
        if (res && res.success && isMounted) {
          if (res.phase2Unlocked !== false) {
            setIsResuming(true);
            setTimeout(() => {
              if (isMounted) {
                navigate("/investigate/level7", { replace: true });
              }
            }, 1200);
          }
        }
      } catch (e) {}
    };

    checkPhase2();
    const interval = setInterval(checkPhase2, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const currentScore = getScore();
  const solvedCount = Object.keys(solvedLevels || {}).filter((k) => solvedLevels[k]).length;

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="min-h-screen w-full bg-black text-slate-100 flex flex-col justify-between p-4 sm:p-8 font-mono select-none relative overflow-hidden"
    >
      {/* Background Ambient Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Bar */}
      <header className="flex items-center justify-between z-10 max-w-5xl mx-auto w-full border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <span className="text-white font-extrabold text-sm tracking-wide">
            {team?.teamName || team?.team_name || "Investigator"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowVault(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 transition-all cursor-pointer"
          >
            <FolderLock size={13} />
            <span className="hidden sm:inline">Phase 1 Vault</span>
          </button>
          <button
            onClick={() => setShowLeaderboard(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-amber-400 transition-all cursor-pointer"
          >
            <BarChart3 size={13} />
            <span className="hidden sm:inline">Leaderboard</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-rose-950/40 border border-white/10 hover:border-rose-500/40 text-xs text-slate-400 hover:text-rose-300 transition-all cursor-pointer"
          >
            <LogOut size={13} />
          </button>
        </div>
      </header>

      {/* Main Refreshment Break Container */}
      <main className="flex-1 flex items-center justify-center my-6 z-10">
        <div className="bg-[#0b0b0e] border border-amber-500/30 rounded-3xl p-6 sm:p-10 max-w-lg w-full flex flex-col items-center text-center gap-6 shadow-[0_0_60px_rgba(245,158,11,0.12)] relative">
          
          {/* Animated Break Badge Icon */}
          <div className="relative">
            <div className="w-16 h-16 rounded-3xl bg-amber-950/80 border border-amber-500/50 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.3)]">
              <Coffee size={32} className="text-amber-400 animate-pulse" />
            </div>
            <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-emerald-950 border border-emerald-400">
              <ShieldCheck size={12} className="text-emerald-400" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-amber-400/90 font-bold uppercase tracking-widest flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              PHASE 1 COMPLETED // REFRESHMENT BREAK
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
              OPERATIONS TEMPORARILY PAUSED
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed mt-1">
              Outstanding work, operatives! All evidence from Phase 1 has been cataloged and your score is secured. Enjoy your refreshments and take a break.
            </p>
          </div>

          {/* Stats Box */}
          <div className="w-full bg-white/5 rounded-2xl border border-white/10 p-4 flex flex-col gap-3 text-left">
            <div className="flex items-center justify-between text-xs border-b border-white/10 pb-2">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Trophy size={14} className="text-amber-400" /> Current Score:
              </span>
              <span className="text-white font-extrabold text-sm">{currentScore} PTS</span>
            </div>
            <div className="flex items-center justify-between text-xs border-b border-white/10 pb-2">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Award size={14} className="text-cyan-400" /> Progress:
              </span>
              <span className="text-cyan-300 font-bold">{solvedCount} of 13 Cases Solved</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Next Assignment:</span>
              <span className="text-amber-300 font-bold">Level 7: The Transposition Matrix</span>
            </div>
          </div>

          {/* Live Standby / Resuming Indicator */}
          {isResuming ? (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-950/80 border border-emerald-400/60 text-emerald-300 text-xs font-bold animate-pulse w-full justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <Loader2 size={16} className="animate-spin text-emerald-400" />
              <span>PHASE 2 AUTHORIZED — ENTERING LEVEL 7...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 text-xs text-slate-400">
              <Loader2 size={14} className="animate-spin text-amber-400" />
              <span>Phase 2 will automatically resume here once unlocked by Admin...</span>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-[10px] text-zinc-600 z-10">
        DEPARTMENT OF MATHEMATICS &bull; FILE UNDER MYSTERY
      </footer>

      {/* Modals */}
      {showLeaderboard && (
        <LeaderboardModal onClose={() => setShowLeaderboard(false)} currentLevelId="level6" />
      )}
      {showVault && (
        <EvidenceVaultModal onClose={() => setShowVault(false)} currentLevelId="level6" />
      )}
    </div>
  );
}
