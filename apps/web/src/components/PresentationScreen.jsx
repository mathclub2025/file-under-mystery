import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  X,
  ArrowRight,
  LogOut
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore.js";
import { useGameStore } from "../store/useGameStore.js";
import { notifyAudioPlay, notifyAudioPause, notifyAudioEnded } from "../lib/audioManager.js";
import { STORY_LINES } from "./PrologueScreen.jsx";
import { assetUrl } from "../lib/assetHelper.js";

export default function PresentationScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { team, isAdmin, logout } = useAuthStore();

  const isFromAdmin =
    searchParams.get("from") === "admin" ||
    (isAdmin && isAdmin()) ||
    team?.role === "admin" ||
    team?.isAdmin ||
    team?.teamName?.toLowerCase() === "admin";

  const [activeLineIdx, setActiveLineIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [needsAudioUnlock, setNeedsAudioUnlock] = useState(false);
  const audioRef = useRef(null);
  const isPlayingRef = useRef(isPlaying);
  const fallbackTimerRef = useRef(null);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Audio lifecycle with seamless automatic start on load & browser autoplay unlock
  useEffect(() => {
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      notifyAudioPause();
      audioRef.current = null;
    }

    const audioUrl = assetUrl(`/audio/prologue_${activeLineIdx}.mp3`);
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const tryPlayAudio = () => {
      if (!audioRef.current || !voiceEnabled || !isPlayingRef.current) return;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setNeedsAudioUnlock(false);
            notifyAudioPlay();
          })
          .catch((err) => {
            // Autoplay blocked by browser policy until user interacts
            setNeedsAudioUnlock(true);
          });
      }
    };

    if (isPlaying && voiceEnabled) {
      tryPlayAudio();
    } else if (isPlaying && !voiceEnabled) {
      // If voice is disabled, keep each slide visible for 8 seconds before auto-advancing
      fallbackTimerRef.current = setTimeout(() => {
        if (isPlayingRef.current) {
          setActiveLineIdx((prev) => (prev < STORY_LINES.length - 1 ? prev + 1 : prev));
        }
      }, 8000);
    }

    audio.onended = () => {
      notifyAudioEnded();
      if (isPlayingRef.current) {
        fallbackTimerRef.current = setTimeout(() => {
          if (isPlayingRef.current) {
            setActiveLineIdx((prev) => {
              if (prev < STORY_LINES.length - 1) {
                return prev + 1;
              }
              return prev;
            });
          }
        }, 1200);
      }
    };

    audio.onerror = () => {
      notifyAudioEnded();
      // If audio file is missing or blocked, provide full 8 seconds reading time
      if (isPlayingRef.current) {
        fallbackTimerRef.current = setTimeout(() => {
          if (isPlayingRef.current) {
            setActiveLineIdx((prev) => (prev < STORY_LINES.length - 1 ? prev + 1 : prev));
          }
        }, 8000);
      }
    };

    const handleGlobalUnlock = () => {
      if (audioRef.current && voiceEnabled && isPlayingRef.current) {
        audioRef.current.play().then(() => {
          setNeedsAudioUnlock(false);
          notifyAudioPlay();
        }).catch(() => {});
      }
    };

    window.addEventListener("pointerdown", handleGlobalUnlock, { once: true });
    window.addEventListener("keydown", handleGlobalUnlock, { once: true });

    return () => {
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        notifyAudioPause();
      }
      window.removeEventListener("pointerdown", handleGlobalUnlock);
      window.removeEventListener("keydown", handleGlobalUnlock);
    };
  }, [activeLineIdx, voiceEnabled, isPlaying]);

  const handlePrevLine = () => {
    if (audioRef.current) audioRef.current.pause();
    setActiveLineIdx((prev) => Math.max(0, prev - 1));
  };

  const handleNextLine = () => {
    if (audioRef.current) audioRef.current.pause();
    if (activeLineIdx < STORY_LINES.length - 1) {
      setActiveLineIdx((prev) => prev + 1);
    } else {
      handleEnterInvestigation();
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
        notifyAudioPause();
      }
    } else {
      setIsPlaying(true);
      if (audioRef.current && voiceEnabled) {
        audioRef.current.play().then(notifyAudioPlay).catch(() => {});
      }
    }
  };

  const handleEnterInvestigation = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      notifyAudioPause();
      audioRef.current = null;
    }

    if (isFromAdmin) {
      navigate("/admin");
    } else {
      const target = useGameStore.getState().getActiveLevelId() || "level1";
      navigate(`/investigate/${target}`);
    }
  };

  const handleExitToAdmin = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      notifyAudioPause();
      audioRef.current = null;
    }
    navigate("/admin");
  };

  const handleLogout = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      notifyAudioPause();
      audioRef.current = null;
    }
    logout();
    navigate("/", { replace: true });
  };

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="fixed inset-0 w-screen h-screen bg-black text-white font-mono select-none flex flex-col justify-between p-4 sm:p-6 z-50 overflow-hidden"
    >
      {/* Background Looping Atmospheric Script Video */}
      <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <video
          src={assetUrl("/script_bg/prologue.mp4")}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-40 brightness-40 contrast-125 scale-105"
        />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <img
            src={assetUrl("/maths_club_logo.png")}
            alt="VIT Mathematics Club"
            className="w-10 h-10 sm:w-11 sm:h-11 object-contain drop-shadow-[0_2px_15px_rgba(0,0,0,0.8)] filter brightness-105 pointer-events-none"
          />
          <div>
            <h1 className="text-sm sm:text-base font-extrabold tracking-wider text-white">
              FILE UNDER MYSTERY // MISSION PROLOGUE
            </h1>
            <p className="text-[10px] sm:text-[11px] text-zinc-400 font-mono tracking-widest uppercase">
              VIT Mathematics Club // Department Forensics Briefing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Team Name Pill */}
          {!isFromAdmin && (team?.teamName || team?.team_name) && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/10 border border-white/20 text-white font-mono text-xs font-bold tracking-wide backdrop-blur">
              <span className="text-zinc-400 font-normal text-[10px]">UNIT:</span>
              <span className="text-white font-black truncate max-w-[160px]">{team?.teamName || team?.team_name}</span>
              {(team?.captainRegNo || team?.captain_reg_no) && (
                <span className="text-[10px] text-zinc-400 font-mono hidden md:inline">
                  ({team?.captainRegNo || team?.captain_reg_no})
                </span>
              )}
            </div>
          )}

          {/* Voice Narrator Toggle */}
          <button
            type="button"
            onClick={() => {
              if (voiceEnabled && audioRef.current) audioRef.current.pause();
              setVoiceEnabled(!voiceEnabled);
            }}
            className="px-3 py-2 rounded-xl bg-black/60 border border-white/15 hover:bg-white/15 text-zinc-300 hover:text-white transition-all flex items-center gap-2 text-xs cursor-pointer backdrop-blur"
          >
            {voiceEnabled ? <Volume2 size={15} className="text-white" /> : <VolumeX size={15} className="text-zinc-500" />}
            <span className="hidden md:inline">{voiceEnabled ? "Voice Narrator: ON" : "Voice Narrator: OFF"}</span>
          </button>

          {/* Admin Exit Button or Player Logout Button */}
          {isFromAdmin ? (
            <button
              type="button"
              onClick={handleExitToAdmin}
              className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xl transition-all border border-white"
            >
              <X size={15} />
              <span>RETURN TO ADMIN</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-zinc-300 hover:text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all backdrop-blur"
              title="Logout Session"
            >
              <LogOut size={14} className="text-zinc-400" />
              <span>LOGOUT</span>
            </button>
          )}
        </div>
      </header>

      {/* Center Cinematic Story Slides Viewport */}
      <main className="relative z-10 h-[360px] sm:h-[440px] flex flex-col items-center justify-center overflow-hidden my-auto w-full">
        {/* Autoplay Unlock Notice when browser requires user tap */}
        {needsAudioUnlock && voiceEnabled && (
          <div className="absolute top-2 z-30 animate-bounce">
            <button
              type="button"
              onClick={() => {
                if (audioRef.current && voiceEnabled) {
                  audioRef.current.play().then(() => {
                    setNeedsAudioUnlock(false);
                    notifyAudioPlay();
                  }).catch(() => {});
                }
              }}
              className="px-4 py-2 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_30px_rgba(255,255,255,0.4)] border border-white cursor-pointer hover:bg-zinc-200 transition-all"
            >
              <Volume2 size={16} className="text-black animate-pulse" />
              <span>CLICK TO UNMUTE AUDIO NARRATION</span>
            </button>
          </div>
        )}

        <div className="w-full flex flex-col items-center justify-center relative">
          {STORY_LINES.map((line, idx) => {
            const isCurrent = idx === activeLineIdx;
            const isNext = idx === activeLineIdx + 1;

            if (idx > activeLineIdx + 1) return null;

            return (
              <div
                key={idx}
                className="text-center font-mono transition-all duration-500 ease-out absolute w-full px-4 sm:px-8 max-w-5xl"
                style={{
                  transform: isCurrent
                    ? "translateY(0px) scale(1)"
                    : isNext
                    ? "translateY(100px) scale(0.94)"
                    : "translateY(-100px) scale(0.92)",
                  opacity: isCurrent ? 1 : isNext ? 0.35 : 0,
                  filter: isCurrent ? "blur(0px)" : isNext ? "blur(5px)" : "blur(10px)",
                  color: isCurrent ? "#FFFFFF" : isNext ? "#94A3B8" : "#475569",
                  fontWeight: isCurrent ? 700 : 400,
                  fontSize: isCurrent ? "clamp(20px, 4.2vw, 36px)" : "clamp(15px, 3.2vw, 24px)",
                  lineHeight: "1.55",
                  textShadow: isCurrent ? "0 0 35px rgba(0,0,0,0.95), 0 2px 12px rgba(0,0,0,0.95)" : "none",
                  pointerEvents: "none"
                }}
              >
                "{line}"
              </div>
            );
          })}
        </div>
      </main>

      {/* Bottom Controls Bar (Exact Match with Briefing Style) */}
      <footer className="relative z-10 grid grid-cols-1 sm:grid-cols-3 items-center gap-3 border-t border-white/10 pt-3 font-mono text-xs px-2 shrink-0">
        {/* Left: Player Controls & Simple 1 / 18 Counter */}
        <div className="flex items-center justify-center sm:justify-start gap-2">
          <button
            type="button"
            onClick={handlePrevLine}
            disabled={activeLineIdx === 0}
            className="p-2 rounded-xl bg-black/60 border border-white/10 hover:bg-white/15 disabled:opacity-30 text-white transition-all cursor-pointer backdrop-blur"
            title="Previous Slide"
          >
            <ChevronLeft size={16} />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            className="p-2 px-3 rounded-xl bg-white text-black font-extrabold flex items-center justify-center hover:bg-zinc-200 transition-all cursor-pointer shadow-md"
            title={isPlaying ? "Pause Narration" : "Play Narration"}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>

          <button
            type="button"
            onClick={handleNextLine}
            className="p-2 rounded-xl bg-black/60 border border-white/10 hover:bg-white/15 text-white transition-all cursor-pointer backdrop-blur"
            title="Next Slide"
          >
            <ChevronRight size={16} />
          </button>

          <span className="text-zinc-400 font-mono text-xs ml-1">
            {activeLineIdx + 1} / {STORY_LINES.length}
          </span>
        </div>

        {/* Middle: Centered Pill Action Button */}
        <div className="flex justify-center">
          {isFromAdmin ? (
            <button
              type="button"
              onClick={handleExitToAdmin}
              className="px-6 py-2.5 rounded-full bg-white hover:bg-zinc-200 text-black font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg transition-all"
            >
              <span>RETURN TO ADMIN</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleEnterInvestigation}
              className="px-6 py-2.5 rounded-full bg-white hover:bg-zinc-200 text-black font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg transition-all"
            >
              <span>START INVESTIGATION</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>

        {/* Right: Empty spacer for clean alignment */}
        <div className="hidden sm:block"></div>
      </footer>
    </div>
  );
}
