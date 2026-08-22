import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { HelpCircle, AlertTriangle, X, Briefcase, Volume2, VolumeX, ChevronLeft, ChevronRight, Pause, Play, Trophy, Radio, RotateCcw, BookOpen } from "lucide-react";
import AnswerSubmissionBox from "../components/AnswerSubmissionBox.jsx";
import EvidenceVaultModal from "../components/EvidenceVaultModal.jsx";
import RequiredDocsModal from "../components/RequiredDocsModal.jsx";
import { LEVEL_BRIEFINGS } from "../data/levelBriefings.js";

// Renderers
import ImageCanvas from "./renderers/ImageCanvas.jsx";
import AudioLab from "./renderers/AudioLab.jsx";
import VideoForensics from "./renderers/VideoForensics.jsx";
import StegoExtractor from "./renderers/StegoExtractor.jsx";
import CipherWorkbench from "./renderers/CipherWorkbench.jsx";
import PacketInspector from "./renderers/PacketInspector.jsx";
import MatrixUnscrambler from "./renderers/MatrixUnscrambler.jsx";
import EllipticLab from "./renderers/EllipticLab.jsx";
import FourierLab from "./renderers/FourierLab.jsx";
import AutomataLab from "./renderers/AutomataLab.jsx";
import PhaseLab from "./renderers/PhaseLab.jsx";
import GraphLab from "./renderers/GraphLab.jsx";
import FinalBossLab from "./renderers/FinalBossLab.jsx";
import { useGameStore } from "../store/useGameStore.js";

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
import finalBoss from "../levels/finalBoss/config.js";

const LEVEL_CONFIGS = {
  level1, level2, level3, level4, level5, level6,
  level7, level8, level9, level10, level11, level12,
  final: finalBoss
};

const LEVEL_ORDER = [
  "level1", "level2", "level3", "level4",
  "level5", "level6", "level7", "level8",
  "level9", "level10", "level11", "level12",
  "final"
];

