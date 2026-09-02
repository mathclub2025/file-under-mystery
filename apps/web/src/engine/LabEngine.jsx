import React, { useState, useEffect, useRef, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  HelpCircle,
  X,
  Briefcase,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Trophy,
  Radio,
  BookOpen,
  Clock,
  Lock,
  Loader2,
  LogOut,
  Coffee
} from "lucide-react";
import AnswerSubmissionBox from "../components/AnswerSubmissionBox.jsx";
import EvidenceVaultModal from "../components/EvidenceVaultModal.jsx";
import RequiredDocsModal from "../components/RequiredDocsModal.jsx";
import LeaderboardModal from "../components/LeaderboardModal.jsx";
import TimeExpiredModal from "../components/TimeExpiredModal.jsx";
import { LEVEL_BRIEFINGS } from "../data/levelBriefings.js";
import { useGameStore, LEVEL_ORDER } from "../store/useGameStore.js";
import { useAuthStore } from "../store/useAuthStore.js";
import { apiGetHint, apiAdminGetBroadcasts, apiGetEventStatus, apiUpdateActiveLevel } from "../lib/api.js";
import { assetUrl } from "../lib/assetHelper.js";
import {
  notifyAudioPlay,
  notifyAudioPause,
  notifyAudioEnded
} from "../lib/audioManager.js";

// Lazy-loaded Level Renderers (Loaded ONLY when that specific level is opened)
const ImageCanvas = React.lazy(() => import("./renderers/ImageCanvas.jsx"));
const AudioLab = React.lazy(() => import("./renderers/AudioLab.jsx"));
const VideoForensics = React.lazy(() => import("./renderers/VideoForensics.jsx"));
const StegoExtractor = React.lazy(() => import("./renderers/StegoExtractor.jsx"));
const CipherWorkbench = React.lazy(() => import("./renderers/CipherWorkbench.jsx"));
const PacketInspector = React.lazy(() => import("./renderers/PacketInspector.jsx"));
const MatrixUnscrambler = React.lazy(() => import("./renderers/MatrixUnscrambler.jsx"));
const FourierLab = React.lazy(() => import("./renderers/FourierLab.jsx"));
const EllipticLab = React.lazy(() => import("./renderers/EllipticLab.jsx"));
const AutomataLab = React.lazy(() => import("./renderers/AutomataLab.jsx"));
const PhaseLab = React.lazy(() => import("./renderers/PhaseLab.jsx"));
const GraphLab = React.lazy(() => import("./renderers/GraphLab.jsx"));
const FinalBossLab = React.lazy(() => import("./renderers/FinalBossLab.jsx"));

// Dynamic Level Config Loaders (Loaded ONLY on demand)
const LEVEL_CONFIG_LOADERS = {
  level1: () => import("../levels/level1/config.js"),
  level2: () => import("../levels/level2/config.js"),
  level3: () => import("../levels/level3/config.js"),
  level4: () => import("../levels/level4/config.js"),
  level5: () => import("../levels/level5/config.js"),
  level6: () => import("../levels/level6/config.js"),
  level7: () => import("../levels/level7/config.js"),
  level8: () => import("../levels/level8/config.js"),
  level9: () => import("../levels/level9/config.js"),
  level10: () => import("../levels/level10/config.js"),
  level11: () => import("../levels/level11/config.js"),
  level12: () => import("../levels/level12/config.js"),
  final: () => import("../levels/finalBoss/config.js")
};

