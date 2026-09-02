import React, { useState, useEffect, useRef, useCallback } from "react";
import { Radio, Play, Square, Sliders, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";

const SECRET_CODE = "BXZ19";
const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Base target frequencies (Hz) for BXZ19
const TARGET_FREQS = [720, 675, 660, 675, 810];

// Correct alignment position shifted to the right (+45Hz)
const TARGET_SHIFT = 45;

export default function MatrixUnscrambler({ config, onEvidenceReady }) {
  // Discrete X-Axis Shift (step=3Hz). Initial position at -45Hz. Target is deltaShift === 45 (to the right)
  const [deltaShift, setDeltaShift] = useState(-45);
  const [isPlayingRef, setIsPlayingRef] = useState(false);
  const [isPlayingTuner, setIsPlayingTuner] = useState(false);
  const [activeStep, setActiveStep] = useState(null);

  // Calibration check feedback: null | "low" | "high" | "perfect"
  const [alignStatus, setAlignStatus] = useState(null);
  const [isLocked, setIsLocked] = useState(false);

  // Inspector cursor on the spectrum (Hz rounded to nearest 5Hz)
  const [hoveredHz, setHoveredHz] = useState(null);

  const audioCtxRef = useRef(null);
  const animFrameRef = useRef(null);
  const canvasRef = useRef(null);
  const activeNodesRef = useRef([]);

  // Stored frozen peak when halted
  const frozenHaltedFreqRef = useRef(null);
  const activeStepRef = useRef(null);

  useEffect(() => {
    onEvidenceReady?.();
    return () => {
      stopAllAudio();
    };
  }, [onEvidenceReady]);

  const stopAllAudio = useCallback((preserveHaltPeak = false) => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (activeNodesRef.current && activeNodesRef.current.length > 0) {
      activeNodesRef.current.forEach((audioNode) => {
        try {
          if (audioNode && typeof audioNode.stop === "function") {
            audioNode.stop();
          }
          if (audioNode && typeof audioNode.disconnect === "function") {
            audioNode.disconnect();
          }
        } catch (e) {}
      });
      activeNodesRef.current = [];
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      try {
        audioCtxRef.current.close();
      } catch (e) {}
      audioCtxRef.current = null;
    }
    setIsPlayingRef(false);
    setIsPlayingTuner(false);

    if (!preserveHaltPeak) {
      frozenHaltedFreqRef.current = null;
      setActiveStep(null);
      activeStepRef.current = null;
    }
  }, []);

  // Draw Oscilloscope Canvas: shows only active playing tone or isolated halted peak (never dumps all peaks at once)
  const drawCanvas = useCallback((activeFreq, isHalted) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const maxDisplayHz = 1200;

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);

    // Oscilloscope Grid Lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
    ctx.lineWidth = 1;
    for (let y = 0; y < height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    for (let x = 0; x < width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Target Bandwidth Range Indicator (300Hz to 850Hz)
    const xStart = (300 / maxDisplayHz) * width;
    const xEnd = (850 / maxDisplayHz) * width;
    ctx.fillStyle = isLocked ? "rgba(255, 255, 255, 0.04)" : "rgba(255, 255, 255, 0.015)";
    ctx.fillRect(xStart, 0, xEnd - xStart, height);
    ctx.strokeStyle = isLocked ? "rgba(255, 255, 255, 0.3)" : "rgba(255, 255, 255, 0.1)";
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(xStart, 0, xEnd - xStart, height);
    ctx.setLineDash([]);

    // Determine target frequency to render (single active or halted peak only)
    const renderFreq = isHalted ? frozenHaltedFreqRef.current : activeFreq;

    ctx.beginPath();
    ctx.strokeStyle = renderFreq ? "#ffffff" : "rgba(255, 255, 255, 0.25)";
    ctx.lineWidth = renderFreq ? 2.2 : 1.5;

    for (let px = 0; px < width; px++) {
      const hz = (px / width) * maxDisplayHz;
      let amp = 0.02; // Flat silent 0 baseline

      if (renderFreq) {
        const d = Math.abs(hz - renderFreq);
        if (d < 35) {
          amp = Math.max(amp, 0.85 * Math.exp(-Math.pow(d / 8, 2)));
        }
      }

      const y = height - (amp * (height - 24));
      if (px === 0) ctx.moveTo(px, y);
      else ctx.lineTo(px, y);
    }
    ctx.stroke();

    // Subtle fill under active peak
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.fillStyle = renderFreq ? "rgba(255, 255, 255, 0.06)" : "transparent";
    ctx.fill();

    // Draw Hovered Cursor Readout (with 5Hz rounded probe)
    if (hoveredHz !== null && hoveredHz !== undefined) {
      const cursorX = (hoveredHz / maxDisplayHz) * width;
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.moveTo(cursorX, 0);
      ctx.lineTo(cursorX, height);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [hoveredHz, isLocked]);

  useEffect(() => {
    drawCanvas(null, !!frozenHaltedFreqRef.current);
  }, [deltaShift, isLocked, drawCanvas]);

  // Play Reference Audio purely through speakers (audio-only)
  const playReferenceAudio = async () => {
    stopAllAudio(false);

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    audioCtxRef.current = ctx;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.28, ctx.currentTime);
    masterGain.connect(ctx.destination);

    const slotDuration = 0.8;
    const totalDuration = TARGET_FREQS.length * slotDuration; // 4.0s

    TARGET_FREQS.forEach((f, idx) => {
      const startTime = ctx.currentTime + (idx * slotDuration);
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(f, startTime);
      osc.connect(masterGain);
      osc.start(startTime);
      osc.stop(startTime + slotDuration);
      activeNodesRef.current.push(osc);
    });

    setIsPlayingRef(true);

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed >= totalDuration) {
        clearInterval(interval);
        setIsPlayingRef(false);
        setActiveStep(null);
        activeStepRef.current = null;
      } else {
        const currentIdx = Math.min(4, Math.floor(elapsed / slotDuration));
        setActiveStep(currentIdx + 1);
        activeStepRef.current = currentIdx + 1;
      }
    }, 100);
  };

  // Play Tuner Audio (Shifted frequencies based on slider relative to TARGET_SHIFT)
  const playTunerAudio = async () => {
    stopAllAudio(false);

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    audioCtxRef.current = ctx;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.28, ctx.currentTime);
    masterGain.connect(ctx.destination);

    const slotDuration = 0.8;
    const totalDuration = TARGET_FREQS.length * slotDuration;
    const offsetFromTarget = deltaShift - TARGET_SHIFT;

    TARGET_FREQS.forEach((f, idx) => {
      const shiftedFreq = Math.max(100, f + offsetFromTarget);
      const startTime = ctx.currentTime + (idx * slotDuration);
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(shiftedFreq, startTime);
      osc.connect(masterGain);
      osc.start(startTime);
      osc.stop(startTime + slotDuration);
      activeNodesRef.current.push(osc);
    });

    setIsPlayingTuner(true);

    const startTime = Date.now();
    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed >= totalDuration) {
        setIsPlayingTuner(false);
        setActiveStep(null);
        activeStepRef.current = null;
        drawCanvas(null, false);
      } else {
        const currentIdx = Math.min(4, Math.floor(elapsed / slotDuration));
        const currentPlayingFreq = TARGET_FREQS[currentIdx] + offsetFromTarget;
        setActiveStep(currentIdx + 1);
        activeStepRef.current = currentIdx + 1;
        drawCanvas(currentPlayingFreq, false);
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
  };

  // Halt Handler: Freeze ONLY that specific active tone's peak on the spectrum
  const handleHaltAudio = () => {
    const currentStep = activeStepRef.current;
    if (currentStep && isPlayingTuner) {
      const offsetFromTarget = deltaShift - TARGET_SHIFT;
      const haltedFreq = TARGET_FREQS[currentStep - 1] + offsetFromTarget;
      frozenHaltedFreqRef.current = haltedFreq;
      stopAllAudio(true);
      drawCanvas(haltedFreq, true);
    } else {
      stopAllAudio(false);
      drawCanvas(null, false);
    }
  };

  // Perform Alignment Diagnostic Check against TARGET_SHIFT (+45Hz)
  const handleCheckAlignment = () => {
    if (deltaShift < TARGET_SHIFT) {
      setAlignStatus("low");
      setIsLocked(false);
      frozenHaltedFreqRef.current = null;
      drawCanvas(null, false);
    } else if (deltaShift > TARGET_SHIFT) {
      setAlignStatus("high");
      setIsLocked(false);
      frozenHaltedFreqRef.current = null;
      drawCanvas(null, false);
    } else {
      setAlignStatus("perfect");
      setIsLocked(true);
      frozenHaltedFreqRef.current = null;
      drawCanvas(null, false);
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const maxDisplayHz = 1200;
    const rawHz = (x / rect.width) * maxDisplayHz;
    // Snap/round to nearest 5Hz multiple
    const roundedHz = Math.round(rawHz / 5) * 5;
    const clamped = Math.max(0, Math.min(1200, roundedHz));
    setHoveredHz(clamped);
  };

  const handleCanvasMouseLeave = () => {
    setHoveredHz(null);
  };

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="flex flex-col gap-4 w-full font-mono text-xs select-none max-w-5xl mx-auto"
    >
      <div className="rounded-2xl border border-white/15 p-5 flex flex-col bg-black shadow-2xl relative w-full gap-4">
        
        {/* Top Header HUD */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2 text-white font-bold text-xs">
            <Radio size={15} className="text-white" />
            <span>DATA SONIFICATION CIPHER // PROTOCOL SEED V₀ = 17</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">STATUS:</span>
            <span className={`px-2 py-0.5 rounded font-bold uppercase ${
              isLocked
                ? "bg-white text-black font-extrabold shadow"
                : "bg-white/10 text-slate-300 border border-white/10"
            }`}>
              {isLocked ? "HARMONIC LOCK ACTIVE" : "MISALIGNED (OFF-TUNE)"}
            </span>
          </div>
        </div>

        {/* Real-time Oscilloscope Spectrum Canvas */}
        <div className="relative rounded-xl overflow-hidden border border-white/15 bg-black h-60 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={760}
            height={240}
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={handleCanvasMouseLeave}
            className="w-full h-full block cursor-crosshair"
          />

          {(isPlayingRef || isPlayingTuner) && (
            <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/90 px-2.5 py-1 rounded border border-white/30 text-[10px] text-white font-mono">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              <span>
                {isPlayingRef
                  ? `PLAYING REFERENCE AUDIO BROADCAST // STEP #${activeStep || 1}`
                  : `TRANSLATING TUNER CARRIER // STEP #${activeStep || 1}`}
              </span>
            </div>
          )}

          {/* Frozen Halt Badge */}
          {frozenHaltedFreqRef.current && !isPlayingTuner && (
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-white text-black font-bold text-[10px] font-mono shadow">
              FROZEN CARRIER TONE // PROBE PEAK ON CANVAS
            </div>
          )}

          {/* Cursor Frequency Readout HUD (Rounded to nearest 5Hz) */}
          {hoveredHz !== null && (
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded bg-black/90 border border-white/30 text-white font-mono text-[11px] shadow">
              PROBE: <span className="font-bold">{hoveredHz} Hz</span>
            </div>
          )}

          {/* Frequency Axis Labels */}
          <div className="absolute bottom-1 left-0 right-0 px-3 flex justify-between text-[9px] text-slate-500 pointer-events-none">
            <span>0 Hz</span>
            <span>300 Hz (Carrier Floor)</span>
            <span>600 Hz</span>
            <span>850 Hz</span>
            <span>1200 Hz</span>
          </div>
        </div>

        {/* Discrete Translation Tuning Slider & Alignment Diagnostics */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sliders size={14} className="text-white" />
              <span className="text-white font-bold text-xs uppercase tracking-wider">
                X-AXIS SPECTRUM TRANSLATION TUNER:
              </span>
            </div>

            <button
              onClick={handleCheckAlignment}
              className="px-4 py-1.5 rounded-xl bg-white hover:bg-slate-200 text-black font-extrabold text-xs transition-all cursor-pointer shadow"
            >
              <span>CHECK HARMONIC ALIGNMENT</span>
            </button>
          </div>

          {/* Discrete slider (step=3Hz, range -120 to +120, target is +45 on the right) */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-400 font-bold">◀ SHIFT LEFT</span>
            <input
              type="range"
              min="-120"
              max="120"
              step="3"
              value={deltaShift}
              onChange={(e) => {
                setDeltaShift(parseInt(e.target.value, 10));
                setAlignStatus(null);
                setIsLocked(false);
                frozenHaltedFreqRef.current = null;
              }}
              className="flex-1 accent-white cursor-pointer h-2 bg-white/10 rounded-lg appearance-none"
            />
            <span className="text-[10px] text-slate-400 font-bold">SHIFT RIGHT ▶</span>
          </div>

          {/* Alignment Diagnostic Status Output */}
          {alignStatus === "low" && (
            <div className="p-3 rounded-xl bg-black border border-white/30 text-slate-200 text-xs flex items-center gap-2 font-mono">
              <ArrowRight size={15} className="text-white shrink-0 animate-pulse" />
              <span>CALIBRATION MISMATCH: Frequency carrier is <strong>TOO LOW</strong>. Shift right to align the wave.</span>
            </div>
          )}

          {alignStatus === "high" && (
            <div className="p-3 rounded-xl bg-black border border-white/30 text-slate-200 text-xs flex items-center gap-2 font-mono">
              <ArrowLeft size={15} className="text-white shrink-0 animate-pulse" />
              <span>CALIBRATION MISMATCH: Frequency carrier is <strong>TOO HIGH</strong>. Shift left to align the wave.</span>
            </div>
          )}

          {alignStatus === "perfect" && (
            <div className="p-3 rounded-xl bg-white text-black font-bold text-xs flex items-center gap-2 shadow">
              <CheckCircle2 size={16} className="text-black shrink-0" />
              <span>FOUND! (HARMONIC RESONANCE LOCKED)</span>
            </div>
          )}

          {/* Forensic Guidance Note */}
          <div className="text-[10px] text-slate-400 italic">
            * Once resonance is locked, play the tuner sequence and click HALT to freeze and probe each individual peak frequency.
          </div>
        </div>

        {/* Comparative Audio Playback Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={isPlayingRef ? () => stopAllAudio(false) : playReferenceAudio}
            className={`p-3 rounded-xl font-bold text-xs tracking-wider transition-all cursor-pointer border flex items-center justify-center gap-2 ${
              isPlayingRef
                ? "bg-white text-black border-white shadow"
                : "bg-black hover:bg-white/10 border-white/20 text-white"
            }`}
          >
            {isPlayingRef ? <Square size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
            <span>{isPlayingRef ? "HALT AUDIO" : "1. PLAY REFERENCE BROADCAST (TARGET)"}</span>
          </button>

          <button
            onClick={isPlayingTuner ? handleHaltAudio : playTunerAudio}
            className={`p-3 rounded-xl font-bold text-xs tracking-wider transition-all cursor-pointer border flex items-center justify-center gap-2 ${
              isPlayingTuner
                ? "bg-white text-black border-white shadow"
                : "bg-black hover:bg-white/10 border-white/20 text-white"
            }`}
          >
            {isPlayingTuner ? <Square size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
            <span>{isPlayingTuner ? "HALT AUDIO" : "2. PLAY CURRENT TUNER RECEIVER (SLIDER PITCH)"}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
