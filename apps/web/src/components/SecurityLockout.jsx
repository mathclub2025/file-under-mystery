import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, RefreshCw, Lock, AlertTriangle } from "lucide-react";
import { isDevToolsOpen } from "../lib/antiInspect.js";

export default function SecurityLockout() {
  const navigate = useNavigate();
  const [devToolsActive, setDevToolsActive] = useState(true);

  useEffect(() => {
    const checkState = () => {
      const isOpen = isDevToolsOpen();
      setDevToolsActive(isOpen);
    };

    checkState();
    const interval = setInterval(checkState, 400);
    window.addEventListener("resize", checkState);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", checkState);
    };
  }, []);

  const handleResume = () => {
    if (isDevToolsOpen()) {
      setDevToolsActive(true);
      return;
    }

    const lastRoute = sessionStorage.getItem("mystery_last_active_route") || "/";
    navigate(lastRoute, { replace: true });
  };

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="h-screen w-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center font-mono select-none"
    >
      <div className="max-w-md w-full bg-[#0d0709] border-2 border-rose-500/40 rounded-3xl p-8 shadow-[0_0_60px_rgba(244,63,94,0.2)] flex flex-col items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-rose-950/80 border border-rose-500/50 flex items-center justify-center text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)] animate-pulse">
          <ShieldAlert size={32} />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="text-[10px] text-rose-400 uppercase tracking-widest font-bold flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            SECURITY AUDIT // BREACH DETECTED
          </div>
          <h1 className="text-lg sm:text-xl font-black text-white tracking-wide">
            DEVTOOLS INSPECTION BLOCKED
          </h1>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Developer tools and DOM inspection are strictly forbidden during the Marrow Protocol investigation. Close all developer tools windows and tabs to unlock the terminal.
        </p>

        {devToolsActive ? (
          <div className="w-full p-3 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center justify-center gap-2">
            <Lock size={14} />
            <span>Developer Tools Currently Open</span>
          </div>
        ) : (
          <div className="w-full p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
            <RefreshCw size={14} className="text-emerald-400" />
            <span>DevTools Closed // Ready to Resume</span>
          </div>
        )}

        <button
          onClick={handleResume}
          disabled={devToolsActive}
          className={`w-full py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            devToolsActive
              ? "bg-white/10 text-slate-500 cursor-not-allowed border border-white/5"
              : "bg-white hover:bg-slate-200 text-black cursor-pointer shadow-[0_0_25px_rgba(255,255,255,0.25)]"
          }`}
        >
          <RefreshCw size={14} className={devToolsActive ? "" : "animate-spin"} />
          <span>
            {devToolsActive
              ? "Close DevTools to Unlock"
              : "Resume Investigation Terminal"}
          </span>
        </button>

        <div className="text-[9px] text-slate-600 uppercase tracking-widest">
          VIT MATHEMATICS CLUB FORENSIC SECURITY SYSTEM
        </div>
      </div>
    </div>
  );
}
