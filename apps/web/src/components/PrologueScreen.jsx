import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Terminal, Shield, ArrowRight, Play, Pause, ChevronLeft, ChevronRight, Volume2, VolumeX } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore.js";

const STORY_LINES = [
  "October 14, 2026. Department of Mathematics.",
  "Dr. Elias Marrow, Senior Faculty in Theoretical Mathematics, has vanished.",
  "His campus office in Room 418 was found completely deserted.",
  "For twenty-four years, Marrow was the quiet pillar of mathematical rigor.",
  "Eight months ago, he formulated what colleagues termed The Marrow Conjecture.",
  "He claimed prime distributions and entropy were not chaotic anomalies...",
  "But deterministic harmonic projections of a single unified matrix transformation.",
  "In the wrong hands, his equations could collapse global asymmetric encryption.",
  "On the night of his disappearance, campus cameras tracked him into the perimeter woods.",
  "In Room 418, all chalkboards had been scrubbed clean.",
  "On his desk sat a single air-gapped solid-state drive labeled BLACKBOX.DAT.",
  "Standard recovery tools failed. The drive refused master decryption keys.",
  "Its firmware broadcasted a single message: A proof is not given; it is earned.",
  "The drive has released twelve encrypted pieces of mathematical and forensic evidence.",
  "Along with each evidence artifact comes an encrypted fragment from his lost handwritten diary.",
  "No single fragment can be solved in isolation.",
  "Your team has been authorized as the official Forensics Unit.",
  "Level 01: The Photograph has been decrypted and is ready for inspection."
];

