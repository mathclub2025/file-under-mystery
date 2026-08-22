import React from "react";
import { X, BookOpen, KeyRound, ShieldCheck, Lock, Award } from "lucide-react";
import { useGameStore } from "../store/useGameStore.js";
import { useAuthStore } from "../store/useAuthStore.js";

// Level Configs
import level1 from "../levels/level1/config.js";
import level2 from "../levels/level2/config.js";
import level3 from "../levels/level3/config.js";
import level4 from "../levels/level4/config.js";
import level5 from "../levels/level5/config.js";
import level6 from "../levels/level6/config.js";
import level7 from "../levels/level7/config.js";
import level8 from "../levels/level8/config.js";
import level9 from "../levels/level9/config.js";
import level10 from "../levels/level10/config.js";
import level11 from "../levels/level11/config.js";
import level12 from "../levels/level12/config.js";

const ALL_LEVELS = [
  level1, level2, level3, level4, level5, level6,
  level7, level8, level9, level10, level11, level12
];

export default function EvidenceVaultModal({ isOpen, onClose }) {
  const { solvedLevels } = useGameStore();
  const { team } = useAuthStore();

  if (!isOpen) return null;

  const solvedCount = Object.keys(solvedLevels).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in select-none">
      <div className="w-full max-w-4xl max-h-[88vh] flex flex-col bg-black border border-white/20 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden font-mono">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-slate-400">
              FORENSIC CASE VAULT // RECOVERED EVIDENCE DOSSIER
            </div>
            <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2 mt-0.5">
              <span>{team?.teamName || "Forensics Unit"}</span>
              <span className="text-xs text-slate-400 font-normal">({solvedCount} / 12 Levels Cleared)</span>
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Level Wise Findings Grid */}
        <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-4">
          {ALL_LEVELS.map((lvl, idx) => {
            const isSolved = !!solvedLevels[lvl.id];
            return (
              <div
                key={lvl.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isSolved
                    ? "bg-white/5 border-white/20 text-slate-200"
                    : "bg-black/40 border-white/5 text-slate-600"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <span className={`w-2 h-2 rounded-full ${isSolved ? "bg-white" : "bg-slate-700"}`}></span>
                    <span className={isSolved ? "text-white" : "text-slate-500"}>
                      LEVEL {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}: {lvl.title.toUpperCase()}
                    </span>
                  </div>

                  {isSolved ? (
                    <span className="px-2.5 py-1 bg-white text-black text-[10px] font-bold rounded-lg uppercase tracking-widest">
                      SOLVED // TOKEN: {lvl.correctAnswer}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] text-slate-600">
                      <Lock size={12} /> ENCRYPTED
                    </span>
                  )}
                </div>

                {isSolved ? (
                  <div className="mt-2 p-3 bg-black/80 rounded-xl border border-white/10 text-xs italic text-slate-300 leading-relaxed">
                    <div className="text-[10px] not-italic text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <BookOpen size={12} /> Decrypted Diary Memo:
                    </div>
                    "{lvl.notebookFragment}"
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-600 italic">
                    Evidence artifact quarantined in perimeter partition. Complete forensic analysis to decrypt finding.
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 pt-4 mt-4 flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">All findings stored in encrypted session storage.</span>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-all cursor-pointer"
          >
            Close Case Vault
          </button>
        </div>
      </div>
    </div>
  );
}
