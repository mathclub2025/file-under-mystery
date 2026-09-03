import React, { useEffect, useState } from "react";
import { X, BookOpen, Lock, CheckCircle2, Shield } from "lucide-react";
import { useGameStore, LEVEL_FINDINGS } from "../store/useGameStore.js";
import { useAuthStore } from "../store/useAuthStore.js";
import { apiGetSolutionMemo } from "../lib/api.js";

// Minimal Level List Metadata
const LEVEL_LIST = [
  { id: "level1", title: "Evidence Item #01: The Photograph", basePoints: 20 },
  { id: "level2", title: "Evidence Item #02: The Voicemail", basePoints: 20 },
  { id: "level3", title: "Evidence Item #03: The Recording", basePoints: 20 },
  { id: "level4", title: "Evidence Item #04: The Holiday Photo", basePoints: 20 },
  { id: "level5", title: "Evidence Item #05: The Cipher Machine", basePoints: 20 },
  { id: "level6", title: "Evidence Item #06: Network Protocol Capture", basePoints: 20 },
  { id: "level7", title: "Evidence Item #07: The Corrupted Document", basePoints: 20 },
  { id: "level8", title: "Evidence Item #08: The Harmonic Signal", basePoints: 20 },
  { id: "level9", title: "Evidence Item #09: Celestial Astrometry", basePoints: 20 },
  { id: "level10", title: "Evidence Item #10: Cellular Automata", basePoints: 20 },
  { id: "level11", title: "Evidence Item #11: Differential Audio", basePoints: 20 },
  { id: "level12", title: "Evidence Item #12: Campus Topology Graph", basePoints: 20 },
  { id: "final", title: "Phase IV: Meta-Assembly Hardware Boot", basePoints: 20 }
];