export default function LabEngine() {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const config = LEVEL_CONFIGS[levelId] || level1;

  const { isLevelSolved, isHintRevealed, revealHint, getScore } = useGameStore();
  const isSolved = isLevelSolved(config.id);
  const liveScore = getScore();

  const [viewMode, setViewMode] = useState("briefing"); // 'briefing' | 'workbench'
  const [showVaultModal, setShowVaultModal] = useState(false);
  const [showHintModal, setShowHintModal] = useState(false);
  const [showDocsModal, setShowDocsModal] = useState(false);

  // Synchronized Cinematic Briefing Lines
  const [activeLineIdx, setActiveLineIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const audioRef = useRef(null);

  const storyLines = LEVEL_BRIEFINGS[config.id] || [
    "Forensic artifact decrypted.",
    "Inspect raw evidence data in the workbench."
  ];

  const currentIdx = LEVEL_ORDER.indexOf(levelId);
  const nextLevelId = currentIdx < LEVEL_ORDER.length - 1 ? LEVEL_ORDER[currentIdx + 1] : null;

  // Background video path for this level
  const bgVideoSrc = `/script_bg/${config.id}_bg.mp4`;

  useEffect(() => {
    setViewMode("briefing");
    setActiveLineIdx(0);
    setIsPlaying(true);
  }, [levelId]);

  // Robust Autoplay Studio Human Speech MP3 and advance on end
  const playStudioBriefingAudio = (lvlId, idx) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audioUrl = `/audio/briefing_${lvlId}_${idx}.mp3`;
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.onended = () => {
      if (idx < storyLines.length - 1) {
        setActiveLineIdx(idx + 1);
      } else {
        setIsPlaying(false);
        setTimeout(() => {
          setViewMode("workbench");
        }, 300);
      }
    };

    audio.onerror = () => {
      setTimeout(() => {
        if (idx < storyLines.length - 1) {
          setActiveLineIdx(idx + 1);
        } else {
          setIsPlaying(false);
          setViewMode("workbench");
        }
      }, 4000);
    };

    if (voiceEnabled) {
      audio.play().catch(() => {
        setTimeout(() => {
          if (idx < storyLines.length - 1) {
            setActiveLineIdx(idx + 1);
          } else {
            setIsPlaying(false);
            setViewMode("workbench");
          }
        }, 4000);
      });
    }
  };

  useEffect(() => {
    if (viewMode === "briefing" && isPlaying) {
      playStudioBriefingAudio(config.id, activeLineIdx);
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [viewMode, activeLineIdx, isPlaying, voiceEnabled, config.id]);

  const handleNextLevel = () => {
    if (nextLevelId) {
      if (audioRef.current) audioRef.current.pause();
      navigate(`/investigate/${nextLevelId}`);
    }
  };

  const handleReplayBriefing = () => {
    if (audioRef.current) audioRef.current.pause();
    setActiveLineIdx(0);
    setIsPlaying(true);
    setViewMode("briefing");
  };

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="fixed inset-0 h-screen w-screen bg-black text-white flex flex-col font-mono select-none overflow-hidden"
    >
      {/* Script Background Video */}
      <div className="fixed inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
        <video
          key={bgVideoSrc}
          src={bgVideoSrc}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-40 filter brightness-45 saturate-80"
        />
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />
      </div>

      {/* TOP STATUS BAR HUD */}
      <div className="h-12 border-b border-white/10 px-5 flex items-center justify-between text-xs font-mono bg-black/70 backdrop-blur-md relative z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-white/10 border border-white/20 text-white font-bold tracking-wider text-xs">
            <Trophy size={13} className="text-white" />
            <span>SCORE: {liveScore} PTS</span>
          </div>

          <span className="text-slate-500">|</span>
          <span className="text-slate-400 uppercase tracking-widest text-[11px]">
            // LEVEL: {config.id.toUpperCase()}
          </span>
        </div>

        {/* Top-Right Quick Actions */}
        <div className="flex items-center gap-2">
          {viewMode === "briefing" ? (
            <button
              onClick={() => {
                if (voiceEnabled && audioRef.current) audioRef.current.pause();
                setVoiceEnabled(!voiceEnabled);
              }}
              className="px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 hover:bg-white/15 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-mono cursor-pointer backdrop-blur"
            >
              {voiceEnabled ? <Volume2 size={15} className="text-white" /> : <VolumeX size={15} className="text-slate-500" />}
              <span className="hidden sm:inline">{voiceEnabled ? "Voice: ON" : "Voice: OFF"}</span>
            </button>
          ) : (
            <>
              <button
                onClick={handleReplayBriefing}
                className="px-3 py-1.5 rounded-xl bg-black/60 hover:bg-white/15 border border-white/20 text-slate-200 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur shadow-md text-xs font-bold"
                title="Re-play pre-level briefing narration"
              >
                <Radio size={13} className="text-white animate-pulse" />
                <span>PLAY BRIEFING</span>
              </button>

              <button
                onClick={() => setShowDocsModal(true)}
                className="px-3 py-1.5 rounded-xl bg-black/60 hover:bg-white/15 border border-white/20 text-slate-200 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur shadow-md text-xs font-bold"
                title="Open Required Forensic Documentation & Math Bible"
              >
                <BookOpen size={13} className="text-white" />
                <span>REQUIRED DOCS</span>
              </button>

              <button
                onClick={() => setShowVaultModal(true)}
                className="px-3 py-1.5 rounded-xl bg-black/60 hover:bg-white/15 border border-white/15 text-slate-200 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur text-xs"
                title="Open Case Vault"
              >
                <Briefcase size={14} />
                <span>CASE VAULT</span>
              </button>

              <button
                onClick={() => setShowHintModal(true)}
                className="px-3 py-1.5 rounded-xl bg-black/60 hover:bg-white/15 border border-white/15 text-slate-200 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur text-xs"
                title="View Hints"
              >
                <HelpCircle size={14} />
                <span>HINTS ({(config.hints || []).length})</span>
              </button>
            </>
          )}
        </div>
      </div>

      {viewMode === "briefing" ? (
        /* 1. CINEMATIC STORY BRIEFING */
        <div className="w-full h-[calc(100vh-3rem)] flex flex-col justify-between p-4 sm:p-6 relative z-10 overflow-hidden box-border">
          {/* Centered Floating Subtitles */}
          <div className="flex-1 flex items-center justify-center relative w-full overflow-hidden">
            <div className="w-full flex flex-col items-center justify-center relative max-w-5xl px-4">
              {storyLines.map((line, idx) => {
                const isCurrent = idx === activeLineIdx;
                const isNext = idx === activeLineIdx + 1;

                if (idx > activeLineIdx + 1) return null;

                return (
                  <div
                    key={idx}
                    className="text-center font-mono transition-all duration-500 ease-out absolute w-full px-4"
                    style={{
                      transform: isCurrent
                        ? "translateY(0px) scale(1)"
                        : isNext
                        ? "translateY(60px) scale(0.92)"
                        : "translateY(-60px) scale(0.92)",
                      opacity: isCurrent ? 1 : isNext ? 0.35 : 0,
                      filter: isCurrent ? "blur(0px)" : isNext ? "blur(4px)" : "blur(8px)",
                      color: isCurrent ? "#FFFFFF" : isNext ? "#94A3B8" : "#475569",
                      fontWeight: isCurrent ? 700 : 400,
                      fontSize: isCurrent ? "26px" : "18px",
                      lineHeight: "1.4",
                      textShadow: isCurrent ? "0 0 25px rgba(0,0,0,0.95), 0 2px 10px rgba(0,0,0,0.9)" : "none",
                      pointerEvents: "none"
                    }}
                  >
                    "{line}"
                  </div>
                );
              })}
            </div>
          </div>

          {/* BOTTOM CONTROLS */}
          <div className="flex items-center justify-between border-t border-white/10 pt-3 font-mono text-xs px-2 shrink-0">
            <div className="flex items-center gap-2.5">
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
                onClick={() => {
                  if (isPlaying) {
                    if (audioRef.current) audioRef.current.pause();
                    setIsPlaying(false);
                  } else {
                    setIsPlaying(true);
                    if (audioRef.current) audioRef.current.play();
                    else playStudioBriefingAudio(config.id, activeLineIdx);
                  }
                }}
                className="p-2 rounded-xl bg-white text-black font-bold hover:bg-slate-200 transition-all cursor-pointer"
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>

              <button
                onClick={() => {
                  if (audioRef.current) audioRef.current.pause();
                  if (activeLineIdx < storyLines.length - 1) {
                    setActiveLineIdx((prev) => prev + 1);
                  } else {
                    setIsPlaying(false);
                    setViewMode("workbench");
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

            <button
              onClick={() => {
                if (audioRef.current) audioRef.current.pause();
                setIsPlaying(false);
                setViewMode("workbench");
              }}
              className="px-5 py-2 bg-white hover:bg-slate-200 text-black font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] cursor-pointer text-xs"
            >
              Skip to Workbench &rarr;
            </button>
          </div>
        </div>
      ) : (
        /* 2. INTERACTIVE FORENSIC LABORATORY WORKBENCH */
        <div className="flex-1 flex flex-col justify-between overflow-y-auto px-6 py-3 animate-fade-in relative z-10 w-full">
          <div className="flex-1 flex items-center justify-center py-1 max-w-6xl mx-auto w-full">
            {config.id === "level1" && <ImageCanvas config={config} />}
            {config.id === "level2" && <AudioLab config={config} />}
            {config.id === "level3" && <VideoForensics config={config} />}
            {config.id === "level4" && <StegoExtractor config={config} />}
            {config.id === "level5" && <CipherWorkbench config={config} />}
            {config.id === "level6" && <PacketInspector config={config} />}
            {config.id === "level7" && <MatrixUnscrambler config={config} />}
            {config.id === "level8" && <EllipticLab config={config} />}
            {config.id === "level9" && <FourierLab config={config} />}
            {config.id === "level10" && <AutomataLab config={config} />}
            {config.id === "level11" && <PhaseLab config={config} />}
            {config.id === "level12" && <GraphLab config={config} />}
            {config.id === "final" && <FinalBossLab config={config} />}
          </div>

          {/* VERIFICATION TERMINAL DOCK (Hidden on final boss since it uses its dedicated master interface) */}
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
        <RequiredDocsModal
          onClose={() => setShowDocsModal(false)}
        />
      )}

      {/* Case Vault Modal */}
      {showVaultModal && (
        <EvidenceVaultModal
          onClose={() => setShowVaultModal(false)}
          currentLevelId={config.id}
        />
      )}

      {/* Hint Modal */}
      {showHintModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-black border border-white/20 rounded-2xl max-w-lg w-full p-6 font-mono text-xs shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <HelpCircle size={18} />
                <span>CASE HINTS // {config.title.toUpperCase()}</span>
              </div>
              <button
                onClick={() => setShowHintModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-3 py-2">
              {(config.hints || []).map((h, i) => {
                const revealed = isHintRevealed(config.id, i);
                return (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl border border-white/10 bg-white/5 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-300">HINT {i + 1}</span>
                      {!revealed && (
                        <button
                          onClick={() => revealHint(config.id, i, h.cost || 5)}
                          className="px-3 py-1 bg-white text-black font-bold rounded-lg hover:bg-slate-200 cursor-pointer"
                        >
                          Unlock (-{h.cost || 5} pts)
                        </button>
                      )}
                    </div>
                    {revealed ? (
                      <p className="text-white leading-relaxed text-xs">{h.text}</p>
                    ) : (
                      <p className="text-slate-500 italic text-[11px]">
                        Hint locked. Consumes {h.cost || 5} points from investigation score.
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
