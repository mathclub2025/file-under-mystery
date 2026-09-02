import React, { useState, useEffect, useRef } from "react";
import { Radio, Play, Square, Sliders, BookOpen, Shield } from "lucide-react";

const SECRET_CODE = "BXZ19";
const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Secret Frequencies: [720, 675, 660, 675, 810]
const CIPHER_FREQS = [720, 675, 660, 675, 810];

export default function MatrixUnscrambler({ config, onEvidenceReady }) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [filterEnabled, setFilterEnabled] = useState(false); // Default: Raw normal audio
  const [activeStep, setActiveStep] = useState(null);
  const [tunedFreq, setTunedFreq] = useState(600);

  const audioCtxRef = useRef(null);
  const animFrameRef = useRef(null);
  const canvasRef = useRef(null);
  const activeNodesRef = useRef([]);

  useEffect(() => {
    onEvidenceReady?.();
    return () => {
      stopAudio();
    };
  }, []);

  const stopAudio = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    activeNodesRef.current.forEach((n) => {
      try { n.stop(); n.disconnect(); } catch (e) {}
    });
    activeNodesRef.current = [];
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      try { audioCtxRef.current.close(); } catch (e) {}
      audioCtxRef.current = null;
    }
    setIsPlayingAudio(false);
    setActiveStep(null);
    drawSpectrumCanvas(tunedFreq, null, filterEnabled);
  };

  const playSequence = async () => {
    stopAudio();

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.3, ctx.currentTime);

    let destinationNode = masterGain;

    if (filterEnabled) {
      const bpHigher = ctx.createBiquadFilter();
      bpHigher.type = "highpass";
      bpHigher.frequency.setValueAtTime(280, ctx.currentTime);

      const bpLower = ctx.createBiquadFilter();
      bpLower.type = "lowpass";
      bpLower.frequency.setValueAtTime(860, ctx.currentTime);

      masterGain.connect(bpHigher);
      bpHigher.connect(bpLower);
      destinationNode = bpLower;
    }

    destinationNode.connect(ctx.destination);

    const slotDuration = 0.8;
    const totalDuration = CIPHER_FREQS.length * slotDuration; // 4.0s

    // Schedule 5 tones in sequential order
    CIPHER_FREQS.forEach((f, idx) => {
      const startTime = ctx.currentTime + (idx * slotDuration);
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(f, startTime);
      osc.connect(masterGain);
      osc.start(startTime);
      osc.stop(startTime + slotDuration);
      activeNodesRef.current.push(osc);
    });

    // Acoustic Masking Noise (if bandpass filter is bypassed)
    if (!filterEnabled) {
      const bufferSize = Math.floor(ctx.sampleRate * totalDuration);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.065;
        b6 = white * 0.115926;
      }

      const noiseNode = ctx.createBufferSource();
      noiseNode.buffer = noiseBuffer;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.18, ctx.currentTime);
      noiseNode.connect(noiseGain);
      noiseNode.connect(masterGain);
      noiseNode.start(ctx.currentTime);
      noiseNode.stop(ctx.currentTime + totalDuration);
      activeNodesRef.current.push(noiseNode);
    }

    setIsPlayingAudio(true);

    const startTime = Date.now();
    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed >= totalDuration) {
        setIsPlayingAudio(false);
        setActiveStep(null);
        drawSpectrumCanvas(tunedFreq, null, filterEnabled);
      } else {
        const currentIdx = Math.min(4, Math.floor(elapsed / slotDuration));
        setActiveStep(currentIdx + 1);
        drawSpectrumCanvas(tunedFreq, CIPHER_FREQS[currentIdx], filterEnabled);
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
  };

  // Pixel-perfect frequency spectrum renderer with exact peak alignment (0Hz error)
  const drawSpectrumCanvas = (cursorFreq, activePlayingFreq, isFiltered) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
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

    // Bandwidth Region Highlight (300Hz to 850Hz)
    const xStart = (300 / maxDisplayHz) * width;
    const xEnd = (850 / maxDisplayHz) * width;
    ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
    ctx.fillRect(xStart, 0, xEnd - xStart, height);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(xStart, 0, xEnd - xStart, height);
    ctx.setLineDash([]);

    // Compute Exact Mathematical Spectrum Curve
    const numPoints = width;
    ctx.beginPath();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
    ctx.lineWidth = 2;

    for (let px = 0; px < numPoints; px++) {
      const hz = (px / width) * maxDisplayHz;
      let amplitude = 0.05; // base baseline

      if (!isFiltered) {
        // Noise floor when un-filtered
        amplitude += Math.sin(px * 0.15) * 0.04 + Math.sin(px * 0.05) * 0.03 + Math.random() * 0.02;
      }

      // Add Gaussian peak spikes for the carrier frequencies
      const freqsToRender = activePlayingFreq ? [activePlayingFreq] : CIPHER_FREQS;
      freqsToRender.forEach((f) => {
        const diff = Math.abs(hz - f);
        if (diff < 35) {
          // Sharp Gaussian peak centered exactly at frequency f
          const peakHeight = (activePlayingFreq === f) ? 0.88 : 0.72;
          const peak = peakHeight * Math.exp(-Math.pow(diff / 8, 2));
          amplitude = Math.max(amplitude, peak);
        }
      });

      const y = height - (amplitude * (height - 24));
      if (px === 0) {
        ctx.moveTo(px, y);
      } else {
        ctx.lineTo(px, y);
      }
    }
    ctx.stroke();

    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.fill();

    // Draw Frequency Cursor
    if (cursorFreq !== null && cursorFreq !== undefined) {
      const cursorX = (cursorFreq / maxDisplayHz) * width;
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([2, 2]);
      ctx.moveTo(cursorX, 0);
      ctx.lineTo(cursorX, height);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(cursorX - 26, 6, 52, 16);
      ctx.fillStyle = "#000000";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${cursorFreq}Hz`, cursorX, 18);
    }
  };

  useEffect(() => {
    drawSpectrumCanvas(tunedFreq, null, filterEnabled);
  }, [tunedFreq, filterEnabled]);

  const handleCanvasClick = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const maxDisplayHz = 1200;
    const freq = Math.round((x / rect.width) * maxDisplayHz);
    const clamped = Math.max(300, Math.min(850, freq));
    setTunedFreq(clamped);
  };

  const calculatedV = Math.round((tunedFreq - 300) / 15);

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="flex flex-col gap-4 w-full font-mono text-xs select-none max-w-5xl mx-auto"
    >
      <div className="rounded-2xl border border-white/15 p-5 flex flex-col bg-black shadow-2xl relative w-full gap-4">
        
        {/* Top Header HUD: Protocol Topic, DOCS Reference & Seed V0 */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2 text-white font-bold text-xs">
            <Radio size={15} className="text-white" />
            <span>TOPIC: ACOUSTIC DATA SONIFICATION & CBC // PROTOCOL SEED V₀ = 17</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterEnabled(!filterEnabled)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                filterEnabled
                  ? "bg-white text-black border-white shadow"
                  : "bg-white/5 border-white/15 text-slate-400 hover:text-white"
              }`}
            >
              <Sliders size={12} />
              <span>{filterEnabled ? "BANDPASS ISOLATOR: ENGAGED" : "BANDPASS ISOLATOR: BYPASS"}</span>
            </button>
          </div>
        </div>

        {/* Real-time Spectrum Canvas Viewport */}
        <div className="relative rounded-xl overflow-hidden border border-white/15 bg-black h-56 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={720}
            height={220}
            onClick={handleCanvasClick}
            className="w-full h-full block cursor-crosshair"
          />

          {isPlayingAudio && (
            <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/90 px-2.5 py-1 rounded border border-white/30 text-[10px] text-white font-mono">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              <span>TRANSMITTING TONE #{activeStep || 1} / 5</span>
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

        {/* Interactive Frequency Tuner Slider */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-white font-bold text-xs uppercase tracking-wider">
              FREQUENCY TUNER: <span className="font-mono text-white text-sm">{tunedFreq} Hz</span>
            </span>
            <span className="text-slate-400 text-[11px] font-mono">
              Base State V = ({tunedFreq} - 300) / 15 = <strong className="text-white">{calculatedV}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-500">300Hz</span>
            <input
              type="range"
              min="300"
              max="850"
              step="1"
              value={tunedFreq}
              onChange={(e) => setTunedFreq(parseInt(e.target.value))}
              className="flex-1 accent-white cursor-pointer h-2 bg-white/10 rounded-lg appearance-none"
            />
            <span className="text-[10px] text-slate-500">850Hz</span>
          </div>
        </div>

        {/* Single Sequence Playback Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={isPlayingAudio ? stopAudio : playSequence}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs tracking-wider transition-all cursor-pointer ${
                isPlayingAudio
                  ? "bg-white text-black shadow"
                  : "bg-white hover:bg-slate-200 text-black shadow"
              }`}
            >
              {isPlayingAudio ? <Square size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
              <span>{isPlayingAudio ? "HALT SIGNAL" : "CAPTURE & PLAY 5-TONE ACOUSTIC SEQUENCE"}</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            <span>DURATION: 4.0s (5 TONES &bull; 0.8s EACH)</span>
          </div>
        </div>

        {/* Reference Banner */}
        <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-start gap-2.5 text-slate-400 text-xs">
          <BookOpen size={15} className="text-white shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-white">DOCUMENTATION REFERENCE:</strong> Open the top <strong className="text-white">DOCS</strong> modal and select <strong className="text-white">"Acoustic Data Sonification & Cipher Block Chaining (CBC)"</strong> for full mathematical formulations, alphabet lookup tables, and worked example calculations.
          </div>
        </div>

      </div>
    </div>
  );
}
