import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { VolumeX } from "lucide-react";
import { assetUrl } from "../lib/assetHelper.js";

export default function BackgroundMusic() {
  const location = useLocation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStartedOnce, setHasStartedOnce] = useState(false);
  const audioRef = useRef(null);

  const userMutedRef = useRef(false);
  const wasPlayingBeforeWorkbenchRef = useRef(false);
  const wasPlayingBeforeAudioPuzzleRef = useRef(false);
  const inWorkbenchRef = useRef(false);

  const isAudioBasedLevel = 
    location.pathname.includes("/investigate/level2") || 
    location.pathname.includes("/investigate/level11") ||
    location.pathname.includes("/investigate/final");

  useEffect(() => {
    // Initialize audio element with 15% volume
    const audio = new Audio(assetUrl("/audio/bgm.mp3"));
    audio.loop = true;
    audio.volume = 0.15;
    audioRef.current = audio;

    // Autoplay on first user interaction anywhere on the page
    const handleFirstInteraction = () => {
      if (!hasStartedOnce && audioRef.current && !userMutedRef.current && !inWorkbenchRef.current && !isAudioBasedLevel) {
        audioRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
            setHasStartedOnce(true);
          })
          .catch(() => {});
      }
      window.removeEventListener("pointerdown", handleFirstInteraction);
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
    };

    window.addEventListener("pointerdown", handleFirstInteraction, { once: true });
    window.addEventListener("click", handleFirstInteraction, { once: true });
    window.addEventListener("keydown", handleFirstInteraction, { once: true });
    window.addEventListener("touchstart", handleFirstInteraction, { once: true });

    // Handle lab mode transition (Briefing vs Evidence Workbench)
    const handleLabMode = (e) => {
      const inWorkbench = !!e.detail?.inWorkbench;
      inWorkbenchRef.current = inWorkbench;

      if (!audioRef.current || userMutedRef.current) return;

      if (inWorkbench) {
        // Pause BGM when entering evidence workbench
        if (!audioRef.current.paused) {
          wasPlayingBeforeWorkbenchRef.current = true;
          audioRef.current.pause();
          setIsPlaying(false);
        }
      } else {
        // Resume BGM during pre-level story briefing
        if (!isAudioBasedLevel && (wasPlayingBeforeWorkbenchRef.current || !hasStartedOnce)) {
          audioRef.current
            .play()
            .then(() => {
              setIsPlaying(true);
              setHasStartedOnce(true);
              wasPlayingBeforeWorkbenchRef.current = false;
            })
            .catch(() => {});
        }
      }
    };

    // Handle audio activity: Keep BGM playing softly during story narration
    const handleAudioActivity = (e) => {
      const isNarrationActive = e.detail?.active;
      if (!audioRef.current || userMutedRef.current || inWorkbenchRef.current) return;

      if (isAudioBasedLevel) {
        if (!audioRef.current.paused) {
          wasPlayingBeforeAudioPuzzleRef.current = true;
          audioRef.current.pause();
          setIsPlaying(false);
        }
      } else if (isNarrationActive) {
        audioRef.current.volume = 0.10;
        if (audioRef.current.paused && !userMutedRef.current) {
          audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
        }
      } else {
        audioRef.current.volume = 0.15;
        if (audioRef.current.paused && !userMutedRef.current) {
          audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
        }
      }
    };

    window.addEventListener("mystery-lab-mode", handleLabMode);
    window.addEventListener("mystery-audio-activity", handleAudioActivity);

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      window.removeEventListener("pointerdown", handleFirstInteraction);
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
      window.removeEventListener("mystery-lab-mode", handleLabMode);
      window.removeEventListener("mystery-audio-activity", handleAudioActivity);
    };
  }, []);

  // Handle route changes
  useEffect(() => {
    if (!audioRef.current) return;

    if (isAudioBasedLevel) {
      if (!audioRef.current.paused) {
        wasPlayingBeforeAudioPuzzleRef.current = true;
        audioRef.current.pause();
        setIsPlaying(false);
      }
    } else if (!inWorkbenchRef.current) {
      if ((wasPlayingBeforeAudioPuzzleRef.current || wasPlayingBeforeWorkbenchRef.current) && !userMutedRef.current) {
        audioRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
            wasPlayingBeforeAudioPuzzleRef.current = false;
            wasPlayingBeforeWorkbenchRef.current = false;
          })
          .catch(() => {});
      }
    }
  }, [location.pathname, isAudioBasedLevel]);

  const toggleBgm = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      userMutedRef.current = true;
      wasPlayingBeforeWorkbenchRef.current = false;
      wasPlayingBeforeAudioPuzzleRef.current = false;
    } else {
      userMutedRef.current = false;
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setHasStartedOnce(true);
        })
        .catch(() => {});
    }
  };

  return (
    <div className="fixed bottom-3 right-3 sm:bottom-3 sm:right-4 z-50 select-none font-mono">
      <button
        onClick={toggleBgm}
        className={`px-3 py-1.5 rounded-xl backdrop-blur-md border transition-all flex items-center gap-2 text-[11px] font-bold cursor-pointer shadow-lg active:scale-95 ${
          isPlaying
            ? "bg-black/85 border-cyan-500/50 text-cyan-300 hover:bg-black hover:border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]"
            : "bg-black/80 border-white/15 text-slate-400 hover:text-slate-200 hover:border-white/30"
        }`}
        title={isPlaying ? "Mute Background Music" : "Play Background Music"}
      >
        {isPlaying ? (
          <>
            <div className="flex items-end gap-0.5 h-3.5 w-3.5 pb-0.5">
              <span className="w-0.5 bg-cyan-400 rounded-full animate-[pulse_0.8s_ease-in-out_infinite] h-full" />
              <span className="w-0.5 bg-cyan-400 rounded-full animate-[pulse_1.1s_ease-in-out_infinite] h-2/3" />
              <span className="w-0.5 bg-cyan-400 rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-4/5" />
            </div>
            <span>BGM: ON</span>
          </>
        ) : (
          <>
            <VolumeX size={14} className="text-slate-500" />
            <span>BGM: OFF</span>
          </>
        )}
      </button>
    </div>
  );
}
