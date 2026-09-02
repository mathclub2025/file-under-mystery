import React, { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2, RotateCcw, Radio, Sliders, Grid3X3, KeyRound, Layers, ShieldAlert, CheckCircle2, Rewind, HelpCircle, Activity } from "lucide-react";
import { notifyAudioPlay, notifyAudioPause, notifyAudioEnded } from "../../lib/audioManager.js";
import { assetUrl } from "../../lib/assetHelper.js";

// 6x6 Alphanumeric Polybius Square Matrix
const POLYBIUS_6X6 = [
  ["A", "B", "C", "D", "E", "F"], // Row 1
  ["G", "H", "I", "J", "K", "L"], // Row 2
  ["M", "N", "O", "P", "Q", "R"], // Row 3
  ["S", "T", "U", "V", "W", "X"], // Row 4
  ["Y", "Z", "1", "2", "3", "4"], // Row 5
  ["5", "6", "7", "8", "9", "0"]  // Row 6
];

// The 5 harmonic frequency coordinates:
// 432 Hz  -> (3,4) = P  (at 3.0s)
// 864 Hz  -> (2,2) = H  (at 7.5s)
// 1296 Hz -> (5,6) = 4  (at 12.0s)
// 1728 Hz -> (5,2) = Z  (at 16.5s)
// 2160 Hz -> (5,5) = 3  (at 21.0s)
const HARMONIC_CONFIG = [
  { freq: 432,  file: "/evidence/coord_432.wav",  label: "1st Harmonic (432 Hz)" },
  { freq: 864,  file: "/evidence/coord_864.wav",  label: "2nd Harmonic (864 Hz)" },
  { freq: 1296, file: "/evidence/coord_1296.wav", label: "3rd Harmonic (1296 Hz)" },
  { freq: 1728, file: "/evidence/coord_1728.wav", label: "4th Harmonic (1728 Hz)" },
  { freq: 2160, file: "/evidence/coord_2160.wav", label: "5th Harmonic (2160 Hz)" }
];

