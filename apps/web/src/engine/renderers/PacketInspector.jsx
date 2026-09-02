import React, { useState, useEffect, useRef } from "react";
import { Network, Radio, Volume2, Download, Play, Square, Activity, Cpu, ShieldAlert, CheckCircle2, AlertTriangle, Layers, Sliders } from "lucide-react";
import { assetUrl } from "../../lib/assetHelper.js";

const SECRET_CODE = "NT2K5";
const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Helper: Convert AudioBuffer to WAV Blob for download
function bufferToWave(abuffer, len) {
  const numOfChan = abuffer.numberOfChannels;
  const length = len * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels = [];
  let pos = 0;

  function setUint16(data) { out.setUint16(pos, data, true); pos += 2; }
  function setUint32(data) { out.setUint32(pos, data, true); pos += 4; }

  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8);
  setUint32(0x45564157); // "WAVE"
  setUint32(0x20746d66); // "fmt "
  setUint32(16);
  setUint16(1); // PCM
  setUint16(numOfChan);
  setUint32(abuffer.sampleRate);
  setUint32(abuffer.sampleRate * 2 * numOfChan);
  setUint16(numOfChan * 2);
  setUint16(16);
  setUint32(0x61746164); // "data"
  setUint32(length - pos - 4);

  for (let i = 0; i < numOfChan; i++) {
    channels.push(abuffer.getChannelData(i));
  }

  let offset = 0;
  while (offset < len) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }
  return new Blob([out], { type: "audio/wav" });
}

