import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { notifyAudioPlay, notifyAudioPause, notifyAudioEnded } from "../../lib/audioManager.js";
import { assetUrl } from "../../lib/assetHelper.js";

// 5 Discrete Morse Target Bands for Token "K 4 P 8 2"
const MORSE_TARGETS = [
  { id: "K", char: "K", freq: 800,  start: 2.0,  end: 4.5,  bandMin: 650,  bandMax: 950,  file: "/evidence/morse_k.wav" },
  { id: "4", char: "4", freq: 1500, start: 5.5,  end: 8.5,  bandMin: 1350, bandMax: 1650, file: "/evidence/morse_4.wav" },
  { id: "P", char: "P", freq: 2400, start: 9.5,  end: 12.5, bandMin: 2250, bandMax: 2550, file: "/evidence/morse_p.wav" },
  { id: "8", char: "8", freq: 3200, start: 13.5, end: 16.0, bandMin: 3050, bandMax: 3350, file: "/evidence/morse_8.wav" },
  { id: "2", char: "2", freq: 3800, start: 16.8, end: 19.8, bandMin: 3650, bandMax: 3950, file: "/evidence/morse_2.wav" }
];

export default function AudioLab({ config, onEvidenceReady }) {
  const audioCtxRef = useRef(null);
  const voiceBufferRef = useRef(null);
  const morseBuffersRef = useRef({});

  // Active Source Nodes
  const voiceSourceRef = useRef(null);
  const morseSourcesRef = useRef({});

  // Gain Nodes
  const voiceGainRef = useRef(null);
  const morseGainsRef = useRef({});
  const masterGainRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(20.23);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Audio DSP Filter States (Default: Voice Only Low-Pass at 800 Hz)
  const [filterType, setFilterType] = useState("lowpass"); // 'lowpass' | 'bandpass' | 'highpass' | 'bypass'
  const [frequency, setFrequency] = useState(800); // 800 Hz default

  const startTimeRef = useRef(0);
  const pauseOffsetRef = useRef(0);
  const animFrameRef = useRef(null);

  // Load and decode all 6 audio buffers on mount
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

    // Load pure voice audio
    fetch(assetUrl("/evidence/voicemail_voice.wav"))
      .then((res) => res.arrayBuffer())
      .then((data) => ctx.decodeAudioData(data))
      .then((decoded) => {
        voiceBufferRef.current = decoded;
        setDuration(decoded.duration);
        checkAllLoaded();
      })
      .catch((err) => {
        console.error("Error loading voice audio buffer:", err);
        checkAllLoaded();
      });

    // Load 5 separate morse buffers
    MORSE_TARGETS.forEach((item) => {
      fetch(assetUrl(item.file))
        .then((res) => res.arrayBuffer())
        .then((data) => ctx.decodeAudioData(data))
        .then((decoded) => {
          morseBuffersRef.current[item.id] = decoded;
          checkAllLoaded();
        })
        .catch((err) => {
          console.error(`Error loading morse buffer ${item.id}:`, err);
          checkAllLoaded();
        });
    });

    const fallbackSafety = setTimeout(() => {
      onEvidenceReady?.();
    }, 2000);

    return () => {
      clearTimeout(fallbackSafety);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      stopAudioPlayback();
      if (ctx.state !== "closed") {
        try {
          ctx.close();
        } catch (e) {}
      }
    };
  }, []);

  // Update dynamic gains based on filter mode and frequency with comfortable, gentle listening levels
  const updateGains = (type, freq) => {
    const vGain = voiceGainRef.current;
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;

    // 1. Voice Track Gain Calculation
    if (vGain) {
      if (type === "lowpass") {
        vGain.gain.setTargetAtTime(0.90, now, 0.02); // Voice full volume
      } else if (type === "bandpass") {
        vGain.gain.setTargetAtTime(0.12, now, 0.02); // Speech dimmed to spotlight Morse carrier
      } else if (type === "highpass") {
        // High-pass cuts voice when freq > 1600 Hz
        vGain.gain.setTargetAtTime(freq >= 2400 ? 0.03 : 0.30, now, 0.02);
      } else if (type === "bypass") {
        vGain.gain.setTargetAtTime(0.90, now, 0.02);
      }
    }

    // 2. Individual 5 Morse Tracks Gains (Soft, comfortable, non-piercing volume)
    MORSE_TARGETS.forEach((target) => {
      const gNode = morseGainsRef.current[target.id];
      if (!gNode) return;

      let gainVal = 0.0; // Default: 100% INAUDIBLE (0.000)

      if (type === "lowpass") {
        // Voice Only mode: All Morse codes are completely silenced (0.000)
        gainVal = 0.0;
      } else if (type === "bandpass") {
        // Bandpass Isolator: Strictly isolated to its narrow frequency band (+/- 150 Hz)
        if (freq >= target.bandMin && freq <= target.bandMax) {
          const dist = Math.abs(freq - target.freq);
          const maxDist = (target.bandMax - target.bandMin) / 2;
          const ratio = Math.max(0, 1.0 - dist / maxDist);
          // Soft, gentle volume (0.08 to 0.22 max) with high-frequency attenuation
          const freqDampening = target.freq >= 3000 ? 0.70 : target.freq >= 2000 ? 0.85 : 1.0;
          gainVal = (0.08 + ratio * 0.14) * freqDampening;
        } else {
          gainVal = 0.0; // 100% SILENT outside this digit's band
        }
      } else if (type === "highpass") {
        // High-Pass: Soft gentle volume for high targets
        if (target.freq >= 3000 && freq >= 2800) {
          if (target.id === "8" && freq <= 3400) {
            gainVal = 0.16;
          } else if (target.id === "2" && freq >= 3500) {
            gainVal = 0.14;
          } else if (freq >= 2800 && freq <= 3900) {
            gainVal = 0.12;
          }
        } else {
          gainVal = 0.0; // 100% SILENT for lower targets (K, 4, P)
        }
      } else if (type === "bypass") {
        // Raw unprocessed background level (gentle submerged tick)
        gainVal = 0.015;
      }

      gNode.gain.setTargetAtTime(gainVal, now, 0.02);
    });
  };

  useEffect(() => {
    updateGains(filterType, frequency);
  }, [filterType, frequency]);

  const stopAudioPlayback = () => {
    if (voiceSourceRef.current) {
      try {
        voiceSourceRef.current.stop();
      } catch (e) {}
      voiceSourceRef.current = null;
    }

    MORSE_TARGETS.forEach((item) => {
      const s = morseSourcesRef.current[item.id];
      if (s) {
        try {
          s.stop();
        } catch (e) {}
        morseSourcesRef.current[item.id] = null;
      }
    });

    notifyAudioPause();
  };

  const startAudioPlayback = (offsetSeconds) => {
    const ctx = audioCtxRef.current;
    if (!ctx || !voiceBufferRef.current) return;

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    stopAudioPlayback();

    const master = ctx.createGain();
    master.gain.value = 1.0;
    master.connect(ctx.destination);
    masterGainRef.current = master;

    // 1. Voice Source & Gain Node
    const vSource = ctx.createBufferSource();
    vSource.buffer = voiceBufferRef.current;
    vSource.playbackRate.value = playbackRate;

    const vGain = ctx.createGain();
    vGain.gain.value = 1.0;
    vSource.connect(vGain);
    vGain.connect(master);

    voiceSourceRef.current = vSource;
    voiceGainRef.current = vGain;

    // 2. Five Morse Sources & Dedicated Gain Nodes
    MORSE_TARGETS.forEach((item) => {
      const buf = morseBuffersRef.current[item.id];
      if (!buf) return;

      const mSource = ctx.createBufferSource();
      mSource.buffer = buf;
      mSource.playbackRate.value = playbackRate;

      const mGain = ctx.createGain();
      mGain.gain.value = 0.0; // Configured immediately via updateGains()
      mSource.connect(mGain);
      mGain.connect(master);

      morseSourcesRef.current[item.id] = mSource;
      morseGainsRef.current[item.id] = mGain;

      mSource.start(0, Math.min(offsetSeconds, buf.duration));
    });

    // Update gain values immediately
    updateGains(filterType, frequency);

    vSource.onended = () => {
      if (isPlaying) {
        setIsPlaying(false);
        pauseOffsetRef.current = 0;
        setCurrentTime(0);
        notifyAudioEnded();
      }
    };

    vSource.start(0, Math.min(offsetSeconds, voiceBufferRef.current.duration));

    startTimeRef.current = ctx.currentTime - offsetSeconds / playbackRate;
    pauseOffsetRef.current = offsetSeconds;
    setIsPlaying(true);
    notifyAudioPlay();

    // Timeline tracker loop
    const trackTimeline = () => {
      if (!audioCtxRef.current) return;
      const elapsed = (audioCtxRef.current.currentTime - startTimeRef.current) * playbackRate;
      if (elapsed >= (voiceBufferRef.current?.duration || 20.23)) {
        setCurrentTime(voiceBufferRef.current?.duration || 20.23);
        setIsPlaying(false);
        pauseOffsetRef.current = 0;
        return;
      }
      setCurrentTime(Math.max(0, elapsed));
      animFrameRef.current = requestAnimationFrame(trackTimeline);
    };
    animFrameRef.current = requestAnimationFrame(trackTimeline);
  };

  const togglePlay = () => {
    if (isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioCtxRef.current) {
        const elapsed = (audioCtxRef.current.currentTime - startTimeRef.current) * playbackRate;
        pauseOffsetRef.current = elapsed;
      }
      stopAudioPlayback();
      setIsPlaying(false);
    } else {
      let offset = pauseOffsetRef.current;
      if (offset >= duration) offset = 0;
      startAudioPlayback(offset);
    }
  };

  const handleSeek = (newTime) => {
    pauseOffsetRef.current = newTime;
    setCurrentTime(newTime);
    if (isPlaying) {
      startAudioPlayback(newTime);
    }
  };

  const handleRateChange = (rate) => {
    setPlaybackRate(rate);
    if (isPlaying) {
      startAudioPlayback(currentTime);
    }
  };

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="flex flex-col gap-3.5 w-full select-none font-mono text-xs max-w-5xl mx-auto"
    >
      {/* Sleek, Unified Forensic Audio Console */}
      <div className="bg-black p-4 rounded-2xl border border-white/15 w-full flex flex-col gap-3">
        {/* Row 1: Play/Pause, Timeline Scrubber & Speed Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="px-4 py-2 bg-white hover:bg-zinc-200 text-black font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md text-xs whitespace-nowrap"
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />} {isPlaying ? "Pause" : "Play Voicemail"}
            </button>
            <button
              onClick={() => {
                if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
                stopAudioPlayback();
                pauseOffsetRef.current = 0;
                setCurrentTime(0);
                setIsPlaying(false);
              }}
              className="p-2 bg-black border border-white/15 hover:border-white text-zinc-300 rounded-xl cursor-pointer"
              title="Reset Track"
            >
              <RotateCcw size={13} />
            </button>
          </div>

          {/* Timeline Scrubber */}
          <div className="flex-1 min-w-[200px] flex items-center gap-2">
            <input
              type="range"
              min="0"
              max={duration || 20.23}
              step="0.05"
              value={currentTime}
              onChange={(e) => handleSeek(Number(e.target.value))}
              className="w-full accent-white cursor-pointer"
            />
            <span className="text-[10px] text-zinc-400 font-mono whitespace-nowrap">
              {currentTime.toFixed(1)}s / {(duration || 20.23).toFixed(1)}s
            </span>
          </div>

          {/* Playback Speeds */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
            {[0.25, 0.5, 1.0, 1.5, 2.0].map((rate) => (
              <button
                key={rate}
                onClick={() => handleRateChange(rate)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                  playbackRate === rate
                    ? "bg-white text-black shadow"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Filter Mode Selector & Frequency Slider */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center pt-2.5 border-t border-white/10">
          {/* Filter Mode Selector Pills */}
          <div className="md:col-span-6 flex items-center gap-1.5">
            {[
              { id: "lowpass", label: "Voice Only (Low-Pass)" },
              { id: "bandpass", label: "Bandpass Isolator" },
              { id: "highpass", label: "High-Pass" },
              { id: "bypass", label: "Bypass" }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`flex-1 py-1.5 px-2 rounded-lg border text-[10px] font-bold transition-all cursor-pointer text-center whitespace-nowrap ${
                  filterType === f.id
                    ? "bg-white text-black border-white shadow"
                    : "bg-black text-zinc-400 border-white/10 hover:border-white/30"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Frequency Tuning Slider */}
          <div className="md:col-span-6 flex items-center gap-3">
            <span className="text-[10px] text-zinc-400 whitespace-nowrap font-bold">
              Frequency: <span className="text-white">{frequency} Hz</span>
            </span>
            <input
              type="range"
              min="200"
              max="4000"
              step="25"
              value={frequency}
              onChange={(e) => setFrequency(Number(e.target.value))}
              disabled={filterType === "bypass" || filterType === "lowpass"}
              className="w-full accent-white cursor-pointer disabled:opacity-30"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
