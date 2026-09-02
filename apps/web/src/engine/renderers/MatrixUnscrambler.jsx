import React, { useState, useEffect, useRef } from "react";
import { Radio, Play, Square, Activity, Sliders, Volume2, Shield } from "lucide-react";

const SECRET_CODE = "BXZ19";
const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export default function MatrixUnscrambler({ config, onEvidenceReady }) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [filterEnabled, setFilterEnabled] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [hoveredFreq, setHoveredFreq] = useState(null);

  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const canvasRef = useRef(null);
  const activeNodesRef = useRef([]);

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

      // Render Frequency Spectrum Curve & Bars (0Hz to 1200Hz window)
      const sampleRate = audioCtxRef.current ? audioCtxRef.current.sampleRate : 44100;
      const hzPerBin = sampleRate / analyser.fftSize;
      const maxDisplayHz = 1200;
      const maxBins = Math.floor(maxDisplayHz / hzPerBin);

      ctx.beginPath();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
      ctx.lineWidth = 2;

      for (let i = 0; i < maxBins; i++) {
        const x = (i / maxBins) * canvas.width;
        const v = dataArray[i] / 255.0;
        const y = canvas.height - (v * (canvas.height - 20));

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Draw subtle fill gradient beneath curve
      ctx.lineTo(canvas.width, canvas.height);
      ctx.lineTo(0, canvas.height);
      ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
      ctx.fill();

      // Bandwidth Marker (300Hz to 825Hz region)
      const xStart = (300 / maxDisplayHz) * canvas.width;
      const xEnd = (825 / maxDisplayHz) * canvas.width;
      ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
      ctx.fillRect(xStart, 0, xEnd - xStart, canvas.height);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(xStart, 0, xEnd - xStart, canvas.height);
      ctx.setLineDash([]);
    };

    render();
  };

  const handleCanvasMouseMove = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const maxDisplayHz = 1200;
    const freq = Math.round((x / rect.width) * maxDisplayHz);
    setHoveredFreq(freq);
  };

  const handleCanvasMouseLeave = () => {
    setHoveredFreq(null);
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

        {/* Real-time Oscilloscope & Frequency Spectrum Canvas */}
        <div className="relative rounded-xl overflow-hidden border border-white/15 bg-black h-56 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={720}
            height={220}
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={handleCanvasMouseLeave}
            className="w-full h-full block cursor-crosshair"
          />

          {!isPlayingAudio && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex flex-col items-center justify-center gap-2 text-slate-400">
              <Activity size={24} className="text-white opacity-80" />
              <span className="text-xs font-bold text-slate-300">CLICK CAPTURE TO INTERCEPT RAW ACOUSTIC SIGNAL</span>
              <span className="text-[10px] text-slate-500">Hover over spectrum to inspect carrier frequencies (Hz)</span>
            </div>
          )}

          {/* Cursor Frequency Readout HUD */}
          {hoveredFreq !== null && (
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded bg-black/90 border border-white/30 text-white font-mono text-[11px] shadow">
              CURSOR: <span className="font-bold">{hoveredFreq} Hz</span>
            </div>
          )}

          {isPlayingAudio && (
            <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/90 px-2.5 py-1 rounded border border-white/30 text-[10px] text-white font-mono">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              <span>INTERCEPTING SIGNAL ({audioProgress}%)</span>
            </div>
          )}

          {/* Frequency Axis Labels */}
          <div className="absolute bottom-1 left-0 right-0 px-3 flex justify-between text-[9px] text-slate-500 pointer-events-none">
            <span>0 Hz</span>
            <span>300 Hz</span>
            <span>600 Hz</span>
            <span>900 Hz</span>
            <span>1200 Hz</span>
          </div>
        </div>

        {/* Playback Controls & Forensic Notes */}
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
            <span>DURATION: 4.5s &bull; POLYPHONIC CHORD CLUSTER</span>
          </div>
        </div>

        {/* Forensic Clue Terminal Note */}
        <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col gap-1.5 text-slate-300 text-xs">
          <div className="flex items-center gap-1.5 text-white font-bold text-xs uppercase">
            <Shield size={13} />
            <span>INVESTIGATION PROTOCOL // ACOUSTIC CARRIER RECOVERY</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            The intercept contains five simultaneous harmonic carriers within the 300Hz–825Hz band, masked beneath background acoustic noise. Use the spectrum cursor to read the peak resonant frequencies and determine the chained sequence.
          </p>
        </div>

      </div>
    </div>
  );
}