export default function LabEngine() {
  const { levelId } = useParams();
  const navigate = useNavigate();

  const [config, setConfig] = useState(null);
  const [configLoading, setConfigLoading] = useState(true);

  const {
    getActiveLevelId,
    isLevelSolved,
    isLevelTimedOut,
    isHintRevealed,
    getRevealedHintText,
    saveRevealedHint,
    getScore,
    hasTimerStarted,
    startLevelTimer,
    tickLevelTimer,
    getRemainingSeconds,
    getEarnablePoints,
    handleLevelTimeout,
    revealedHints,
    revealedHintCosts
  } = useGameStore();

  const activeLevel = getActiveLevelId();
  const effectiveLevelId = activeLevel || "final";

  // 1. Strict Ongoing Single Active Level Lock:
  // Player is locked strictly to their current ongoing active case.
  // When all cases are completed/ended, auto-routes to the Grand Finale broadcast.
  useEffect(() => {
    if (!activeLevel) {
      if (levelId !== "final") {
        navigate("/investigate/final", { replace: true });
      }
    } else if (levelId !== activeLevel) {
      navigate(`/investigate/${activeLevel}`, { replace: true });
      return;
    }

    // Load ONLY the active level's configuration dynamically
    let isMounted = true;
    setConfigLoading(true);
    const targetLvl = activeLevel || levelId || "final";
    const loader = LEVEL_CONFIG_LOADERS[targetLvl] || LEVEL_CONFIG_LOADERS.final;
    loader()
      .then((mod) => {
        if (isMounted) {
          setConfig(mod.default || mod);
          setConfigLoading(false);
        }
      })
      .catch((err) => {
        console.warn("Config load error:", err);
        if (isMounted) setConfigLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [levelId, activeLevel, navigate]);

  const resolvedLevelId = config?.id || levelId || "level1";
  const levelDuration = config?.durationSeconds || 1500;
  const basePoints = config?.basePoints || 20;

  const isSolved = isLevelSolved(resolvedLevelId);
  const isTimedOut = isLevelTimedOut(resolvedLevelId);
  const liveScore = getScore();
  const timerAlreadyStarted = hasTimerStarted(resolvedLevelId);

  const [viewMode, setViewMode] = useState("briefing");
  const [showVaultModal, setShowVaultModal] = useState(false);
  const [showHintModal, setShowHintModal] = useState(false);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const [hintError, setHintError] = useState("");
  const [hintLoadingIdx, setHintLoadingIdx] = useState(null);

  const [remainingTime, setRemainingTime] = useState(levelDuration);
  const [liveEarnable, setLiveEarnable] = useState(basePoints);

  const [activeLineIdx, setActiveLineIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const audioRef = useRef(null);

  const storyLines = LEVEL_BRIEFINGS[resolvedLevelId] || [
    "Forensic artifact decrypted.",
    "Inspect raw evidence data in the workbench."
  ];

  const currentIdx = LEVEL_ORDER.indexOf(resolvedLevelId);
  const nextLevelId = currentIdx >= 0 && currentIdx < LEVEL_ORDER.length - 1 ? LEVEL_ORDER[currentIdx + 1] : null;
  const bgVideoSrc = assetUrl(`/script_bg/${resolvedLevelId}_bg.mp4`);

  const { team, logout } = useAuthStore();
  const [activeBroadcast, setActiveBroadcast] = useState(null);

  const handleLogout = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      notifyAudioPause();
      audioRef.current = null;
    }
    logout();
    navigate("/", { replace: true });
  };

  // Live Event Status & Phase 2 Gate State
  const [eventStatus, setEventStatus] = useState({ isLive: true, phase2Unlocked: true });
  const [isEvidenceReady, setIsEvidenceReady] = useState(false);

  const PHASE_2_LEVELS = ["level7", "level8", "level9", "level10", "level11", "level12", "final", "finalBoss"];
  const isPhase2Gated = !team?.isAdmin && team?.role !== "admin" && eventStatus.phase2Unlocked === false && PHASE_2_LEVELS.includes(resolvedLevelId);

  // Reset evidence loading state on level change
  useEffect(() => {
    setIsEvidenceReady(false);
    // Safety fallback: if media takes longer than 10s or network glitch, release pause
    const timer = setTimeout(() => {
      setIsEvidenceReady(true);
    }, 10000);
    return () => clearTimeout(timer);
  }, [resolvedLevelId]);

  // Background Telemetry & Admin Broadcast Polling
  useEffect(() => {
    if (!team?.id) return;
    const checkSync = async () => {
      try {
        const statusRes = await apiGetEventStatus();
        if (statusRes) {
          if (statusRes.isLive === false && !team?.isAdmin && team?.role !== "admin") {
            navigate("/", { replace: true });
            return;
          }
          setEventStatus((prev) => ({
            ...prev,
            isLive: statusRes.isLive !== false,
            phase2Unlocked: statusRes.phase2Unlocked !== false
          }));
        }

        await useGameStore.getState().loadRemoteTeamProgress(team.id);
        const bcRes = await apiAdminGetBroadcasts(team.id);
        if (bcRes && bcRes.broadcasts && bcRes.broadcasts.length > 0) {
          const latest = bcRes.broadcasts[0];
          const lastSeenId = sessionStorage.getItem("mystery_last_broadcast_id");
          if (latest.id !== lastSeenId) {
            setActiveBroadcast(latest);
          }
        }
      } catch (e) {}
    };

    checkSync();
    const interval = setInterval(checkSync, 3000);
    return () => clearInterval(interval);
  }, [team, navigate]);

  // Sync active level to DB when opening a level
  useEffect(() => {
    if (team?.id && resolvedLevelId) {
      apiUpdateActiveLevel(team.id, resolvedLevelId);
    }
  }, [team?.id, resolvedLevelId]);

  useEffect(() => {
    if (isTimedOut) {
      setShowTimeoutModal(true);
    }
  }, [isTimedOut]);

  // Real-time Timer Interval Tick (PAUSED while evidence is still loading or during Phase 1 break)
  useEffect(() => {
    const updateTimer = () => {
      if (hasTimerStarted(resolvedLevelId) && !isSolved && !isTimedOut && isEvidenceReady && !isPhase2Gated) {
        tickLevelTimer(resolvedLevelId);
      }

      const rem = getRemainingSeconds(resolvedLevelId, levelDuration);
      setRemainingTime(rem);

      const earnable = getEarnablePoints(resolvedLevelId, basePoints, levelDuration);
      setLiveEarnable(earnable);

      if (rem <= 0 && hasTimerStarted(resolvedLevelId) && !isSolved && !isTimedOut) {
        handleLevelTimeout(resolvedLevelId);
        setShowTimeoutModal(true);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [resolvedLevelId, levelDuration, basePoints, isSolved, isTimedOut, isEvidenceReady, isPhase2Gated, revealedHints, revealedHintCosts]);

  // Notify BGM coordinator when transitioning between story briefing and evidence workbench
  useEffect(() => {
    const inWorkbench = viewMode === "workbench";
    window.dispatchEvent(new CustomEvent("mystery-lab-mode", { detail: { inWorkbench } }));
    return () => {
      window.dispatchEvent(new CustomEvent("mystery-lab-mode", { detail: { inWorkbench: false } }));
    };
  }, [viewMode]);

  const enterWorkbench = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      notifyAudioPause();
    }
    setIsPlaying(false);
    startLevelTimer(resolvedLevelId, levelDuration);
    setViewMode("workbench");
  };

  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const currentAudioKeyRef = useRef("");

  // 1. Audio Track Loader (Runs strictly when level or line index changes)
  useEffect(() => {
    if (viewMode !== "briefing") {
      if (audioRef.current) {
        audioRef.current.pause();
        notifyAudioPause();
        audioRef.current = null;
      }
      currentAudioKeyRef.current = "";
      return;
    }

    const key = `${resolvedLevelId}_${activeLineIdx}`;
    if (currentAudioKeyRef.current === key && audioRef.current) {
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      notifyAudioPause();
      audioRef.current = null;
    }

    currentAudioKeyRef.current = key;
    const audioUrl = assetUrl(`/audio/briefing_${resolvedLevelId}_${activeLineIdx}.mp3`);
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.onended = () => {
      notifyAudioEnded();
      if (isPlayingRef.current) {
        setTimeout(() => {
          if (isPlayingRef.current) {
            if (activeLineIdx < storyLines.length - 1) {
              setActiveLineIdx((prev) => prev + 1);
            } else {
              setIsPlaying(false);
              setTimeout(() => {
                enterWorkbench();
              }, 300);
            }
          }
        }, 100);
      }
    };

    audio.onerror = () => {
      // Automatic fallback to SpeechSynthesis narration if mp3 is missing
      if (isPlayingRef.current && voiceEnabled && typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const textToSpeak = storyLines[activeLineIdx] || "";
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.rate = 0.92;
        utterance.pitch = 1.0;

        try {
          const voices = window.speechSynthesis.getVoices() || [];
          const femaleVoice = voices.find(v => 
            v.lang.startsWith("en") && (
              v.name.toLowerCase().includes("female") || 
              v.name.toLowerCase().includes("zira") || 
              v.name.toLowerCase().includes("ava") || 
              v.name.toLowerCase().includes("jenny") || 
              v.name.toLowerCase().includes("samantha") || 
              v.name.toLowerCase().includes("natural")
            )
          ) || voices.find(v => v.lang.startsWith("en"));
          if (femaleVoice) utterance.voice = femaleVoice;
        } catch (e) {}

        notifyAudioPlay();

        utterance.onend = () => {
          notifyAudioEnded();
          if (isPlayingRef.current) {
            if (activeLineIdx < storyLines.length - 1) {
              setActiveLineIdx((prev) => prev + 1);
            } else {
              setIsPlaying(false);
              setTimeout(() => {
                enterWorkbench();
              }, 300);
            }
          }
        };

        utterance.onerror = () => {
          notifyAudioEnded();
          if (isPlayingRef.current) {
            setTimeout(() => {
              if (isPlayingRef.current) {
                if (activeLineIdx < storyLines.length - 1) {
                  setActiveLineIdx((prev) => prev + 1);
                } else {
                  setIsPlaying(false);
                  enterWorkbench();
                }
              }
            }, 3500);
          }
        };

        window.speechSynthesis.speak(utterance);
      } else {
        notifyAudioEnded();
        if (isPlayingRef.current) {
          setTimeout(() => {
            if (isPlayingRef.current) {
              if (activeLineIdx < storyLines.length - 1) {
                setActiveLineIdx((prev) => prev + 1);
              } else {
                setIsPlaying(false);
                enterWorkbench();
              }
            }
          }, 4000);
        }
      }
    };

    if (isPlayingRef.current && voiceEnabled) {
      audio.play().then(() => {
        notifyAudioPlay();
      }).catch(() => {});
    }

    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (audioRef.current && currentAudioKeyRef.current !== `${resolvedLevelId}_${activeLineIdx}`) {
        audioRef.current.pause();
        notifyAudioPause();
      }
    };
  }, [viewMode, activeLineIdx, resolvedLevelId, storyLines.length]);

  // 2. Play / Pause & Voice Toggle Control (Decoupled from Track Loading)
  useEffect(() => {
    if (viewMode !== "briefing") return;

    if (isPlaying && voiceEnabled) {
      if (audioRef.current && audioRef.current.paused) {
        audioRef.current.play().then(() => {
          notifyAudioPlay();
        }).catch(() => {});
      } else if (typeof window !== "undefined" && window.speechSynthesis && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    } else {
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        notifyAudioPause();
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }
  }, [isPlaying, voiceEnabled, viewMode]);

  const toggleBriefingPlay = () => {
    setIsPlaying((prev) => !prev);
  };

  const handleNextLevel = () => {
    setShowTimeoutModal(false);
    if (audioRef.current) {
      audioRef.current.pause();
      notifyAudioPause();
    }
    const nextActive = useGameStore.getState().getActiveLevelId();
    if (nextActive) {
      navigate(`/investigate/${nextActive}`);
    } else {
      navigate("/investigate/final");
    }
  };

  const handleReplayBriefing = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      notifyAudioPause();
      audioRef.current = null;
    }
    currentAudioKeyRef.current = "";
    setActiveLineIdx(0);
    setIsPlaying(true);
    setVoiceEnabled(true);
    setViewMode("briefing");
  };

  // On-Demand Server Hint Request
  const handleUnlockHint = async (hintIndex, cost) => {
    if (hintIndex > 0 && !isHintRevealed(resolvedLevelId, hintIndex - 1)) {
      setHintError("Please unlock the previous hint first.");
      return;
    }

    setHintLoadingIdx(hintIndex);
    setHintError("");
    try {
      let teamId = null;
      try {
        const teamObj = JSON.parse(localStorage.getItem("mystery_team_session") || "{}");
        teamId = teamObj.id;
      } catch (e) {}

      const res = await apiGetHint({
        teamId,
        levelId: resolvedLevelId,
        hintIndex
      });

      if (res && res.success && res.hint) {
        saveRevealedHint(resolvedLevelId, hintIndex, res.hint.cost || cost, res.hint.text);
      } else {
        setHintError(res?.error || "Could not retrieve hint from server.");
      }
    } catch (err) {
      setHintError("Network error contacting forensics server.");
    } finally {
      setHintLoadingIdx(null);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const isTimerRunning = hasTimerStarted(resolvedLevelId);
  const isDecaying = isTimerRunning && remainingTime < levelDuration / 2 && remainingTime > 0;
  const isExpired = remainingTime <= 0;

  if (configLoading || !config) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center font-mono text-xs text-slate-400 gap-3">
        <Loader2 size={24} className="animate-spin text-cyan-400" />
        <span>INITIALIZING FORENSIC LEVEL INSTRUMENTS...</span>
      </div>
    );
  }

  const hintCosts = config.hintCosts || [2, 3, 3];

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="relative w-full h-full min-h-screen max-h-screen overflow-hidden flex flex-col justify-between bg-black text-slate-100 font-sans select-none"
    >
      {/* Background Video Layer */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <video
          key={bgVideoSrc}
          src={bgVideoSrc}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-25 brightness-40 contrast-125 scale-105"
        />
        <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px]" />
      </div>


      {/* TOP HEADER HUD */}
      <div className="h-14 border-b border-white/10 px-4 sm:px-6 flex items-center justify-between z-20 shrink-0 font-mono text-xs backdrop-blur-md bg-black/40">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Team Name Pill */}
          {(team?.teamName || team?.team_name) && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/10 border border-white/20 text-white font-bold tracking-wide shadow backdrop-blur max-w-[160px] sm:max-w-[240px] truncate">
              <span className="text-zinc-400 font-normal text-[10px]">UNIT:</span>
              <span className="text-white font-black truncate">{team?.teamName || team?.team_name}</span>
              {(team?.captainRegNo || team?.captain_reg_no) && (
                <span className="text-[10px] text-zinc-400 font-mono hidden md:inline">
                  ({team?.captainRegNo || team?.captain_reg_no})
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-black/80 border border-white/20 backdrop-blur shadow">
            <Trophy size={13} className="text-amber-400" />
            <span className="font-extrabold text-white">{liveScore} PTS</span>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-slate-400 text-xs font-bold">
            <span>//</span>
            <span className="text-white uppercase tracking-wider">{config.id.toUpperCase()}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-[11px] font-bold">
            <span>BASE: {basePoints}P</span>
            <span>&bull;</span>
            <span className="text-white">NOW: {liveEarnable}P</span>
          </div>
        </div>

        {/* Center: Live Countdown Timer HUD */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-black/80 border border-white/20 backdrop-blur shadow">
          <Clock
            size={14}
            className={
              !isTimerRunning
                ? "text-slate-400"
                : isExpired
                ? "text-rose-500"
                : isDecaying
                ? "text-amber-400 animate-pulse"
                : "text-emerald-400"
            }
          />
          <span
            className={`text-xs sm:text-sm font-black tracking-widest ${
              !isTimerRunning
                ? "text-slate-300"
                : isExpired
                ? "text-rose-400 animate-bounce"
                : isDecaying
                ? "text-amber-300"
                : "text-emerald-300"
            }`}
          >
            {formatTime(remainingTime)}
          </span>
          <span
            className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
              !isTimerRunning
                ? "bg-slate-900 text-slate-400 border border-slate-700"
                : !isEvidenceReady
                ? "bg-amber-950 text-amber-300 border border-amber-500/40 animate-pulse"
                : isExpired
                ? "bg-rose-950 text-rose-300 border border-rose-500/40"
                : isDecaying
                ? "bg-amber-950 text-amber-300 border border-amber-500/40"
                : "bg-emerald-950 text-emerald-300 border border-emerald-500/40"
            }`}
          >
            {!isTimerRunning
              ? "READY"
              : !isEvidenceReady
              ? "PAUSED (LOADING)"
              : isExpired
              ? "EXPIRED"
              : isDecaying
              ? "DECAY ACTIVE"
              : "FULL PTS"}
          </span>
        </div>

        {/* Right Tools & Navigation */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {viewMode === "briefing" ? (
            <>
              <button
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className="px-2.5 py-1.5 rounded-xl bg-black/60 hover:bg-white/15 border border-white/10 text-slate-300 flex items-center gap-1.5 cursor-pointer backdrop-blur"
                title="Toggle Briefing Audio Narration"
              >
                {voiceEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
                <span className="text-[11px] hidden sm:inline">Voice: {voiceEnabled ? "ON" : "OFF"}</span>
              </button>

              <button
                onClick={handleLogout}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-zinc-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur text-xs font-bold"
                title="Logout Session"
              >
                <LogOut size={13} className="text-zinc-400" />
                <span>LOGOUT</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleReplayBriefing}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-slate-200 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur text-xs font-bold"
                title="Re-play pre-level briefing narration"
              >
                <Radio size={13} className="text-white" />
                <span>BRIEFING</span>
              </button>

              <button
                onClick={() => setShowLeaderboardModal(true)}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:text-amber-200 flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur text-xs font-bold"
                title="View Live Leaderboard"
              >
                <Trophy size={13} className="text-amber-400" />
                <span>LEADERBOARD</span>
              </button>

              <button
                onClick={() => setShowDocsModal(true)}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-black/60 hover:bg-white/15 border border-white/20 text-slate-200 hover:text-white hidden sm:flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur shadow-md text-xs font-bold"
                title="Open Required Forensic Documentation & Math Bible"
              >
                <BookOpen size={13} className="text-white" />
                <span>DOCS</span>
              </button>

              <button
                onClick={() => setShowVaultModal(true)}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-black/60 hover:bg-white/15 border border-white/15 text-slate-200 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur text-xs"
                title="Open Case Vault"
              >
                <Briefcase size={14} />
                <span className="hidden sm:inline">VAULT</span>
              </button>

              <button
                onClick={() => setShowHintModal(true)}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-black/60 hover:bg-white/15 border border-white/15 text-slate-200 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur text-xs"
                title="View Hints"
              >
                <HelpCircle size={14} />
                <span>HINTS (3)</span>
              </button>

              <button
                onClick={handleLogout}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-zinc-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur text-xs font-bold"
                title="Logout Session"
              >
                <LogOut size={13} className="text-zinc-400" />
                <span>LOGOUT</span>
              </button>
            </>
          )}
        </div>
      </div>

      {isPhase2Gated ? (
        /* PHASE 1 REFRESHMENT BREAK ROOM / LOBBY */
        <div className="w-full h-[calc(100vh-3.5rem)] flex items-center justify-center p-4 sm:p-6 relative z-10 font-mono select-none">
          <div className="max-w-xl w-full p-8 rounded-3xl bg-[#0a0a0c] border-2 border-amber-400/40 shadow-[0_0_60px_rgba(251,191,36,0.18)] flex flex-col items-center text-center gap-5">
            <div className="w-16 h-16 rounded-full bg-amber-950/80 border border-amber-400/60 flex items-center justify-center text-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.35)] animate-pulse">
              <Coffee size={32} />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                PHASE 1 (LEVELS 1–6) COMPLETED // REFRESHMENT BREAK
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                OPERATIONS TEMPORARILY PAUSED
              </h2>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed max-w-md">
              Outstanding work, operatives! All evidence from Phase 1 has been cataloged and your score is secured. Enjoy your refreshments and take a break.
            </p>

            <div className="w-full p-4 rounded-2xl bg-amber-950/30 border border-amber-400/30 text-amber-200 text-xs flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Current Score:</span>
                <span className="font-extrabold text-white">{liveScore} PTS</span>
              </div>
              <div className="flex items-center justify-between border-t border-amber-400/20 pt-2">
                <span className="text-slate-400">Next Case:</span>
                <span className="font-bold text-amber-300">Level 7: The Transposition Matrix</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-zinc-400 animate-pulse">
              <Loader2 size={13} className="animate-spin text-amber-400" />
              <span>Phase 2 will automatically resume here once activated by the Event Admin...</span>
            </div>
          </div>
        </div>
      ) : viewMode === "briefing" ? (
        /* 1. CINEMATIC STORY BRIEFING */
        <div className="w-full h-[calc(100vh-3.5rem)] flex flex-col justify-between p-4 sm:p-6 relative z-10 overflow-hidden box-border">
          <div className="flex-1 flex items-center justify-center relative w-full overflow-hidden">
            <div className="max-w-3xl w-full text-center flex flex-col items-center justify-center gap-4 px-4 sm:px-8">
              <div className="w-full flex items-center justify-center min-h-[90px] sm:min-h-[110px]">
                <p className="text-lg sm:text-2xl md:text-3xl font-black text-white leading-relaxed tracking-wide drop-shadow-[0_0_20px_rgba(255,255,255,0.4)] animate-fade-in font-mono">
                  "{storyLines[activeLineIdx]}"
                </p>
              </div>

              <div className="flex gap-2 justify-center mt-3">
                {storyLines.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === activeLineIdx
                        ? "w-8 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]"
                        : i < activeLineIdx
                        ? "w-3 bg-white/40"
                        : "w-2 bg-white/10"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* BOTTOM CONTROLS (Centered Action Button) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-3 border-t border-white/10 pt-3 font-mono text-xs px-2 shrink-0">
            <div className="flex items-center justify-center sm:justify-start gap-2.5">
              <button
                onClick={() => {
                  if (audioRef.current) audioRef.current.pause();
                  setActiveLineIdx((prev) => Math.max(0, prev - 1));
                }}
                disabled={activeLineIdx === 0}
                className="p-2 rounded-xl bg-black/60 border border-white/10 hover:bg-white/15 disabled:opacity-30 text-white transition-all cursor-pointer backdrop-blur"
              >
                <ChevronLeft size={16} />
              </button>

              <button
                onClick={toggleBriefingPlay}
                className="p-2 rounded-xl bg-white text-black font-bold hover:bg-slate-200 transition-all cursor-pointer"
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>

              <button
                onClick={() => {
                  if (audioRef.current) {
                    audioRef.current.pause();
                    notifyAudioPause();
                  }
                  if (activeLineIdx < storyLines.length - 1) {
                    setActiveLineIdx((prev) => prev + 1);
                  } else {
                    enterWorkbench();
                  }
                }}
                className="p-2 rounded-xl bg-black/60 border border-white/10 hover:bg-white/15 text-white transition-all cursor-pointer backdrop-blur"
              >
                <ChevronRight size={16} />
              </button>

              <span className="text-slate-400 text-xs ml-2 font-mono">
                {activeLineIdx + 1} / {storyLines.length}
              </span>
            </div>

            <div className="flex justify-center">
              <button
                onClick={enterWorkbench}
                className="px-6 py-2.5 bg-white hover:bg-slate-200 text-black font-bold rounded-xl transition-all shadow-[0_0_25px_rgba(255,255,255,0.25)] cursor-pointer text-xs uppercase tracking-wider whitespace-nowrap"
              >
                {isTimerRunning ? "Return to Workbench \u2192" : "Skip to Workbench \u2192"}
              </button>
            </div>

            <div className="hidden sm:block"></div>
          </div>
        </div>
      ) : (
        /* 2. INTERACTIVE FORENSIC LABORATORY WORKBENCH */
        <div className="flex-1 flex flex-col justify-between overflow-y-auto px-4 sm:px-6 py-2 animate-fade-in relative z-10 w-full">
          {/* Admin Command Broadcast Banner */}
          {activeBroadcast && (
            <div className="max-w-4xl mx-auto w-full mb-3 p-3 rounded-2xl bg-cyan-950/90 border border-cyan-400/60 shadow-[0_0_20px_rgba(34,211,238,0.25)] flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-3 duration-200">
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-cyan-400/20 text-cyan-300 mt-0.5">
                  <Radio size={16} className="animate-pulse" />
                </div>
                <div>
                  <div className="text-[10px] text-cyan-300 font-extrabold tracking-wider uppercase">
                    INCOMING TRANSMISSION // {activeBroadcast.type.toUpperCase()}
                  </div>
                  <div className="text-xs text-white font-mono mt-0.5">
                    {activeBroadcast.message}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  sessionStorage.setItem("mystery_last_broadcast_id", activeBroadcast.id);
                  setActiveBroadcast(null);
                }}
                className="p-1 rounded-lg hover:bg-cyan-900/50 text-cyan-300 hover:text-white transition-colors cursor-pointer"
                title="Dismiss transmission"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <div className="flex-1 flex items-center justify-center py-1 max-w-6xl mx-auto w-full">
            <Suspense
              fallback={
                <div className="flex flex-col items-center justify-center h-64 font-mono text-xs text-slate-400 gap-2">
                  <Loader2 size={20} className="animate-spin text-cyan-400" />
                  <span>CALIBRATING SENSOR HARDWARE...</span>
                </div>
              }
            >
              {config.id === "level1" && <ImageCanvas config={config} onEvidenceReady={() => setIsEvidenceReady(true)} />}
              {config.id === "level2" && <AudioLab config={config} onEvidenceReady={() => setIsEvidenceReady(true)} />}
              {config.id === "level3" && <VideoForensics config={config} onEvidenceReady={() => setIsEvidenceReady(true)} />}
              {config.id === "level4" && <StegoExtractor config={config} onEvidenceReady={() => setIsEvidenceReady(true)} />}
              {config.id === "level5" && <CipherWorkbench config={config} onEvidenceReady={() => setIsEvidenceReady(true)} />}
              {config.id === "level6" && <PacketInspector config={config} onEvidenceReady={() => setIsEvidenceReady(true)} />}
              {config.id === "level7" && <MatrixUnscrambler config={config} onEvidenceReady={() => setIsEvidenceReady(true)} />}
              {config.id === "level8" && <FourierLab config={config} onEvidenceReady={() => setIsEvidenceReady(true)} />}
              {config.id === "level9" && <EllipticLab config={config} onEvidenceReady={() => setIsEvidenceReady(true)} />}
              {config.id === "level10" && <AutomataLab config={config} onEvidenceReady={() => setIsEvidenceReady(true)} />}
              {config.id === "level11" && <PhaseLab config={config} onEvidenceReady={() => setIsEvidenceReady(true)} />}
              {config.id === "level12" && <GraphLab config={config} onEvidenceReady={() => setIsEvidenceReady(true)} />}
              {config.id === "final" && <FinalBossLab config={config} onEvidenceReady={() => setIsEvidenceReady(true)} />}
            </Suspense>
          </div>

          {/* VERIFICATION TERMINAL DOCK */}
          {config.id !== "final" && (
            <div className="max-w-4xl mx-auto w-full pt-1">
              <AnswerSubmissionBox
                levelConfig={config}
                onSolveSuccess={handleNextLevel}
              />
            </div>
          )}
        </div>
      )}

      {/* Required Docs Modal */}
      {showDocsModal && (
        <RequiredDocsModal onClose={() => setShowDocsModal(false)} />
      )}

      {/* Case Vault Modal */}
      {showVaultModal && (
        <EvidenceVaultModal
          onClose={() => setShowVaultModal(false)}
          currentLevelId={config.id}
        />
      )}

      {/* Live Leaderboard Modal */}
      {showLeaderboardModal && (
        <LeaderboardModal
          onClose={() => setShowLeaderboardModal(false)}
          currentLevelId={config.id}
        />
      )}

      {/* Time Expired Modal */}
      {showTimeoutModal && (
        <TimeExpiredModal
          levelConfig={config}
          onProceed={handleNextLevel}
        />
      )}

      {/* On-Demand Secure Hint Modal */}
      {showHintModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0c] border border-white/15 rounded-3xl max-w-lg w-full p-6 font-mono text-xs shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <HelpCircle size={18} className="text-white" />
                <span>CASE HINTS // {config.title.toUpperCase()}</span>
              </div>
              <button
                onClick={() => {
                  setShowHintModal(false);
                  setHintError("");
                }}
                className="text-slate-400 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            {hintError && (
              <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-bold animate-fade-in">
                {hintError}
              </div>
            )}

            <div className="flex flex-col gap-3 py-2">
              {[0, 1, 2].map((i) => {
                const revealed = isHintRevealed(config.id, i);
                const hintText = getRevealedHintText(config.id, i);
                const isPrereqMet = i === 0 || isHintRevealed(config.id, i - 1);
                const cost = hintCosts[i] || 2;
                const isLoading = hintLoadingIdx === i;

                return (
                  <div
                    key={i}
                    className={`p-4 rounded-2xl border transition-all ${
                      revealed
                        ? "border-white/20 bg-white/[0.04]"
                        : isPrereqMet
                        ? "border-white/10 bg-white/[0.02]"
                        : "border-white/5 bg-black/40 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-extrabold text-white flex items-center gap-1.5">
                        <span>HINT #{i + 1}</span>
                        {revealed && (
                          <span className="text-[10px] text-slate-400 font-bold uppercase">[UNLOCKED]</span>
                        )}
                      </span>

                      {!revealed && (
                        <button
                          disabled={!isPrereqMet || isLoading}
                          onClick={() => handleUnlockHint(i, cost)}
                          className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs flex items-center gap-1 ${
                            isPrereqMet && !isLoading
                              ? "bg-white text-black hover:bg-slate-200 cursor-pointer shadow"
                              : "bg-white/10 text-slate-500 cursor-not-allowed"
                          }`}
                        >
                          {isLoading ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            !isPrereqMet && <Lock size={12} />
                          )}
                          <span>
                            {isLoading ? "Retrieving..." : `Unlock (-${cost} pts)`}
                          </span>
                        </button>
                      )}
                    </div>

                    {revealed ? (
                      <p className="text-slate-200 leading-relaxed text-xs pt-1 border-t border-white/10">
                        {hintText || "Clue verified and logged to forensics terminal."}
                      </p>
                    ) : (
                      <p className="text-slate-500 italic text-[11px]">
                        {!isPrereqMet
                          ? `Locked. You must unlock Hint #${i} before revealing this clue.`
                          : `Hint locked. Deducts ${cost} points from net investigation score upon retrieval.`}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