export default function PacketInspector({ config, onEvidenceReady }) {
  // Mode switch: "sonification" (Acoustic Vault) vs "pcap" (Network Packet Stream)
  const [activeTab, setActiveTab] = useState("sonification");

  // PCAP State
  const [packets, setPackets] = useState([]);
  const [filterMethod, setFilterMethod] = useState("ALL");
  const [selectedPacket, setSelectedPacket] = useState(null);

  // Sonification Audio State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [filterEnabled, setFilterEnabled] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [decryptionTest, setDecryptionTest] = useState(["", "", "", "", ""]);
  const [verifyStatus, setVerifyStatus] = useState(null); // "success" | "fail" | null

  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const canvasRef = useRef(null);
  const activeNodesRef = useRef([]);

  useEffect(() => {
    fetch(assetUrl("/evidence/network_capture.json"))
      .then((r) => r.json())
      .then((data) => {
        setPackets(data);
        setSelectedPacket((prev) => prev || (data.length > 0 ? data[0] : null));
        onEvidenceReady?.();
      })
      .catch((err) => {
        console.error("Error loading network capture:", err);
        onEvidenceReady?.();
      });

    return () => {
      stopAudio();
    };
  }, []);

  // Compute frequencies for SECRET_CODE (NT2K5)
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
    if (!AudioContext) {
      alert("Web Audio API is not supported in this environment.");
      return;
    }

    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;
    analyserRef.current = analyser;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.35, ctx.currentTime);

    // Optional DSP Bandpass Filter (250Hz - 900Hz)
    if (filterEnabled) {
      const bpHigher = ctx.createBiquadFilter();
      bpHigher.type = "highpass";
      bpHigher.frequency.setValueAtTime(250, ctx.currentTime);

      const bpLower = ctx.createBiquadFilter();
      bpLower.type = "lowpass";
      bpLower.frequency.setValueAtTime(900, ctx.currentTime);

      masterGain.connect(bpHigher);
      bpHigher.connect(bpLower);
      bpLower.connect(analyser);
    } else {
      masterGain.connect(analyser);
    }

    analyser.connect(ctx.destination);

    const freqs = calculateCipherFrequencies();
    const duration = 4.0; // 4 seconds playback

    // 1. Generate the 5-tone Polyphonic Chord
    freqs.forEach((f) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(f, ctx.currentTime);
      osc.connect(masterGain);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
      activeNodesRef.current.push(osc);
    });

    // 2. Generate Acoustic Masking Noise (Pink noise + 120Hz sub-bass hum)
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
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
        b6 = white * 0.115926;
      }

      const noiseNode = ctx.createBufferSource();
      noiseNode.buffer = noiseBuffer;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.22, ctx.currentTime);
      noiseNode.connect(noiseGain);
      noiseGain.connect(masterGain);
      noiseNode.start(ctx.currentTime);
      noiseNode.stop(ctx.currentTime + duration);
      activeNodesRef.current.push(noiseNode);

      // 120Hz hum
      const humOsc = ctx.createOscillator();
      humOsc.type = "sawtooth";
      humOsc.frequency.setValueAtTime(120, ctx.currentTime);
      const humGain = ctx.createGain();
      humGain.gain.setValueAtTime(0.08, ctx.currentTime);
      humOsc.connect(humGain);
      humGain.connect(masterGain);
      humOsc.start(ctx.currentTime);
      humOsc.stop(ctx.currentTime + duration);
      activeNodesRef.current.push(humOsc);
    }

    setIsPlayingAudio(true);
    drawVisualizer();

    // Progress counter
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

      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Grid Lines
      ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
      ctx.lineWidth = 1;
      for (let y = 0; y < canvas.height; y += 25) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw Frequency Spectrum Bars
      const barWidth = (canvas.width / 120) * 1.5;
      let barX = 0;

      for (let i = 0; i < 120; i++) {
        const barHeight = (dataArray[i] / 255) * (canvas.height - 10);
        
        // Highlight 300Hz - 825Hz frequency sweet spot (approx bins 14 to 38)
        const isClusterRange = i >= 14 && i <= 40;

        ctx.fillStyle = isClusterRange
          ? "rgba(34, 211, 238, 0.85)" // Cyan cluster
          : "rgba(148, 163, 184, 0.35)"; // Ambient noise

        ctx.fillRect(barX, canvas.height - barHeight, barWidth - 1, barHeight);
        barX += barWidth + 1;
      }
    };

    render();
  };

  const downloadWavAudio = async () => {
    const offlineCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, 44100 * 4, 44100);
    const masterGain = offlineCtx.createGain();
    masterGain.gain.setValueAtTime(0.35, 0);
    masterGain.connect(offlineCtx.destination);

    const freqs = calculateCipherFrequencies();
    freqs.forEach((f) => {
      const osc = offlineCtx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(f, 0);
      osc.connect(masterGain);
      osc.start(0);
      osc.stop(4.0);
    });

    // Add noise layer to offline rendered file
    const bufferSize = 44100 * 4;
    const noiseBuffer = offlineCtx.createBuffer(1, bufferSize, 44100);
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
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }

    const noiseNode = offlineCtx.createBufferSource();
    noiseNode.buffer = noiseBuffer;
    const noiseGain = offlineCtx.createGain();
    noiseGain.gain.setValueAtTime(0.22, 0);
    noiseNode.connect(noiseGain);
    noiseGain.connect(masterGain);
    noiseNode.start(0);
    noiseNode.stop(4.0);

    const renderedBuffer = await offlineCtx.startRendering();
    const wavBlob = bufferToWave(renderedBuffer, renderedBuffer.length);
    const url = URL.createObjectURL(wavBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "level6_acoustic_cipher_stream.wav";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleTestKeyChange = (index, value) => {
    const val = value.toUpperCase().slice(-1);
    const next = [...decryptionTest];
    next[index] = val;
    setDecryptionTest(next);
    setVerifyStatus(null);

    // Auto-advance input focus
    if (val && index < 4) {
      const nextInput = document.getElementById(`dec-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleVerifyKey = () => {
    const code = decryptionTest.join("").trim().toUpperCase();
    if (code === SECRET_CODE) {
      setVerifyStatus("success");
    } else {
      setVerifyStatus("fail");
    }
  };

  const filteredPackets = [...packets].filter(
    (p) => filterMethod === "ALL" || p.method === filterMethod
  );

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="flex flex-col gap-3 w-full font-mono text-xs select-none max-w-5xl mx-auto"
    >
      {/* Top Laboratory Mode Switcher */}
      <div className="flex items-center justify-between bg-white/[0.04] border border-white/15 p-2 rounded-2xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("sonification")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
              activeTab === "sonification"
                ? "bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Radio size={14} />
            <span>DATA SONIFICATION // ACOUSTIC VAULT</span>
          </button>

          <button
            onClick={() => setActiveTab("pcap")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
              activeTab === "pcap"
                ? "bg-white text-black shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Network size={14} />
            <span>REALTIME PCAP STREAM (LOGS)</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-[10px] text-zinc-500 font-mono pr-2">
          <span>PORT: 8080 // CHORD CBC CIPHER</span>
        </div>
      </div>

      {/* 1. DATA SONIFICATION ACOUSTIC CIPHER WORKBENCH */}
      {activeTab === "sonification" && (
        <div className="flex flex-col gap-3 w-full animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            
            {/* Left Col: DSP Synthesizer & Realtime FFT Spectrogram */}
            <div className="lg:col-span-7 bg-black border border-white/15 rounded-2xl p-4 flex flex-col gap-3 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <Activity size={15} className="text-cyan-400 animate-pulse" />
                  <span>ACOUSTIC CHORD INTERCEPTOR // 5-TONE CBC SIGNAL</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setFilterEnabled(!filterEnabled)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                      filterEnabled
                        ? "bg-emerald-950 border-emerald-400/60 text-emerald-300"
                        : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                    }`}
                    title="Toggle 250Hz-900Hz Bandpass Filter"
                  >
                    <Sliders size={11} />
                    <span>{filterEnabled ? "DSP FILTER: ON" : "DSP FILTER: OFF"}</span>
                  </button>
                </div>
              </div>

              {/* Real-time Canvas FFT Spectrum Visualizer */}
              <div className="relative rounded-xl overflow-hidden border border-white/10 bg-[#09090b] h-40 flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  width={560}
                  height={160}
                  className="w-full h-full block"
                />

                {!isPlayingAudio && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex flex-col items-center justify-center gap-2 text-slate-400">
                    <Radio size={24} className="text-cyan-400" />
                    <span className="text-[11px] font-bold">CLICK CAPTURE TO SYNTHESIZE AUDIO STREAM</span>
                  </div>
                )}

                {isPlayingAudio && (
                  <div className="absolute top-2 left-3 flex items-center gap-2 bg-black/80 px-2 py-0.5 rounded border border-cyan-400/40 text-[9px] text-cyan-300 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    <span>CLUSTER TRANSMISSION ACTIVE ({audioProgress}%)</span>
                  </div>
                )}
              </div>

              {/* Audio Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={isPlayingAudio ? stopAudio : playCipherChord}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-extrabold text-xs tracking-wider transition-all cursor-pointer ${
                      isPlayingAudio
                        ? "bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_15px_rgba(225,29,72,0.4)]"
                        : "bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_20px_rgba(6,182,212,0.35)]"
                    }`}
                  >
                    {isPlayingAudio ? <Square size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
                    <span>{isPlayingAudio ? "STOP AUDIO" : "CAPTURE & PLAY CIPHER CHORD"}</span>
                  </button>

                  <button
                    onClick={downloadWavAudio}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white text-xs font-bold transition-all cursor-pointer"
                    title="Download 4-second WAV audio stream for Audacity or Python FFT analysis"
                  >
                    <Download size={13} />
                    <span>EXPORT .WAV</span>
                  </button>
                </div>

                <div className="text-[10px] text-zinc-400 font-mono">
                  <span>DURATION: 4.0s // 5 SINES + PINK NOISE</span>
                </div>
              </div>
            </div>

            {/* Right Col: Mathematical Unchaining Manifest & Key Input */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              
              {/* Manifest Card */}
              <div className="bg-[#0b0b0e] border border-cyan-500/30 rounded-2xl p-4 flex flex-col gap-2.5 shadow-2xl">
                <div className="flex items-center gap-1.5 text-cyan-300 font-black text-xs uppercase tracking-wider border-b border-white/10 pb-2">
                  <Cpu size={14} />
                  <span>ACOUSTIC CBC CIPHER MANIFEST</span>
                </div>

                <div className="text-[11px] text-slate-300 flex flex-col gap-1.5 leading-relaxed">
                  <div>
                    <span className="text-zinc-500">Target Bandwidth:</span>{" "}
                    <span className="text-white font-bold">300Hz – 825Hz</span> (Microtonal Polyphonic Cluster)
                  </div>
                  <div>
                    <span className="text-zinc-500">Initialization Vector:</span>{" "}
                    <span className="text-amber-300 font-bold">V₀ = 17</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Chaining Formula:</span>{" "}
                    <span className="text-cyan-300 font-bold">Vₙ = (Cₙ + Vₙ₋₁) mod 36</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Frequency Formula:</span>{" "}
                    <span className="text-emerald-300 font-bold">Freqₙ = 300 + (Vₙ × 15) Hz</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Alphabet Mapping:</span>{" "}
                    <span className="text-slate-300">0–9 → 0–9, A–Z → 10–35</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[10px] text-slate-400">
                  <span className="text-amber-300 font-bold">INVERSE DSP STEP:</span> Identify the 5 isolated FFT peaks, compute <span className="text-white font-mono">Vₙ = (Freqₙ - 300) / 15</span>, then unchain <span className="text-white font-mono">Cₙ = (Vₙ - Vₙ₋₁) mod 36</span> to recover the 5-character token.
                </div>
              </div>

              {/* Decryption Parity Verifier */}
              <div className="bg-black border border-white/15 rounded-2xl p-4 flex flex-col gap-3 shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-white font-bold text-xs">TEST DECRYPTION KEY PARITY</span>
                  <span className="text-[10px] text-zinc-500">5 ALPHANUMERIC CHARACTERS</span>
                </div>

                <div className="flex items-center justify-center gap-2 py-1">
                  {[0, 1, 2, 3, 4].map((idx) => (
                    <input
                      key={idx}
                      id={`dec-input-${idx}`}
                      type="text"
                      maxLength={1}
                      value={decryptionTest[idx]}
                      onChange={(e) => handleTestKeyChange(idx, e.target.value)}
                      placeholder="_"
                      className="w-10 h-12 text-center text-lg font-black bg-white/5 border border-white/20 focus:border-cyan-400 focus:bg-cyan-950/20 text-white rounded-xl uppercase outline-none transition-all"
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleVerifyKey}
                    className="flex-1 py-2 rounded-xl bg-white hover:bg-slate-200 text-black font-extrabold text-xs transition-all cursor-pointer shadow"
                  >
                    TEST DECRYPTION KEY
                  </button>
                  <button
                    onClick={() => {
                      setDecryptionTest(["", "", "", "", ""]);
                      setVerifyStatus(null);
                    }}
                    className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    RESET
                  </button>
                </div>

                {verifyStatus === "success" && (
                  <div className="p-2.5 rounded-xl bg-emerald-950/90 border border-emerald-400/60 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <span>ACCESS GRANTED: Signal decoded successfully into <strong>{SECRET_CODE}</strong>. Submit below to proceed!</span>
                  </div>
                )}

                {verifyStatus === "fail" && (
                  <div className="p-2.5 rounded-xl bg-rose-950/90 border border-rose-500/60 text-rose-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
                    <AlertTriangle size={16} className="text-rose-400 shrink-0" />
                    <span>DECRYPTION FAILED: Phase parity mismatch. Re-calibrate FFT peak detection.</span>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 2. ORIGINAL PCAP PACKET INSPECTION STREAM (PRESERVED 100%) */}
      {activeTab === "pcap" && (
        <div className="flex flex-col gap-3 w-full animate-fade-in">
          {/* PCAP Packet Stream Table Viewport */}
          <div className="rounded-2xl overflow-hidden border border-white/15 p-4 flex flex-col bg-black shadow-2xl relative min-h-[260px] w-full">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 text-white font-bold text-xs">
                <Network size={15} />
                <span>REALTIME PCAP CAPTURE LOG // 80 FRAMES INTERCEPTED</span>
              </div>

              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                {["ALL", "GET", "POST", "PUT", "HEAD"].map((m) => (
                  <button
                    key={m}
                    onClick={() => setFilterMethod(m)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      filterMethod === m
                        ? "bg-white text-black shadow"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Packet Stream Table */}
            <div className="overflow-x-auto max-h-[220px] rounded-xl border border-white/10 bg-black">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-black text-slate-400 uppercase tracking-wider border-b border-white/10 z-10">
                  <tr>
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">Method</th>
                    <th className="p-2.5">Endpoint URI</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5 text-right">Payload Size</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-200">
                  {filteredPackets.map((pkt) => {
                    const isSelected = selectedPacket?.id === pkt.id;
                    const sizeDisplay = pkt.size_kb ? `${pkt.size_kb} KB` : `${(pkt.size_bytes / 1024).toFixed(1)} KB`;
                    return (
                      <tr
                        key={pkt.id}
                        onClick={() => setSelectedPacket(pkt)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-white/20 text-white font-bold"
                            : "hover:bg-white/5"
                        }`}
                      >
                        <td className="p-2.5 font-mono">{pkt.id}</td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            pkt.method === "POST"
                              ? "bg-white/20 text-white"
                              : pkt.method === "PUT"
                              ? "bg-white/10 text-slate-300"
                              : "bg-black text-slate-400 border border-white/10"
                          }`}>
                            {pkt.method}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono text-slate-300">{pkt.uri}</td>
                        <td className="p-2.5 text-slate-300">{pkt.status} OK</td>
                        <td className="p-2.5 text-right font-bold font-mono text-white">
                          {sizeDisplay}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Packet Header Inspection Terminal */}
          {selectedPacket && (
            <div className="rounded-2xl p-4 border border-white/15 bg-black flex flex-col gap-3 shadow-2xl animate-fade-in w-full">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-white font-bold text-xs uppercase tracking-wider">
                  PACKET #{selectedPacket.id} // {selectedPacket.method} {selectedPacket.uri}
                </span>
                <span className="text-slate-400 text-[10px]">{selectedPacket.timestamp}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex flex-col gap-1.5">
                  <div><span className="text-slate-400">Client IP:</span> <span className="text-white font-bold font-mono">{selectedPacket.client_ip}</span></div>
                  <div><span className="text-slate-400">User-Agent:</span> <span className="text-white font-mono">{selectedPacket.user_agent}</span></div>
                  <div><span className="text-slate-400">Status:</span> <span className="text-white font-bold">{selectedPacket.status} OK</span></div>
                  <div><span className="text-slate-400">Payload Size:</span> <span className="text-white font-bold font-mono">{selectedPacket.size_kb ? `${selectedPacket.size_kb} KB` : `${(selectedPacket.size_bytes / 1024).toFixed(1)} KB`} ({selectedPacket.size_bytes.toLocaleString()} bytes)</span></div>
                </div>

                <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex flex-col gap-1.5">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Authorization Header:</span>
                  <div className="p-2.5 bg-black rounded-lg border border-white/15 text-white font-mono break-all text-xs select-text">
                    {selectedPacket.authorization}
                  </div>
                  <span className="text-[10px] text-slate-500 italic">
                    Inspect raw token header value to extract authorization credentials.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
