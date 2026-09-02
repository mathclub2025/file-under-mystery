import React, { useState, useEffect, useRef } from "react";
import { Radio, Play, Square, Activity, Sliders, Volume2, Shield } from "lucide-react";

const SECRET_CODE = "BXZ19";
const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export default function MatrixUnscrambler({ config, onEvidenceReady }) {
  // Selected Channel: 0 = ALL (Sequential Stream), 1..5 = Isolated Channel 1 to 5
  const [selectedChannel, setSelectedChannel] = useState(1);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [filterEnabled, setFilterEnabled] = useState(false); // Default: Raw normal audio
  const [audioProgress, setAudioProgress] = useState(0);
  const [activePlaybackChannel, setActivePlaybackChannel] = useState(null);
  const [tunedFreq, setTunedFreq] = useState(720);

  // 5-Slot Manual Measurement Log
  const [slotFreqs, setSlotFreqs] = useState(["", "", "", "", ""]);

  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const canvasRef = useRef(null);
  const activeNodesRef = useRef([]);
  const frozenDataRef = useRef(null);

  useEffect(() => {
    onEvidenceReady?.();
    return () => {
      stopAudio();
    };
  }, []);

  // Compute frequencies for Level 7 SECRET_CODE (BXZ19)
  // V0 = 17, Vn = (Cn + Vn-1) mod 36, Freq = 300 + (Vn * 15)
  // Returns: [720, 675, 660, 675, 810]
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
    setActivePlaybackChannel(null);

    drawFrozenCanvas();
  };

  const playAudio = async (channelTarget = selectedChannel) => {
    stopAudio();

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 4096;
    analyser.smoothingTimeConstant = 0.82;
    analyserRef.current = analyser;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.32, ctx.currentTime);

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
    let totalDuration = 0;

    if (channelTarget === 0) {
      // Sequential Playback: Play Tone 1..5 in order (0.8s each = 4.0s total)
      totalDuration = 4.0;
      const slotTime = 0.8;

      freqs.forEach((f, idx) => {
        const startTime = ctx.currentTime + (idx * slotTime);
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, startTime);
        osc.connect(masterGain);
        osc.start(startTime);
        osc.stop(startTime + slotTime);
        activeNodesRef.current.push(osc);
      });
    } else {
      // Isolated Channel (e.g. Channel 1 = freqs[0])
      totalDuration = 3.0;
      const targetFreq = freqs[channelTarget - 1];
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(targetFreq, ctx.currentTime);
      osc.connect(masterGain);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + totalDuration);
      activeNodesRef.current.push(osc);
    }

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
      noiseGain.connect(masterGain);
      noiseNode.start(ctx.currentTime);
      noiseNode.stop(ctx.currentTime + totalDuration);
      activeNodesRef.current.push(noiseNode);
    }

    setIsPlayingAudio(true);
    drawVisualizer();

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed >= totalDuration) {
        clearInterval(interval);
        setIsPlayingAudio(false);
        setAudioProgress(0);
        setActivePlaybackChannel(null);
        drawFrozenCanvas();
      } else {
        setAudioProgress(Math.min(100, Math.floor((elapsed / totalDuration) * 100)));
        if (channelTarget === 0) {
          const currentStep = Math.min(5, Math.floor(elapsed / 0.8) + 1);
          setActivePlaybackChannel(currentStep);
        } else {
          setActivePlaybackChannel(channelTarget);
        }
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

      // Draw peaks for selected channel or all channels
      const targetFreqs = selectedChannel === 0 ? freqs : [freqs[selectedChannel - 1]];
      targetFreqs.forEach((f) => {
        const bin = Math.round(f / hzPerBin);
        for (let offset = -4; offset <= 4; offset++) {
          if (bin + offset >= 0 && bin + offset < dataArray.length) {
            const h = Math.max(0, 230 - Math.abs(offset) * 40);
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

    // Draw Cursor Line
    if (cursorFreq !== null && cursorFreq !== undefined) {
      const cursorX = (cursorFreq / maxDisplayHz) * canvas.width;
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
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
    frozenDataRef.current = null;
    drawFrozenCanvas();
  }, [selectedChannel, tunedFreq]);

  const handleCanvasClick = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const maxDisplayHz = 1200;
    const freq = Math.round((x / rect.width) * maxDisplayHz);
    const clamped = Math.max(300, Math.min(850, freq));
    setTunedFreq(clamped);
  };

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
      <div className="rounded-2xl border border-white/15 p-5 flex flex-col bg-black shadow-2xl relative w-full gap-4">
        
        {/* Header HUD */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2 text-white font-bold text-xs">
            <Radio size={15} className="text-white" />
            <span>ACOUSTIC SIGNAL FORENSICS // 5-TONE CARRIER DEMODULATOR</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setFilterEnabled(!filterEnabled);
                if (isPlayingAudio) {
                  playAudio(selectedChannel);
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

        {/* Channel Selection Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 text-[11px] font-bold mr-1">CARRIER CHANNELS:</span>
            {[1, 2, 3, 4, 5].map((ch) => (
              <button
                key={ch}
                onClick={() => {
                  setSelectedChannel(ch);
                  stopAudio();
                }}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer border ${
                  selectedChannel === ch
                    ? "bg-white text-black border-white shadow"
                    : "bg-black/60 border-white/15 text-slate-300 hover:text-white"
                }`}
              >
                CHANNEL #{ch}
              </button>
            ))}

            <button
              onClick={() => {
                setSelectedChannel(0);
                stopAudio();
              }}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer border ml-1 ${
                selectedChannel === 0
                  ? "bg-white text-black border-white shadow"
                  : "bg-black/60 border-white/15 text-slate-300 hover:text-white"
              }`}
            >
              ALL (SEQUENCE)
            </button>
          </div>

          <span className="text-[10px] text-slate-400 font-mono">
            {selectedChannel === 0
              ? "STREAM: CH 1 ──> CH 5 (4.0s)"
              : `ISOLATING: CARRIER #${selectedChannel} (300Hz–850Hz)`}
          </span>
        </div>

        {/* Spectrum Canvas Viewport */}
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
              <span>
                {selectedChannel === 0
                  ? `PLAYING CH #${activePlaybackChannel || 1} (${audioProgress}%)`
                  : `CAPTURING CH #${selectedChannel} (${audioProgress}%)`}
              </span>
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

        {/* Interactive Frequency Slider */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-white font-bold text-xs uppercase tracking-wider">
              FREQUENCY CURSOR: <span className="font-mono text-white text-sm">{tunedFreq} Hz</span>
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

        {/* Playback Trigger */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={isPlayingAudio ? stopAudio : () => playAudio(selectedChannel)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs tracking-wider transition-all cursor-pointer ${
                isPlayingAudio
                  ? "bg-white text-black shadow"
                  : "bg-white hover:bg-slate-200 text-black shadow"
              }`}
            >
              {isPlayingAudio ? <Square size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
              <span>
                {isPlayingAudio
                  ? "HALT SIGNAL"
                  : selectedChannel === 0
                  ? "PLAY 5-TONE SEQUENCE"
                  : `CAPTURE & PLAY CHANNEL #${selectedChannel}`}
              </span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            <span>CARRIER BAND: 300Hz–825Hz &bull; MOD 36 CHORD</span>
          </div>
        </div>

        {/* 5-Slot Manual Measurement Log */}
        <div className="p-4 rounded-xl bg-black border border-white/15 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2 text-white font-bold text-xs">
              <Activity size={14} />
              <span>5-CHANNEL FREQUENCY MEASUREMENT LOG</span>
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
                <span className="text-[10px] text-slate-400 font-bold">CHANNEL #{i + 1}</span>
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

          {/* Operational Guidance Note */}
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-slate-400 text-[11px] leading-relaxed">
            Select each carrier channel (#1 to #5) and measure its peak frequency using the slider cursor. Compute state <span className="text-white font-mono">V_n = (Freq_n - 300) / 15</span> and unchain the characters with initial seed <span className="text-white font-mono">V_0 = 17</span> (refer to the <strong>DOCS</strong> modal for formulas & step-by-step worked examples). Submit the recovered 5-character token into the Verification Terminal below.
          </div>
        </div>

      </div>
    </div>
  );
}
