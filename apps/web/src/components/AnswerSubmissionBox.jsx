import React, { useState, useEffect } from "react";
import { Send, CheckCircle2, XCircle, Terminal } from "lucide-react";
import { useGameStore } from "../store/useGameStore.js";
import { apiVerifyToken } from "../lib/api.js";

// Rotating neutral dummy placeholders that NEVER match real tokens
const RANDOM_PLACEHOLDERS = ["e.g. 7K#9X", "e.g. T4R8M", "e.g. 9B$2L", "e.g. X3W7P", "e.g. 5V#8Q"];

export default function AnswerSubmissionBox({ levelConfig, onSolveSuccess }) {
  const [guess, setGuess] = useState("");
  const [status, setStatus] = useState(null); // 'correct' | 'incorrect'
  const [placeholder, setPlaceholder] = useState("e.g. 7K#9X");
  const [awardedPoints, setAwardedPoints] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [honeypotMsg, setHoneypotMsg] = useState("");

  const { isLevelSolved, isLevelTimedOut, markLevelSolved, getEarnablePoints, getRemainingSeconds, levelScores } = useGameStore();
  const solved = isLevelSolved(levelConfig.id);
  const timedOut = isLevelTimedOut(levelConfig.id);
  const existingScore = levelScores[levelConfig.id];

  useEffect(() => {
    setGuess("");
    setStatus(null);
    setAwardedPoints(null);
    const rand = RANDOM_PLACEHOLDERS[Math.floor(Math.random() * RANDOM_PLACEHOLDERS.length)];
    setPlaceholder(rand);
  }, [levelConfig.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (solved || timedOut || isVerifying) return;
    const cleanGuess = guess.trim().toUpperCase().replace(/[\s_-]/g, "");
    if (!cleanGuess) return;

    setIsVerifying(true);
    try {
      const dur = levelConfig.durationSeconds || 1500;
      const earnable = getEarnablePoints(
        levelConfig.id,
        levelConfig.basePoints || 20,
        dur
      );

      const remSeconds = getRemainingSeconds(levelConfig.id, dur);
      const spentSeconds = Math.max(0, dur - remSeconds);

      let teamId = null;
      try {
        const teamObj = JSON.parse(localStorage.getItem("mystery_team_session") || "{}");
        teamId = teamObj.id;
      } catch (e) {}

      // Server-side verification
      const res = await apiVerifyToken({
        teamId,
        levelId: levelConfig.id,
        guess: cleanGuess,
        pointsAwarded: earnable,
        remainingSeconds: remSeconds,
        timeSpentSeconds: spentSeconds
      });

      if (res && res.success) {
        setAwardedPoints(earnable);
        setStatus("correct");
        markLevelSolved(
          levelConfig.id,
          earnable,
          res.verifiedToken || cleanGuess,
          {
            solutionExplanation: res.solutionExplanation,
            notebookFragment: res.notebookFragment
          }
        );

        if (onSolveSuccess) {
          setTimeout(() => {
            onSolveSuccess();
          }, 1400);
        }
      } else if (res && res.honeypot) {
        setHoneypotMsg(res.message || "⚠️ AI DETECTED // Nice try with ChatGPT/Gemini, but this is a tracked decoy code! We see you — solve the forensics yourself on the workbench.");
        setStatus("honeypot");
      } else if (res && res.error && res.error.includes("RATE LIMIT")) {
        setStatus("rate_limited");
      } else {
        setStatus("incorrect");
      }
    } catch (err) {
      console.warn("Verification warning:", err);
      setStatus("incorrect");
    } finally {
      setIsVerifying(false);
    }
  };

  const pointsToShow =
    awardedPoints !== null
      ? awardedPoints
      : existingScore !== undefined
      ? existingScore
      : levelConfig.basePoints || 20;

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
            5 digit code (mix of characters and digits) &mdash; Decode everything to get it
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2 mb-2.5">
          <input
            type="text"
            disabled={solved || timedOut}
            value={guess}
            onChange={(e) => {
              setGuess(e.target.value);
              if (status) setStatus(null);
            }}
            placeholder={solved ? "CASE COMPLETED" : timedOut ? "CASE CLOSED // TIME EXPIRED" : placeholder}
            className="flex-1 bg-black border border-white/20 focus:border-white disabled:opacity-60 rounded-xl px-4 py-2.5 text-white uppercase focus:outline-none transition-all font-bold tracking-widest text-xs"
          />

          <button
            type="submit"
            disabled={solved || timedOut || isVerifying}
            className="px-6 py-2.5 bg-white hover:bg-slate-200 disabled:opacity-50 text-black font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] cursor-pointer text-xs"
          >
            <Send size={14} />
            <span>{isVerifying ? "VERIFYING..." : "SUBMIT"}</span>
          </button>
        </form>
      </div>

      {(status === "correct" || solved) && (
        <div className="flex items-center justify-between p-2.5 bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 font-bold rounded-xl animate-fade-in text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-400" />
            <span>TOKEN VERIFIED // ADVANCING TO NEXT LEVEL...</span>
          </div>
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-black border border-emerald-500/30">
            +{pointsToShow} PTS
          </span>
        </div>
      )}

      {status === "honeypot" && !solved && (
        <div className="flex items-center gap-2 p-2.5 bg-amber-950/90 border border-amber-500/50 text-amber-200 font-bold rounded-xl animate-fade-in text-xs leading-relaxed">
          <XCircle size={16} className="text-amber-400 shrink-0" />
          <span>{honeypotMsg || "⚠️ AI DETECTED // Nice try with ChatGPT/Gemini, but this is a tracked decoy code! We see you — solve the forensics yourself on the workbench."}</span>
        </div>
      )}

      {status === "rate_limited" && !solved && (
        <div className="flex items-center gap-2 p-2.5 bg-rose-950/80 border border-rose-500/40 text-rose-200 font-bold rounded-xl animate-fade-in text-xs">
          <XCircle size={15} className="text-rose-400" />
          <span>RATE LIMIT EXCEEDED // MAXIMUM 6 ATTEMPTS PER 30 SECONDS</span>
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
