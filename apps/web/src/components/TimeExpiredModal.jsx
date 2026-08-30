import React from "react";
import { AlertTriangle, Clock, ArrowRight, BookOpen, Key, Check } from "lucide-react";
import { useGameStore, LEVEL_FINDINGS } from "../store/useGameStore.js";

export default function TimeExpiredModal({ levelConfig, onProceed }) {
  const { levelScores, getLevelHintDeductions } = useGameStore();
  const hintCost = getLevelHintDeductions(levelConfig.id);
  const earnedFloor = levelScores[levelConfig.id] !== undefined ? levelScores[levelConfig.id] : Math.max(0, 10 - hintCost);
  const finding = LEVEL_FINDINGS[levelConfig.id];
  const tokenToShow = finding?.token || "VERIFIED";
  const memoToShow = levelConfig.notebookFragment || finding?.note;

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="fixed inset-0 bg-black/90 backdrop-blur-lg z-50 flex items-center justify-center p-4 animate-fade-in font-mono select-none"
    >
      <div className="bg-[#120808] border-2 border-rose-500/50 rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-[0_0_50px_rgba(244,63,94,0.25)] flex flex-col gap-5">
        {/* Banner */}
        <div className="flex items-center gap-3.5 border-b border-rose-500/20 pb-4">
          <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/50 text-rose-400 animate-pulse">
            <Clock size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-rose-400 font-extrabold text-sm sm:text-base tracking-wider uppercase">
                CASE FAILED // TIME EXPIRED
              </span>
              <span className="px-2 py-0.5 rounded bg-rose-950 border border-rose-500/40 text-rose-300 text-[10px] font-bold">
                +{earnedFloor} PTS (FLOOR)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              The operational time limit for this case has ended. Floor points recorded based on hint usage.
            </p>
          </div>
        </div>

        {/* Revealed Solution Card */}
        <div className="flex flex-col gap-3 p-4 rounded-2xl bg-black/60 border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
              <Key size={14} className="text-rose-400" />
              Emergency Decrypted Token:
            </span>
            <span className="text-xs font-black tracking-widest text-rose-300 bg-rose-950/60 px-3 py-1 rounded-xl border border-rose-500/40 uppercase">
              {tokenToShow}
            </span>
          </div>

          <div className="border-t border-white/10 pt-3">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1 flex items-center gap-1">
              <BookOpen size={12} className="text-white" />
              Forensic Analysis & Findings:
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              {levelConfig.solutionExplanation ||
                "The signal and telemetry parameters have been recorded under emergency protocol. The diary fragment has been logged into your Case Vault."}
            </p>
          </div>
        </div>

        {/* Lore Note */}
        {memoToShow && (
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-[11px] text-slate-200 italic font-sans">
            "{memoToShow}"
          </div>
        )}

        {/* Proceed Action */}
        <button
          onClick={onProceed}
          className="w-full py-3.5 rounded-2xl bg-white hover:bg-slate-200 text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(255,255,255,0.25)] flex items-center justify-center gap-2 cursor-pointer group"
        >
          <span>Record Findings in Vault & Proceed &rarr;</span>
          <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
