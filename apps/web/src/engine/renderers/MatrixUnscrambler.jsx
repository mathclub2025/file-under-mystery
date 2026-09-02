import React, { useState, useEffect, useRef, useCallback } from "react";
import { Radio, Play, Square, Sliders, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";

const SECRET_CODE = "BXZ19";
const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Target peak frequencies (Hz) for BXZ19
const TARGET_FREQS = [720, 675, 660, 675, 810];

export default function MatrixUnscrambler({ config, onEvidenceReady }) {
  // Discrete X-Axis Shift (in smaller discrete steps of 3Hz). Starts off-tune at -45Hz. Target is deltaShift === 0
  const [deltaShift, setDeltaShift] = useState(-45);
  const [isPlayingRef, setIsPlayingRef] = useState(false);
  const [isPlayingTuner, setIsPlayingTuner] = useState(false);
  const [activeStep, setActiveStep] = useState(null);

  // Calibration check feedback: null | "low" | "high" | "perfect"
  const [alignStatus, setAlignStatus] = useState(null);
  const [isLocked, setIsLocked] = useState(false);

  // Inspector cursor on the spectrum (Hz)
  const [hoveredHz, setHoveredHz] = useState(null);

  const audioCtxRef = useRef(null);
  const animFrameRef = useRef(null);
  const canvasRef = useRef(null);
  const activeNodesRef = useRef([]);

  useEffect(() => {
    onEvidenceReady?.();
    return () => {
      stopAllAudio();
    };
  }, [onEvidenceReady]);

  const stopAllAudio = useCallback(() => {
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
    setActiveStep(null);
  }, []);

  // Draw Oscilloscope Canvas with X-Axis Translation
  const drawCanvas = useCallback((shift, activeFreq, locked) => {
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
    ctx.fillStyle = locked ? "rgba(255, 255, 255, 0.06)" : "rgba(255, 255, 255, 0.02)";
    ctx.fillRect(xStart, 0, xEnd - xStart, height);
    ctx.strokeStyle = locked ? "rgba(255, 255, 255, 0.4)" : "rgba(255, 255, 255, 0.12)";
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(xStart, 0, xEnd - xStart, height);
    ctx.setLineDash([]);

    // Active Tunable Spectrum Wave
    ctx.beginPath();
    ctx.strokeStyle = locked ? "#ffffff" : "rgba(255, 255, 255, 0.75)";
    ctx.lineWidth = locked ? 2.5 : 1.8;

    for (let px = 0; px < width; px++) {
      const hz = (px / width) * maxDisplayHz;
      let amp = 0.06;

      if (!locked) {
        // Scrambled low noise when off-tune
        amp += Math.sin(px * 0.08 + shift * 0.04) * 0.02 + Math.cos(px * 0.03) * 0.015;
      }

      // Shifted Peaks (f + shift)
      const currentPeaks = activeFreq ? [activeFreq] : TARGET_FREQS.map(f => f + shift);
      currentPeaks.forEach((f) => {
        const d = Math.abs(hz - f);
        if (d < 35) {
          const peakHeight = locked ? 0.85 : 0.65;
          amp = Math.max(amp, peakHeight * Math.exp(-Math.pow(d / 8, 2)));
        }
      });

      const y = height - (amp * (height - 24));
      if (px === 0) ctx.moveTo(px, y);
      else ctx.lineTo(px, y);
    }
    ctx.stroke();

    // Subtle fill under active wave
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.fillStyle = locked ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.03)";
    ctx.fill();

    // ONLY when locked: Draw Peak Frequency Callout Flags
    if (locked) {
      TARGET_FREQS.forEach((f) => {
        const peakX = (f / maxDisplayHz) * width;
        const peakY = height - (0.85 * (height - 24));

        ctx.beginPath();
        ctx.arc(peakX, peakY, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();

        ctx.fillStyle = "#000000";
        ctx.fillRect(peakX - 22, peakY - 24, 44, 16);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1;
        ctx.strokeRect(peakX - 22, peakY - 24, 44, 16);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 9px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`${f}Hz`, peakX, peakY - 12);
      });
    }

    // Draw Hovered Cursor Readout
    if (hoveredHz !== null && hoveredHz !== undefined) {
      const cursorX = (hoveredHz / maxDisplayHz) * width;
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.moveTo(cursorX, 0);
      ctx.lineTo(cursorX, height);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [hoveredHz]);

  useEffect(() => {
    drawCanvas(deltaShift, null, isLocked);
  }, [deltaShift, isLocked, drawCanvas]);

  // Play Reference Audio purely through speakers (audio-only)
  const playReferenceAudio = async () => {
    stopAllAudio();

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
      } else {
        const currentIdx = Math.min(4, Math.floor(elapsed / slotDuration));
        setActiveStep(currentIdx + 1);
      }
    }, 100);
  };

  // Play Tuner Audio (Shifted frequencies: f + deltaShift)
  const playTunerAudio = async () => {
    stopAllAudio();

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    audioCtxRef.current = ctx;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.28, ctx.currentTime);
    masterGain.connect(ctx.destination);

    const slotDuration = 0.8;
    const totalDuration = TARGET_FREQS.length * slotDuration;

    TARGET_FREQS.forEach((f, idx) => {
      const shiftedFreq = Math.max(100, f + deltaShift);
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
        drawCanvas(deltaShift, null, isLocked);
      } else {
        const currentIdx = Math.min(4, Math.floor(elapsed / slotDuration));
        setActiveStep(currentIdx + 1);
        drawCanvas(deltaShift, TARGET_FREQS[currentIdx] + deltaShift, isLocked);
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
  };

  // Perform Alignment Diagnostic Check
  const handleCheckAlignment = () => {
    if (deltaShift < 0) {
      setAlignStatus("low");
      setIsLocked(false);
    } else if (deltaShift > 0) {
      setAlignStatus("high");
      setIsLocked(false);
    } else {
      setDeltaShift(0);
      setAlignStatus("perfect");
      setIsLocked(true);
      drawCanvas(0, null, true);
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const maxDisplayHz = 1200;
    const hz = Math.round((x / rect.width) * maxDisplayHz);
    setHoveredHz(hz);
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

          {/* Cursor Frequency Readout HUD */}
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

          {/* Fine-grained discrete slider (step=3Hz) */}
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
        </div>

        {/* Comparative Audio Playback Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={isPlayingRef ? stopAllAudio : playReferenceAudio}
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
            onClick={isPlayingTuner ? stopAllAudio : playTunerAudio}
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
