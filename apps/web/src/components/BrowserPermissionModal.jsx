import React, { useState, useEffect } from "react";
import { ShieldCheck, Volume2, Cpu, ArrowRight, Radio } from "lucide-react";

export default function BrowserPermissionModal() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isAuthorized = sessionStorage.getItem("mystery_browser_authorized");
    if (!isAuthorized) {
      setIsVisible(true);
    }
  }, []);

  const handleAuthorize = async () => {
    try {
      // 1. Unlock Web Audio Context for DSP and BGM
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        if (ctx.state === "suspended") {
          await ctx.resume();
        }
        // Play brief silent pulse to satisfy browser autoplay policy
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        gain.gain.value = 0.001;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      }

      // 2. Pre-warm Speech Synthesis Voice Engine
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.getVoices();
        const dummyUtter = new SpeechSynthesisUtterance("");
        dummyUtter.volume = 0.001;
        window.speechSynthesis.speak(dummyUtter);
      }

      // 3. Trigger global pointer interaction to start BGM smoothly
      window.dispatchEvent(new CustomEvent("pointerdown"));
      window.dispatchEvent(new CustomEvent("click"));

      // 4. Test Clipboard Permission for Screenshot Protection
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText("⚠️ CLASSIFIED: FILE UNDER MYSTERY EVIDENCE.").catch(() => {});
      }
    } catch (e) {
      console.warn("Hardware permission initialization notice:", e);
    }

    sessionStorage.setItem("mystery_browser_authorized", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 font-mono select-none animate-in fade-in duration-300">
      <div className="bg-[#0a0a0c] border border-white/20 rounded-3xl max-w-md w-full p-6 sm:p-7 flex flex-col gap-5 shadow-[0_0_50px_rgba(0,0,0,0.95)] relative overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="p-2 rounded-2xl bg-white/10 border border-white/20 text-cyan-300 shadow-md">
            <ShieldCheck size={22} className="text-cyan-400 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-400 font-bold tracking-widest uppercase">
              DEPARTMENT OF MATHEMATICS
            </span>
            <h2 className="text-sm sm:text-base font-extrabold text-white tracking-wide">
              FORENSIC SYSTEM INITIALIZATION
            </h2>
          </div>
        </div>

        {/* Briefing Note */}
        <p className="text-xs text-slate-300 leading-relaxed">
          To ensure uninterrupted DSP audio spectrogram filtering, synthesized audio briefings, and forensic evidence security, please initialize browser permissions.
        </p>

        {/* Permissions Subsystems Checklist */}
        <div className="flex flex-col gap-2.5 bg-white/5 p-3.5 rounded-2xl border border-white/10 text-xs">
          <div className="flex items-center gap-2.5 text-slate-200">
            <Volume2 size={15} className="text-cyan-400 shrink-0" />
            <span className="text-[11px] font-bold">Web Audio DSP & Spectral Subsystem</span>
          </div>
          <div className="flex items-center gap-2.5 text-slate-200">
            <Radio size={15} className="text-cyan-400 shrink-0" />
            <span className="text-[11px] font-bold">Speech Synthesis Briefing Audio</span>
          </div>
          <div className="flex items-center gap-2.5 text-slate-200">
            <Cpu size={15} className="text-cyan-400 shrink-0" />
            <span className="text-[11px] font-bold">Anti-Tamper & Clipboard Evidence Shield</span>
          </div>
        </div>

        {/* Initialize Action Button */}
        <button
          onClick={handleAuthorize}
          className="w-full py-3.5 px-6 rounded-2xl bg-white hover:bg-slate-200 text-black font-extrabold text-xs tracking-wider uppercase transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
        >
          <span>INITIALIZE & ENTER TERMINAL</span>
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