export default function PrologueScreen({ onStartInvestigation }) {
  const navigate = useNavigate();
  const { team, setTeam } = useAuthStore();

  const [regNo, setRegNo] = useState("");
  const [teamName, setTeamName] = useState("");
  const [captainName, setCaptainName] = useState("");
  const [step, setStep] = useState("register"); // 'register' | 'cinema'

  // Cinematic Engine State
  const [activeLineIdx, setActiveLineIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const audioRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("mystery_team_session");
    if (saved) {
      try {
        setTeam(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const handleRegister = (e) => {
    e.preventDefault();
    if (!regNo.trim() || !teamName.trim()) return;

    const teamData = {
      regNo: regNo.trim().toUpperCase(),
      teamName: teamName.trim(),
      captainName: captainName.trim() || "Lead Investigator",
      registeredAt: new Date().toISOString()
    };

    localStorage.setItem("mystery_team_session", JSON.stringify(teamData));
    setTeam(teamData);
    setStep("cinema");
    setActiveLineIdx(0);
    setIsPlaying(true);
  };

  // Play Studio Natural Human Speech MP3 and Immediately Advance on End (0ms delay)
  const playStudioAudio = (idx) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (!voiceEnabled) return;

    const audioUrl = `/audio/prologue_${idx}.mp3`;
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.onended = () => {
      // Instantly advance to the next line with zero waiting delay!
      if (isPlaying) {
        setActiveLineIdx((prev) => {
          if (prev < STORY_LINES.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }
    };

    audio.onerror = () => {
      if (isPlaying) {
        setTimeout(() => {
          setActiveLineIdx((prev) => (prev < STORY_LINES.length - 1 ? prev + 1 : prev));
        }, 2800);
      }
    };

    audio.play().catch(() => {});
  };

  useEffect(() => {
    if (step !== "cinema") return;
    playStudioAudio(activeLineIdx);

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [step, activeLineIdx, isPlaying, voiceEnabled]);

  const handlePrevLine = () => {
    if (audioRef.current) audioRef.current.pause();
    setActiveLineIdx((prev) => Math.max(0, prev - 1));
  };

  const handleNextLine = () => {
    if (audioRef.current) audioRef.current.pause();
    if (activeLineIdx < STORY_LINES.length - 1) {
      setActiveLineIdx((prev) => prev + 1);
    } else {
      handleEnterLab();
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      if (audioRef.current) audioRef.current.play();
      else playStudioAudio(activeLineIdx);
    }
  };

  const handleEnterLab = () => {
    if (audioRef.current) audioRef.current.pause();
    if (onStartInvestigation) onStartInvestigation();
    navigate("/investigate/level1");
  };

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="w-full min-h-[95vh] flex items-center justify-center select-none px-4 relative overflow-hidden"
    >
      {/* Background Looping Atmospheric Script Video for Prologue */}
      {step === "cinema" && (
        <div className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
          <video
            src="/script_bg/prologue.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-40 brightness-40 contrast-125 scale-105"
          />
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
        </div>
      )}

      {step === "register" ? (
        /* Frameless Clean Registration Form */
        <div className="w-full max-w-lg p-8 relative z-10 overflow-hidden animate-rise-up flex flex-col gap-6">
          <div className="animate-float-live flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white/10 text-white">
                <Terminal size={22} />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-wider font-mono text-white">FILE UNDER MYSTERY</h1>
                <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">
                  VIT Mathematics Club // Forensics Authentication
                </p>
              </div>
            </div>

            <form onSubmit={handleRegister} className="flex flex-col gap-4 font-mono text-xs">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-slate-300 mb-1.5 font-bold">
                  Registration Number / Team ID *
                </label>
                <input
                  required
                  type="text"
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                  placeholder="e.g. 23BCE1042 / TEAM-ALPHA"
                  className="w-full bg-black/90 border border-white/20 focus:border-white rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-slate-300 mb-1.5 font-bold">
                  Investigator Team Name *
                </label>
                <input
                  required
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. Vector Space Cowboys"
                  className="w-full bg-black/90 border border-white/20 focus:border-white rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-slate-400 mb-1.5">
                  Lead Investigator (Captain Name)
                </label>
                <input
                  type="text"
                  value={captainName}
                  onChange={(e) => setCaptainName(e.target.value)}
                  placeholder="e.g. Alex Kumar"
                  className="w-full bg-black/90 border border-white/20 focus:border-white rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none transition-all font-mono"
                />
              </div>

              <button
                type="submit"
                className="mt-3 w-full py-3.5 bg-white hover:bg-slate-200 text-black font-bold font-mono text-xs tracking-wider rounded-xl transition-all shadow-[0_0_25px_rgba(255,255,255,0.25)] flex items-center justify-center gap-2 group cursor-pointer"
              >
                <Shield size={16} /> INITIALIZE INVESTIGATION PROTOCOL
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* PURE FULLSCREEN CINEMATIC STORY OVER LOOPING VIDEO BACKGROUND */
        <div className="w-full max-w-6xl min-h-[85vh] flex flex-col justify-between py-8 px-6 animate-rise-up relative z-10">
          {/* Top Audio Toggle */}
          <div className="flex justify-end">
            <button
              onClick={() => {
                if (voiceEnabled && audioRef.current) audioRef.current.pause();
                setVoiceEnabled(!voiceEnabled);
              }}
              className="p-2 rounded-xl bg-black/60 border border-white/10 hover:bg-white/15 text-slate-300 hover:text-white transition-all flex items-center gap-2 text-xs font-mono cursor-pointer backdrop-blur"
            >
              {voiceEnabled ? <Volume2 size={16} className="text-white" /> : <VolumeX size={16} className="text-slate-500" />}
              <span className="hidden sm:inline">{voiceEnabled ? "Voice Narrator: ON" : "Voice Narrator: OFF"}</span>
            </button>
          </div>

          {/* LARGE CINEMATIC STORY TEXT VIEWPORT */}
          <div className="relative h-[320px] flex items-center justify-center overflow-hidden my-auto w-full">
            <div className="w-full flex flex-col items-center justify-center relative">
              {STORY_LINES.map((line, idx) => {
                const isCurrent = idx === activeLineIdx;
                const isNext = idx === activeLineIdx + 1;

                if (idx > activeLineIdx + 1) return null;

                return (
                  <div
                    key={idx}
                    className="text-center font-mono transition-all duration-500 ease-out absolute w-full px-6 max-w-5xl"
                    style={{
                      transform: isCurrent
                        ? "translateY(0px) scale(1)"
                        : isNext
                        ? "translateY(85px) scale(0.94)"
                        : "translateY(-85px) scale(0.92)",
                      opacity: isCurrent ? 1 : isNext ? 0.35 : 0,
                      filter: isCurrent ? "blur(0px)" : isNext ? "blur(5px)" : "blur(10px)",
                      color: isCurrent ? "#FFFFFF" : isNext ? "#94A3B8" : "#475569",
                      fontWeight: isCurrent ? 700 : 400,
                      fontSize: isCurrent ? "30px" : "22px",
                      lineHeight: "1.5",
                      textShadow: isCurrent ? "0 0 30px rgba(0,0,0,0.9), 0 2px 10px rgba(0,0,0,0.9)" : "none",
                      pointerEvents: "none"
                    }}
                  >
                    "{line}"
                  </div>
                );
              })}
            </div>
          </div>

          {/* MINIMAL BOTTOM CONTROLS */}
          <div className="flex items-center justify-between border-t border-white/10 pt-6 font-mono text-xs">
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrevLine}
                disabled={activeLineIdx === 0}
                className="p-2.5 rounded-xl bg-black/60 border border-white/10 hover:bg-white/15 disabled:opacity-30 disabled:pointer-events-none text-white transition-all cursor-pointer backdrop-blur"
                title="Previous Line"
              >
                <ChevronLeft size={18} />
              </button>

              <button
                onClick={togglePlay}
                className="px-5 py-2.5 rounded-xl bg-white text-black font-bold flex items-center gap-2 hover:bg-slate-200 transition-all cursor-pointer shadow-xl"
              >
                {isPlaying ? <Pause size={15} /> : <Play size={15} />}
                <span>{isPlaying ? "Pause" : "Play"}</span>
              </button>

              <button
                onClick={handleNextLine}
                className="p-2.5 rounded-xl bg-black/60 border border-white/10 hover:bg-white/15 text-white transition-all cursor-pointer backdrop-blur"
                title="Next Line"
              >
                <ChevronRight size={18} />
              </button>

              <span className="text-slate-400 text-[11px] ml-2 hidden sm:inline bg-black/40 px-2.5 py-1 rounded-lg border border-white/5">
                Line {activeLineIdx + 1} of {STORY_LINES.length}
              </span>
            </div>

            <button
              onClick={handleEnterLab}
              className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/20 transition-all flex items-center gap-2 cursor-pointer backdrop-blur"
            >
              <span>Enter Level 01 Lab &rarr;</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