export default function PhaseLab({ config, onEvidenceReady }) {
  const audioCtxRef = useRef(null);
  const baseBufferRef = useRef(null);
  const coordBuffersRef = useRef({});

  // Active Source Nodes
  const baseSourceRef = useRef(null);
  const coordSourcesRef = useRef({});

  // Gain Nodes for Crossfading
  const baseGainRef = useRef(null);
  const coordGainsRef = useRef({});
  const masterGainRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [filterFrequency, setFilterFrequency] = useState(1000);
  const [phaseInverted, setPhaseInverted] = useState(false);
  const [playbackDirection, setPlaybackDirection] = useState("forward");
  const [masterVolume, setMasterVolume] = useState(100);
  const [phaseAlignment, setPhaseAlignment] = useState(0); // 0 (Original Mixed) to 180 (Full Inversion/Cancellation)
  const [finePhaseShift, setFinePhaseShift] = useState(0); // -15 to +15 fine calibration degrees
  const [selectedHarmonic, setSelectedHarmonic] = useState(1000); // active harmonic inspection
  const [unlockedCoords, setUnlockedCoords] = useState({}); // { [freq]: { row, col, char } }

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(25.0);
  const startTimeRef = useRef(0);
  const pauseOffsetRef = useRef(0);
  const animFrameRef = useRef(null);

  // Load all audio buffers on mount
  useEffect(() => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    let loadedCount = 0;
    const totalToLoad = 6;
    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount >= totalToLoad) {
        onEvidenceReady?.();
      }
    };

    // Load base atmospheric audio
    fetch(assetUrl("/evidence/stereo_phase_carrier.wav"))
      .then((res) => res.arrayBuffer())
      .then((data) => ctx.decodeAudioData(data))
      .then((decoded) => {
        baseBufferRef.current = decoded;
        setDuration(decoded.duration);
        checkAllLoaded();
      })
      .catch((e) => {
        console.error("Error loading base audio:", e);
        checkAllLoaded();
      });

    // Load 5 synchronized 25s coordinate audio buffers
    HARMONIC_CONFIG.forEach((item) => {
      fetch(assetUrl(item.file))
        .then((res) => res.arrayBuffer())
        .then((data) => ctx.decodeAudioData(data))
        .then((decoded) => {
          coordBuffersRef.current[item.freq] = decoded;
          checkAllLoaded();
        })
        .catch((e) => {
          console.error(`Error loading coord ${item.freq}:`, e);
          checkAllLoaded();
        });
    });

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (ctx.state !== "closed") ctx.close();
    };
  }, [onEvidenceReady]);

  // Helper to reverse an AudioBuffer
  const createReversedBuffer = (ctx, buffer) => {
    const rev = ctx.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
      const src = buffer.getChannelData(ch);
      const dest = rev.getChannelData(ch);
      for (let i = 0; i < src.length; i++) {
        dest[i] = src[src.length - 1 - i];
      }
    }
    return rev;
  };

  const stopAllAudio = () => {
    if (baseSourceRef.current) {
      try { baseSourceRef.current.stop(); } catch (e) {}
    }
    Object.values(coordSourcesRef.current).forEach((s) => {
      try { s.stop(); } catch (e) {}
    });
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    notifyAudioPause();
  };

  // Build / update live Web Audio graph
  const startPlaybackAt = (offset) => {
    if (!audioCtxRef.current || !baseBufferRef.current) return;
    const ctx = audioCtxRef.current;
    if (ctx.state === "suspended") ctx.resume();

    stopAllAudio();

    // Master Gain
    const masterGain = ctx.createGain();
    masterGain.gain.value = masterVolume / 100;
    masterGain.connect(ctx.destination);
    masterGainRef.current = masterGain;

    // 1. BASE AUDIO STREAM
    let baseBuf = baseBufferRef.current;
    if (playbackDirection === "reverse") {
      baseBuf = createReversedBuffer(ctx, baseBufferRef.current);
    }
    const baseSource = ctx.createBufferSource();
    baseSource.buffer = baseBuf;
    baseSourceRef.current = baseSource;

    const baseGain = ctx.createGain();
    baseGain.gain.value = phaseInverted ? 0.12 : 0.85;
    baseGainRef.current = baseGain;

    baseSource.connect(baseGain);
    baseGain.connect(masterGain);

    const clampedOffset = Math.max(0, Math.min(offset, baseBuf.duration));
    baseSource.start(0, clampedOffset);

    // 2. COORDINATE STREAMS
    HARMONIC_CONFIG.forEach((item) => {
      const rawBuf = coordBuffersRef.current[item.freq];
      if (!rawBuf) return;

      let coordBuf = rawBuf;
      if (playbackDirection === "reverse") {
        coordBuf = createReversedBuffer(ctx, rawBuf);
      }

      const cSource = ctx.createBufferSource();
      cSource.buffer = coordBuf;
      coordSourcesRef.current[item.freq] = cSource;

      const cGain = ctx.createGain();
      const isTarget = Math.abs(filterFrequency - item.freq) <= 30;
      
      let gainVal = 0;
      if (isTarget) {
        gainVal = phaseInverted ? 1.0 : 0.08;
      }
      cGain.gain.value = gainVal;
      coordGainsRef.current[item.freq] = cGain;

      cSource.connect(cGain);
      cGain.connect(masterGain);

      cSource.start(0, clampedOffset);
    });

    startTimeRef.current = ctx.currentTime - clampedOffset;
    pauseOffsetRef.current = clampedOffset;
    setIsPlaying(true);
    notifyAudioPlay();

    baseSource.onended = () => {
      setIsPlaying(false);
      pauseOffsetRef.current = 0;
      setCurrentTime(0);
      notifyAudioEnded();
    };

    // Timeline update loop
    const updateTimeline = () => {
      if (audioCtxRef.current && baseSourceRef.current) {
        const elapsed = audioCtxRef.current.currentTime - startTimeRef.current;
        if (elapsed <= duration) {
          setCurrentTime(elapsed);
          animFrameRef.current = requestAnimationFrame(updateTimeline);
        }
      }
    };
    animFrameRef.current = requestAnimationFrame(updateTimeline);
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopAllAudio();
      pauseOffsetRef.current = currentTime;
      setIsPlaying(false);
    } else {
      startPlaybackAt(pauseOffsetRef.current);
    }
  };

  const handleSeek = (newTime) => {
    pauseOffsetRef.current = newTime;
    setCurrentTime(newTime);
    if (isPlaying) {
      startPlaybackAt(newTime);
    }
  };

  const togglePhase = () => {
    const nextState = !phaseInverted;
    setPhaseInverted(nextState);
    const now = audioCtxRef.current?.currentTime || 0;
    
    // Crossfade base layer
    if (baseGainRef.current) {
      baseGainRef.current.gain.setTargetAtTime(nextState ? 0.12 : 0.85, now, 0.05);
    }
    // Crossfade coordinate layers
    HARMONIC_CONFIG.forEach((item) => {
      const g = coordGainsRef.current[item.freq];
      if (g) {
        const isTarget = Math.abs(filterFrequency - item.freq) <= 30;
        const targetGain = isTarget ? (nextState ? 1.0 : 0.08) : 0;
        g.gain.setTargetAtTime(targetGain, now, 0.05);
      }
    });
  };

  const toggleReverse = () => {
    if (isPlaying) return; // Locked during active playback
    const nextDir = playbackDirection === "forward" ? "reverse" : "forward";
    setPlaybackDirection(nextDir);
    const newOffset = Math.max(0, duration - currentTime);
    pauseOffsetRef.current = newOffset;
    setCurrentTime(newOffset);
  };

  // Live filter frequency tuning: smoothly adjusts gain of the active harmonic channel in real time!
  useEffect(() => {
    if (!audioCtxRef.current) return;
    const now = audioCtxRef.current.currentTime;
    HARMONIC_CONFIG.forEach((item) => {
      const g = coordGainsRef.current[item.freq];
      if (g) {
        const isTarget = Math.abs(filterFrequency - item.freq) <= 30;
        const targetGain = isTarget ? (phaseInverted ? 1.0 : 0.08) : 0;
        g.gain.setTargetAtTime(targetGain, now, 0.05);
      }
    });
  }, [filterFrequency, phaseInverted]);

  // Live master volume
  useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = masterVolume / 100;
    }
  }, [masterVolume]);

  const activeHarmonic = HARMONIC_CONFIG.find(
    (h) => Math.abs(h.freq - filterFrequency) <= 30
  );

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="flex flex-col gap-6 w-full select-none font-mono text-xs max-w-4xl mx-auto pb-8"
    >
      {/* 1. TUNABLE HARMONIC AUDIO CONSOLE */}
      <div className="p-5 bg-black rounded-2xl border border-white/15 flex flex-col gap-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Radio size={16} className="text-white animate-pulse" />
            <span className="font-bold text-white uppercase text-xs">
              BINAURAL HARMONIC RESONATOR & REVERSE PHASE DECODER
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Reverse Playback Buffer Toggle Button (Locked while playing) */}
            <button
              onClick={toggleReverse}
              disabled={isPlaying}
              className={`px-3.5 py-2 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all ${
                isPlaying
                  ? "opacity-50 cursor-not-allowed bg-white/5 border-white/10 text-slate-500"
                  : playbackDirection === "reverse"
                    ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.4)] cursor-pointer"
                    : "bg-white/5 hover:bg-white/10 text-slate-300 border-white/15 cursor-pointer"
              }`}
              title={isPlaying ? "Pause stream first to toggle reverse playback" : "Reverse Audio Playback Buffer"}
            >
              <Rewind size={14} />
              <span>PLAYBACK: {playbackDirection === "reverse" ? "REVERSED" : "FORWARD"}</span>
              {isPlaying && <span className="text-[9px] text-slate-500 font-normal">(PAUSE FIRST)</span>}
            </button>

            {/* Play/Pause Button */}
            <button
              onClick={togglePlay}
              className="px-4 py-2 bg-white hover:bg-slate-200 text-black font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg transition-all text-xs"
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />} {isPlaying ? "Pause Stream" : "Play Stream"}
            </button>
          </div>
        </div>

        {/* Timeline Scrubber */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-slate-400 text-[10px]">
            <span>Timeline Position ({playbackDirection.toUpperCase()})</span>
            <span>{currentTime.toFixed(2)}s / {duration.toFixed(1)}s</span>
          </div>
          <input
            type="range"
            min="0"
            max={duration || 25}
            step="0.05"
            value={currentTime}
            onChange={(e) => handleSeek(Number(e.target.value))}
            className="w-full accent-white cursor-pointer"
          />
        </div>

        {/* Tunable Frequency Resonator & Bandpass Filter Faders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/10">
          {/* Bandpass Frequency Tuning Slider with Precision Steppers */}
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex flex-col gap-2">
            <div className="flex items-center justify-between text-slate-300 text-[10px]">
              <span className="flex items-center gap-1 font-bold">
                <Sliders size={12} /> Resonant Frequency
              </span>
              
              {/* Precision Steppers and Value */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setFilterFrequency((prev) => Math.max(200, prev - 1))}
                  className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/25 text-white font-bold text-[10px] cursor-pointer transition-colors"
                  title="Step -1 Hz"
                >
                  -1
                </button>
                <div className="px-2 py-0.5 rounded bg-black border border-white/20 text-white font-bold text-xs min-w-[65px] text-center">
                  {filterFrequency} Hz
                </div>
                <button
                  onClick={() => setFilterFrequency((prev) => Math.min(2800, prev + 1))}
                  className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/25 text-white font-bold text-[10px] cursor-pointer transition-colors"
                  title="Step +1 Hz"
                >
                  +1
                </button>
              </div>
            </div>

            <input
              type="range"
              min="200"
              max="2800"
              step="1"
              value={filterFrequency}
              onChange={(e) => setFilterFrequency(Number(e.target.value))}
              className="w-full accent-white cursor-pointer"
            />

            <div className="flex items-center justify-between text-slate-500 text-[9px]">
              <button
                onClick={() => setFilterFrequency((prev) => Math.max(200, prev - 10))}
                className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white cursor-pointer transition-colors"
                title="Step -10 Hz"
              >
                -10 Hz
              </button>
              <span>200 Hz &bull; 2800 Hz</span>
              <button
                onClick={() => setFilterFrequency((prev) => Math.min(2800, prev + 10))}
                className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white cursor-pointer transition-colors"
                title="Step +10 Hz"
              >
                +10 Hz
              </button>
            </div>
          </div>

          {/* Master Output Gain */}
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex flex-col justify-between gap-1.5">
            <div className="flex justify-between text-slate-300 text-[10px]">
              <span>Master Output Gain</span>
              <span className="text-white font-bold">{masterVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="150"
              value={masterVolume}
              onChange={(e) => setMasterVolume(Number(e.target.value))}
              className="w-full accent-white cursor-pointer"
            />
            <div className="flex justify-between text-slate-500 text-[9px]">
              <span>Mute (0%)</span>
              <span>100%</span>
              <span>150%</span>
            </div>
          </div>
        </div>

        {/* Phase Inversion & Status Header */}
        <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <button
            onClick={togglePhase}
            className={`py-3 px-6 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              phaseInverted
                ? "bg-white text-black border-white shadow-[0_0_25px_rgba(255,255,255,0.3)]"
                : "bg-black text-slate-300 border-white/20 hover:border-white/40"
            }`}
          >
            <Layers size={15} />
            <span>Right Channel 180° Inversion: {phaseInverted ? "ACTIVE (L - R NULL)" : "OFF (0° NORMAL)"}</span>
          </button>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Activity size={14} className={activeHarmonic && phaseInverted ? "text-white animate-pulse" : "text-slate-600"} />
            <span>
              {phaseInverted
                ? activeHarmonic
                  ? `[ RESONANCE NODE #${HARMONIC_CONFIG.indexOf(activeHarmonic) + 1} OF 5 LOCKED // REVERSED SUBCARRIER ACTIVE ]`
                  : `[ 180° PHASE NULL ACTIVE // TUNE RESONATOR FREQUENCY ]`
                : "[ NORMAL AUDIO PLAYBACK // FORWARD SPEECH MASK ACTIVE ]"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. THE 6x6 ALPHANUMERIC POLYBIUS MANIFOLD & LORE RIDDLE */}
      <div className="p-6 bg-black rounded-2xl border border-white/15 flex flex-col gap-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2 text-white font-bold text-xs">
            <Grid3X3 size={16} />
            <span>6&times;6 ALPHANUMERIC POLYBIUS MANIFOLD</span>
          </div>
          <span className="text-slate-400 text-[10px]">DECODING MATRIX: (ROW, COL)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
                <th className="p-2 text-[10px] text-slate-500">ROW \ COL</th>
                {[1, 2, 3, 4, 5, 6].map((col) => (
                  <th key={col} className="p-2 font-bold text-white text-xs">
                    COL {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {POLYBIUS_6X6.map((row, rIdx) => {
                const rowNum = rIdx + 1;
                return (
                  <tr key={rowNum} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-3 font-bold text-slate-400 border-r border-white/10 text-[11px]">
                      ROW {rowNum}
                    </td>
                    {row.map((cell, cIdx) => (
                      <td
                        key={cIdx + 1}
                        className="p-3 font-bold text-xs text-slate-200"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Storyline Harmonic Sequence Riddle */}
        <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex flex-col gap-1.5 text-xs leading-relaxed text-slate-300">
          <div className="flex items-center gap-1.5 font-bold text-white text-xs">
            <Radio size={14} className="text-white" />
            <span>MARROW'S FIELD TRANSMISSION LOG // LOG ENTRY #11</span>
          </div>
          <p className="text-slate-400 italic">
            "The foundation acoustic carrier rests upon a simple descending cadence: the Cardinal Watchtowers, the Trinity Courtyard, and the Twin Spires. From this base anchor, five sequential harmonic multiples ascend across the spectrum to transmit the hidden matrix coordinates."
          </p>
        </div>
      </div>
    </div>
  );
}