export default function EvidenceVaultModal({ isOpen = true, onClose, currentLevelId }) {
  const { solvedLevels, timedOutLevels, levelScores, getSolvedCount, getScore, solvedTokens, levelMemos } = useGameStore();
  const { team } = useAuthStore();
  const [fetchedMemos, setFetchedMemos] = useState({});

  if (isOpen === false) return null;

  const solvedCount = getSolvedCount();
  const netScore = getScore();

  useEffect(() => {
    // Fetch memos on-demand ONLY for solved levels if not already cached
    LEVEL_LIST.forEach(async (lvl) => {
      if (solvedLevels[lvl.id] && !levelMemos[lvl.id] && !fetchedMemos[lvl.id]) {
        try {
          const res = await apiGetSolutionMemo(lvl.id);
          if (res && res.success && res.memo) {
            setFetchedMemos((prev) => ({ ...prev, [lvl.id]: res.memo }));
          }
        } catch (e) {}
      }
    });
  }, [solvedLevels, levelMemos]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-xl animate-fade-in select-none font-mono">
      <div className="w-full max-w-4xl max-h-[88vh] flex flex-col bg-[#0a0a0c] border border-white/15 rounded-3xl p-5 sm:p-7 shadow-2xl overflow-hidden">
        {/* Header matching Docs style */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
              <BookOpen size={18} className="text-white" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                FORENSIC CASE VAULT &bull; RECOVERED DOSSIER
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide mt-0.5">
                {team?.teamName || "Forensics Unit"}{" "}
                <span className="text-xs text-slate-400 font-normal">
                  ({solvedCount} / 13 Cleared &bull; {netScore} PTS)
                </span>
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors cursor-pointer border border-white/10"
          >
            <X size={18} />
          </button>
        </div>

        {/* Level Wise Findings Grid */}
        <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3">
          {LEVEL_LIST.map((lvl, idx) => {
            const isTimedOut = !!timedOutLevels?.[lvl.id];
            const isSolved = !!solvedLevels?.[lvl.id] && !isTimedOut;
            const isOngoing = !solvedLevels?.[lvl.id] && lvl.id === currentLevelId;
            const isNotVisited = !solvedLevels?.[lvl.id] && !isTimedOut && lvl.id !== currentLevelId;
            const hasFindings = isSolved || isTimedOut;

            const awardedScore = levelScores[lvl.id];
            const isFinal = lvl.id === "final";
            const memo = levelMemos[lvl.id] || fetchedMemos[lvl.id];

            return (
              <div
                key={lvl.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isSolved
                    ? "bg-white/[0.04] border-white/20 text-slate-200"
                    : isTimedOut
                    ? "bg-rose-950/20 border-rose-500/30 text-rose-200"
                    : isOngoing
                    ? "bg-white/[0.06] border-white/30 text-white"
                    : "bg-white/[0.01] border-white/10 text-slate-600"
                }`}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5 font-bold text-xs">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isSolved
                          ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                          : isTimedOut
                          ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"
                          : isOngoing
                          ? "bg-white animate-pulse"
                          : "bg-slate-700"
                      }`}
                    />
                    <span className={hasFindings ? "text-white font-bold" : "text-slate-400"}>
                      {isFinal
                        ? "PHASE IV: META-ASSEMBLY"
                        : `CASE #${idx + 1 < 10 ? `0${idx + 1}` : idx + 1}: ${lvl.title.toUpperCase()}`}
                    </span>

                    {/* 4 Clean State Badges */}
                    {isSolved && (
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold tracking-wider">
                        FINISHED
                      </span>
                    )}
                    {isTimedOut && (
                      <span className="px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px] font-bold tracking-wider">
                        FAILED
                      </span>
                    )}
                    {isOngoing && (
                      <span className="px-2 py-0.5 rounded-lg bg-white text-black text-[9px] font-extrabold border border-white tracking-wider animate-pulse">
                        ONGOING
                      </span>
                    )}
                    {isNotVisited && (
                      <span className="px-2 py-0.5 rounded-lg bg-white/5 text-slate-500 border border-white/10 text-[9px] font-bold tracking-wider">
                        NOT VISITED YET
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {hasFindings ? (
                      <>
                        <span className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-xl uppercase tracking-widest flex items-center gap-1.5 shadow-sm ${
                          isSolved
                            ? "bg-white/10 border border-white/20 text-white"
                            : "bg-rose-950/60 border border-rose-500/40 text-rose-300"
                        }`}>
                          <CheckCircle2 size={12} className={isSolved ? "text-emerald-400" : "text-rose-400"} />
                          <span>TOKEN:</span>
                          <strong className="text-white font-mono font-black tracking-wider text-[11px]">
                            {(solvedTokens?.[lvl.id] && solvedTokens[lvl.id] !== "VERIFIED" && solvedTokens[lvl.id] !== "SECURED")
                              ? solvedTokens[lvl.id]
                              : LEVEL_FINDINGS[lvl.id]?.token || "SECURED"}
                          </strong>
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-white/5 text-slate-300 border border-white/10 text-[10px] font-bold">
                          +{awardedScore !== undefined ? awardedScore : (isSolved ? lvl.basePoints : 10)} PTS
                        </span>
                      </>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Lock size={12} /> {isOngoing ? "ANALYZING..." : "ENCRYPTED"} (+{lvl.basePoints} PTS)
                      </span>
                    )}
                  </div>
                </div>

                {hasFindings ? (
                  <div className="mt-3 p-3.5 bg-black/60 rounded-xl border border-white/10 text-xs text-slate-300 leading-relaxed flex flex-col gap-2">
                    <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-white/10 pb-2">
                      <div className="text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-bold">
                        <BookOpen size={12} className="text-white" />
                        <span>{isSolved ? "DECRYPTED MARROW MEMO:" : "EMERGENCY RECOVERED MEMO (FAILED CASE):"}</span>
                      </div>
                      <div className="text-[10px] font-mono font-bold text-white px-2 py-0.5 rounded-md bg-white/10 border border-white/20 flex items-center gap-1">
                        <span className="text-zinc-400 font-normal">CLEARED TOKEN:</span>
                        <span className="text-white font-black">
                          {(solvedTokens?.[lvl.id] && solvedTokens[lvl.id] !== "VERIFIED" && solvedTokens[lvl.id] !== "SECURED")
                            ? solvedTokens[lvl.id]
                            : LEVEL_FINDINGS[lvl.id]?.token || "SECURED"}
                        </span>
                      </div>
                    </div>
                    <p className="italic text-slate-200 font-sans text-xs">
                      "{typeof memo === "string" ? memo : memo?.notebookFragment || memo?.memo || memo?.solutionExplanation || LEVEL_FINDINGS[lvl.id]?.note || "Evidence fragment logged into blackbox telemetry."}"
                    </p>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-600 italic mt-2">
                    Evidence artifact quarantined in perimeter partition. Complete laboratory analysis to unlock diary fragment.
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 pt-4 mt-4 flex items-center justify-end text-xs shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-all cursor-pointer shadow"
          >
            Close Case Vault
          </button>
        </div>
      </div>
    </div>
  );
}
