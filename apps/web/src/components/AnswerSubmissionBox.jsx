import React, { useState, useEffect } from "react";
import { Send, CheckCircle2, XCircle, Terminal } from "lucide-react";
import { useGameStore } from "../store/useGameStore.js";

// Rotating neutral dummy placeholders that NEVER match real tokens
const RANDOM_PLACEHOLDERS = ["e.g. 7K#9X", "e.g. T4R8M", "e.g. 9B$2L", "e.g. X3W7P", "e.g. 5V#8Q"];

export default function AnswerSubmissionBox({ levelConfig, onSolveSuccess }) {
  const [guess, setGuess] = useState("");
  const [status, setStatus] = useState(null); // 'correct' | 'incorrect'
  const [placeholder, setPlaceholder] = useState("e.g. 7K#9X");

  const { isLevelSolved, markLevelSolved } = useGameStore();
  const solved = isLevelSolved(levelConfig.id);

  // Normalize expected tokens across all schemas
  const validAnswers = [
    levelConfig.correctAnswer,
    levelConfig.verificationToken,
    levelConfig.evidenceData?.solution
  ]
    .filter(Boolean)
    .map((s) => s.trim().toUpperCase());

  // For Level 5, also accept shorthand P0W3R if they type leetspeak
  if (levelConfig.id === "level5") {
    validAnswers.push("P0W3R");
  }

  useEffect(() => {
    setGuess("");
    setStatus(null);
    const rand = RANDOM_PLACEHOLDERS[Math.floor(Math.random() * RANDOM_PLACEHOLDERS.length)];
    setPlaceholder(rand);
  }, [levelConfig.id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanGuess = guess.trim().toUpperCase().replace(/[\s_-]/g, "");
    if (!cleanGuess) return;

    const isMatch = validAnswers.some((ans) => ans.replace(/[\s_-]/g, "") === cleanGuess);

    if (isMatch) {
      setStatus("correct");
      markLevelSolved(levelConfig.id);
      if (onSolveSuccess) {
        setTimeout(() => {
          onSolveSuccess();
        }, 1200);
      }
    } else {
      setStatus("incorrect");
    }
  };

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="p-4 font-mono text-xs flex flex-col justify-between select-none"
    >
      <div>
        {/* Universal Token Guidance Header Across All Levels */}
        <div className="flex flex-col gap-1 mb-2.5">
          <div className="text-[11px] uppercase tracking-widest text-slate-300 flex items-center justify-between font-bold">
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-white" />
              <span>VERIFICATION TERMINAL</span>
            </div>
            <span className="text-[10px] text-slate-400 font-normal">
              [ 5-DIGIT / 5-CHARACTER CODE ]
            </span>
          </div>
          <div className="text-[10px] text-slate-400 tracking-wide">
            5 digit code (mix of characters and digits) — Decode everything to get it
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2 mb-2.5">
          <input
            type="text"
            value={guess}
            onChange={(e) => {
              setGuess(e.target.value);
              if (status) setStatus(null);
            }}
            placeholder={placeholder}
            className="flex-1 bg-black border border-white/20 focus:border-white rounded-xl px-4 py-2.5 text-white uppercase focus:outline-none transition-all font-bold tracking-widest text-xs"
          />

          <button
            type="submit"
            className="px-6 py-2.5 bg-white hover:bg-slate-200 text-black font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] cursor-pointer text-xs"
          >
            <Send size={14} />
            <span>SUBMIT</span>
          </button>
        </form>
      </div>

      {(status === "correct" || solved) && (
        <div className="flex items-center gap-2 p-2.5 bg-white/10 border border-white/30 text-white font-bold rounded-xl animate-fade-in text-xs">
          <CheckCircle2 size={15} /> TOKEN VERIFIED // ADVANCING TO NEXT LEVEL...
        </div>
      )}

      {status === "incorrect" && !solved && (
        <div className="flex items-center gap-2 p-2.5 bg-black border border-white/20 text-slate-400 font-bold rounded-xl animate-fade-in text-xs">
          <XCircle size={15} /> INVALID TOKEN // VERIFICATION FAILED
        </div>
      )}
    </div>
  );
}
