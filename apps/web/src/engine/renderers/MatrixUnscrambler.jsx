import React, { useState, useEffect, useRef } from "react";
import { Radio, Play, Square, Activity, Sliders, Shield } from "lucide-react";

const SECRET_CODE = "BXZ19";
const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export default function MatrixUnscrambler({ config, onEvidenceReady }) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [filterEnabled, setFilterEnabled] = useState(false); // Default to Normal (Raw Audio with noise)
  const [audioProgress, setAudioProgress] = useState(0);
  const [tunedFreq, setTunedFreq] = useState(600); // Default slider in middle of band

  // 5-Slot Manual Measurement Scratchpad
  const [slotFreqs, setSlotFreqs] = useState(["", "", "", "", ""]);

  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const canvasRef = useRef(null);
  const activeNodesRef = useRef([]);

  // Stored frozen frequency data so canvas NEVER blanks or gets blocked on halt
  const frozenDataRef = useRef(null);

  useEffect(() => {
    onEvidenceReady?.();
    return () => {
      stopAudio();
    };
  }, []);

  // Compute frequencies for Level 7 SECRET_CODE (BXZ19)
  // V0 = 17, Vn = (Cn + Vn-1) mod 36, Freq = 300 + (Vn * 15)
  const calculateCipherFrequencies = () => {
    let lastV = 17;
    const freqs = [];
    for (let i = 0; i < SECRET_CODE.length; i++) {
      const char = SECRET_CODE[i];
      const c_n = ALPHABET.indexOf(char);
      const v_n = (c_n + lastV) % 36;
      const freq = 300 + (v_n * 15);
      freqs.push(freq);
      lastV = v_n;
    }
    return freqs;
  };

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
    setAudioProgress(0);

    drawFrozenCanvas();
  };

  const playCipherChord = async () => {
    stopAudio();

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 4096;
    analyser.smoothingTimeConstant = 0.85;
    analyserRef.current = analyser;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.3, ctx.currentTime);

    if (filterEnabled) {
      const bpHigher = ctx.createBiquadFilter();
      bpHigher.type = "highpass";
      bpHigher.frequency.setValueAtTime(280, ctx.currentTime);

      const bpLower = ctx.createBiquadFilter();
      bpLower.type = "lowpass";
      bpLower.frequency.setValueAtTime(860, ctx.currentTime);

      masterGain.connect(bpHigher);
      bpHigher.connect(bpLower);
      bpLower.connect(analyser);
    } else {
      masterGain.connect(analyser);
    }

    analyser.connect(ctx.destination);

    const freqs = calculateCipherFrequencies();
    const duration = 4.5;

    // 5-Tone Polyphonic Chord
    freqs.forEach((f) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(f, ctx.currentTime);
      osc.connect(masterGain);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
      activeNodesRef.current.push(osc);
    });

    // Acoustic Pink Noise Masking + Sub-bass Hum
    if (!filterEnabled) {
      const bufferSize = Math.floor(ctx.sampleRate * duration);
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
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.07;
        b6 = white * 0.115926;
      }

      const noiseNode = ctx.createBufferSource();
      noiseNode.buffer = noiseBuffer;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.2, ctx.currentTime);
      noiseNode.connect(noiseGain);
      noiseGain.connect(masterGain);
      noiseNode.start(ctx.currentTime);
      noiseNode.stop(ctx.currentTime + duration);
      activeNodesRef.current.push(noiseNode);

      const humOsc = ctx.createOscillator();
      humOsc.type = "sawtooth";
      humOsc.frequency.setValueAtTime(120, ctx.currentTime);
      const humGain = ctx.createGain();
      humGain.gain.setValueAtTime(0.06, ctx.currentTime);
      humOsc.connect(humGain);
      humGain.connect(masterGain);
      humOsc.start(ctx.currentTime);
      humOsc.stop(ctx.currentTime + duration);
      activeNodesRef.current.push(humOsc);
    }

    setIsPlayingAudio(true);
    drawVisualizer();

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed >= duration) {
        clearInterval(interval);
        setIsPlayingAudio(false);
        setAudioProgress(0);
        drawFrozenCanvas();
      } else {
        setAudioProgress(Math.min(100, Math.floor((elapsed / duration) * 100)));
      }
    }, 100);
  };

  const drawVisualizer = () => {
    if (!analyserRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animFrameRef.current = requestAnimationFrame(render);
      analyser.getByteFrequencyData(dataArray);

      frozenDataRef.current = new Uint8Array(dataArray);
      drawSpectrumToCanvas(ctx, canvas, dataArray, tunedFreq);
    };

    render();
  };

  const drawFrozenCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    let dataArray = frozenDataRef.current;
    if (!dataArray) {
      dataArray = new Uint8Array(2048);
      const freqs = calculateCipherFrequencies();
      const sampleRate = 44100;
      const fftSize = 4096;
      const hzPerBin = sampleRate / fftSize;
      freqs.forEach((f) => {
        const bin = Math.round(f / hzPerBin);
        for (let offset = -3; offset <= 3; offset++) {
          if (bin + offset >= 0 && bin + offset < dataArray.length) {
            const h = Math.max(0, 220 - Math.abs(offset) * 45);
            dataArray[bin + offset] = Math.max(dataArray[bin + offset], h);
          }
        }
      });
      frozenDataRef.current = dataArray;
    }

    drawSpectrumToCanvas(ctx, canvas, dataArray, tunedFreq);
  };

  const drawSpectrumToCanvas = (ctx, canvas, dataArray, cursorFreq) => {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Oscilloscope Grid Lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1;
    for (let y = 0; y < canvas.height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    for (let x = 0; x < canvas.width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    const sampleRate = 44100;
    const fftSize = 4096;
    const hzPerBin = sampleRate / fftSize;
    const maxDisplayHz = 1200;
    const maxBins = Math.floor(maxDisplayHz / hzPerBin);

    // Bandwidth Highlight (300Hz to 850Hz)
    const xStart = (300 / maxDisplayHz) * canvas.width;
    const xEnd = (850 / maxDisplayHz) * canvas.width;
    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    ctx.fillRect(xStart, 0, xEnd - xStart, canvas.height);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(xStart, 0, xEnd - xStart, canvas.height);
    ctx.setLineDash([]);

    // Draw Spectrum Curve
    ctx.beginPath();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
    ctx.lineWidth = 2;

    for (let i = 0; i < maxBins; i++) {
      const x = (i / maxBins) * canvas.width;
      const v = (dataArray[i] || 0) / 255.0;
      const y = canvas.height - (v * (canvas.height - 20));

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
    ctx.fill();

    // Draw Tuner Cursor Line
    if (cursorFreq !== null && cursorFreq !== undefined) {
      const cursorX = (cursorFreq / maxDisplayHz) * canvas.width;
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([2, 2]);
      ctx.moveTo(cursorX, 0);
      ctx.lineTo(cursorX, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(cursorX - 28, 6, 56, 16);
      ctx.fillStyle = "#000000";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${cursorFreq}Hz`, cursorX, 18);
    }
  };

  useEffect(() => {
    drawFrozenCanvas();
  }, [tunedFreq]);

  const handleCanvasClick = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const maxDisplayHz = 1200;
    const freq = Math.round((x / rect.width) * maxDisplayHz);
    const clamped = Math.max(300, Math.min(850, freq));
    setTunedFreq(clamped);
  };

  // Helper to compute state V from entered frequency
  const calculateStateV = (fStr) => {
    const fNum = parseFloat(fStr);
    if (isNaN(fNum) || fNum < 300) return "--";
    return Math.round((fNum - 300) / 15);
  };

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="flex flex-col gap-4 w-full font-mono text-xs select-none max-w-5xl mx-auto"
    >
      {/* Forensic Signal Analysis Viewport */}
      <div className="rounded-2xl border border-white/15 p-5 flex flex-col bg-black shadow-2xl relative w-full gap-4">
        
        {/* Header HUD */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2 text-white font-bold text-xs">
            <Radio size={15} className="text-white" />
            <span>ACOUSTIC SIGNAL FORENSICS // 5-CHANNEL CHORD CARRIER</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setFilterEnabled(!filterEnabled);
                if (isPlayingAudio) {
                  // restart with new filter
                  playCipherChord();
                }
              }}
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

        {/* Spectrum Canvas Display */}
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
              <span>INTERCEPTING SIGNAL ({audioProgress}%)</span>
            </div>
          )}

          {/* Frequency Axis Labels */}
          <div className="absolute bottom-1 left-0 right-0 px-3 flex justify-between text-[9px] text-slate-500 pointer-events-none">
            <span>0 Hz</span>
            <span>300 Hz (Floor)</span>
            <span>600 Hz</span>
            <span>850 Hz</span>
            <span>1200 Hz</span>
          </div>
        </div>

        {/* Interactive Frequency Tuning Slider */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-white font-bold text-xs uppercase tracking-wider">
              FREQUENCY CURSOR TUNER: <span className="font-mono text-white text-sm">{tunedFreq} Hz</span>
            </span>
            <span className="text-slate-400 text-[11px] font-mono">
              Base State V = ({tunedFreq} - 300) / 15 = <strong className="text-white">{Math.round((tunedFreq - 300) / 15)}</strong>
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

        {/* Playback Button & Spectrum Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={isPlayingAudio ? stopAudio : playCipherChord}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs tracking-wider transition-all cursor-pointer ${
                isPlayingAudio
                  ? "bg-white text-black shadow"
                  : "bg-white hover:bg-slate-200 text-black shadow"
              }`}
            >
              {isPlayingAudio ? <Square size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
              <span>{isPlayingAudio ? "HALT SIGNAL" : "CAPTURE & PLAY ACOUSTIC SIGNAL"}</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            <span>DURATION: 4.5s &bull; POLYPHONIC CHORD CARRIER</span>
          </div>
        </div>

        {/* 5-Slot Manual Peak Frequency Measurement Scratchpad */}
        <div className="p-4 rounded-xl bg-black border border-white/15 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2 text-white font-bold text-xs">
              <Activity size={14} />
              <span>5-TONE PEAK FREQUENCY MEASUREMENT LOG</span>
            </div>
            <button
              onClick={() => setSlotFreqs(["", "", "", "", ""])}
              className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
            >
              Clear Log
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="p-3 bg-white/5 rounded-xl border border-white/10 flex flex-col gap-2 text-center">
                <span className="text-[10px] text-slate-400 font-bold">PEAK #{i + 1}</span>
                <input
                  type="number"
                  value={slotFreqs[i]}
                  onChange={(e) => {
                    const next = [...slotFreqs];
                    next[i] = e.target.value;
                    setSlotFreqs(next);
                  }}
                  placeholder="Freq (Hz)"
                  className="w-full text-center py-1 bg-black border border-white/20 rounded text-xs text-white font-mono focus:border-white outline-none"
                />
                <div className="text-[10px] text-slate-400 border-t border-white/10 pt-1">
                  <span>State V_{i+1} = <strong className="text-white">{calculateStateV(slotFreqs[i])}</strong></span>
                </div>
              </div>
            ))}
          </div>

          {/* Operational Guidance */}
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-slate-400 text-[11px] leading-relaxed">
            Measure the 5 peak resonant frequencies using the cursor tuner. Convert each frequency into its base state <span className="text-white font-mono">V_n</span>, unchain the characters with initial seed <span className="text-white font-mono">V_0 = 17</span> (refer to DOCS for formula & worked examples), and submit the clearance token below.
          </div>
        </div>

      </div>
    </div>
  );
}
