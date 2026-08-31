import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ShieldAlert, RefreshCw, Lock, AlertTriangle, Clock } from "lucide-react";
import { isDevToolsOpen } from "../lib/antiInspect.js";

export default function SecurityLockout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reason = searchParams.get("reason") || sessionStorage.getItem("mystery_lockout_reason") || "devtools";

  const [devToolsActive, setDevToolsActive] = useState(true);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  useEffect(() => {
    const lockoutUntil = Number(sessionStorage.getItem("mystery_lockout_until") || 0);
    const now = Date.now();
    if (lockoutUntil > now) {
      setCooldownRemaining(Math.ceil((lockoutUntil - now) / 1000));
    }

    const timer = setInterval(() => {
      const currentLockout = Number(sessionStorage.getItem("mystery_lockout_until") || 0);
      const diff = Math.max(0, Math.ceil((currentLockout - Date.now()) / 1000));
      setCooldownRemaining(diff);
    }, 500);

    const checkState = () => {
      const isOpen = isDevToolsOpen();
      setDevToolsActive(isOpen);
    };

    checkState();
    const interval = setInterval(checkState, 400);
    window.addEventListener("resize", checkState);

    return () => {
      clearInterval(interval);
      clearInterval(timer);
      window.removeEventListener("resize", checkState);
    };
  }, []);

  const isLocked = (reason === "devtools" && devToolsActive) || cooldownRemaining > 0;

  const handleResume = () => {
    if (isLocked) return;

    sessionStorage.removeItem("mystery_lockout_until");
    sessionStorage.removeItem("mystery_lockout_reason");
    const lastRoute = sessionStorage.getItem("mystery_last_active_route") || "/";
    navigate(lastRoute, { replace: true });
  };

  const isFocusLoss = reason === "focus_loss" || reason === "screenshot_attempt";

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
            SECURITY LOCKOUT // PROTOCOL VIOLATION
          </div>
          <h1 className="text-lg sm:text-xl font-black text-white tracking-wide">
            {isFocusLoss ? "EXTERNAL CAPTURE DETECTED" : "INSPECTION BLOCKED"}
          </h1>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          {isFocusLoss
            ? "Your terminal lost focus or an external screen capture shortcut (Win+Shift+S / Snipping Tool / App switch) was intercepted. Focus must be maintained throughout the investigation."
            : "Developer tools and DOM inspection are strictly forbidden during the Marrow Protocol investigation. Close all developer tools windows to unlock the terminal."}
        </p>

        {isFocusLoss ? (
          cooldownRemaining > 0 ? (
            <div className="w-full p-3 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center justify-center gap-2">
              <Clock size={14} className="animate-spin text-rose-400" />
              <span>Security Cooldown: {cooldownRemaining}s remaining</span>
            </div>
          ) : (
            <div className="w-full p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
              <RefreshCw size={14} className="text-emerald-400" />
              <span>Terminal Focus Verified // Ready to Resume</span>
            </div>
          )
        ) : devToolsActive ? (
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
          disabled={isLocked}
          className={`w-full py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            isLocked
              ? "bg-white/10 text-slate-500 cursor-not-allowed border border-white/5"
              : "bg-white hover:bg-slate-200 text-black cursor-pointer shadow-[0_0_25px_rgba(255,255,255,0.25)]"
          }`}
        >
          <RefreshCw size={14} className={isLocked ? "" : "animate-spin"} />
          <span>
            {isLocked
              ? isFocusLoss
                ? `Lockout Active (${cooldownRemaining}s)`
                : "Close DevTools to Unlock"
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
