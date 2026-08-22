import React, { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2, RotateCcw, Radio, Sliders } from "lucide-react";

export default function PhaseLab({ config }) {
  const audioRef = useRef(null);
  const audioCtxRef = useRef(null);
  const leftGainRef = useRef(null);
  const rightGainRef = useRef(null);
  const phaseInverterRef = useRef(null);
  const masterGainRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(20);

  // Volume & Phase Faders
  const [leftVolume, setLeftVolume] = useState(100);
  const [rightVolume, setRightVolume] = useState(100);
  const [masterVolume, setMasterVolume] = useState(100);
  const [phaseInverted, setPhaseInverted] = useState(false);

  const audioSrc = config.evidenceData?.audioUrl || "/evidence/stereo_phase_carrier.wav";

  const initAudioGraph = () => {
    if (audioCtxRef.current) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    const audioEl = audioRef.current;
    if (!audioEl) return;

    const source = ctx.createMediaElementSource(audioEl);
    const splitter = ctx.createChannelSplitter(2);
    const merger = ctx.createChannelMerger(2);

    const leftGain = ctx.createGain();
    const rightGain = ctx.createGain();
    const phaseInverter = ctx.createGain();
    const masterGain = ctx.createGain();

    leftGainRef.current = leftGain;
    rightGainRef.current = rightGain;
    phaseInverterRef.current = phaseInverter;
    masterGainRef.current = masterGain;

    // Connect Left
    source.connect(splitter);
    splitter.connect(leftGain, 0);
    leftGain.connect(merger, 0, 0);

    // Connect Right with Phase Inverter
    splitter.connect(rightGain, 1);
    rightGain.connect(phaseInverter);
    phaseInverter.connect(merger, 0, 1);

    // Master output
    merger.connect(masterGain);
    masterGain.connect(ctx.destination);
  };

  useEffect(() => {
    if (leftGainRef.current) leftGainRef.current.gain.value = leftVolume / 100;
    if (rightGainRef.current) rightGainRef.current.gain.value = rightVolume / 100;
    if (masterGainRef.current) masterGainRef.current.gain.value = masterVolume / 100;
    if (phaseInverterRef.current) phaseInverterRef.current.gain.value = phaseInverted ? -1 : 1;
  }, [leftVolume, rightVolume, masterVolume, phaseInverted]);

  const togglePlay = () => {
    initAudioGraph();
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }

    if (isPlaying) {
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (audioRef.current) audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleSeek = (time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="flex flex-col gap-6 w-full select-none font-mono text-xs"
    >
      <audio
        ref={audioRef}
        src={audioSrc}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={(e) => setDuration(e.target.duration || 20)}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Dual Channel Audio Console Header */}
      <div className="p-4 bg-black rounded-2xl border border-white/15 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Radio size={16} className="text-white animate-pulse" />
            <span className="font-bold text-white uppercase text-xs">DUAL-CHANNEL STEREO AUDIO CONSOLE</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="px-4 py-2 bg-white hover:bg-slate-200 text-black font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg"
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />} {isPlaying ? "Pause Stream" : "Play Stream"}
            </button>
          </div>
        </div>

        {/* Timeline Scrubber */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-slate-400 text-[10px]">
            <span>Audio Stream Timeline</span>
            <span>{currentTime.toFixed(2)}s / {duration.toFixed(1)}s (Carrier Tone active from 9.0s onwards)</span>
          </div>
          <input
            type="range"
            min="0"
            max={duration || 20}
            step="0.05"
            value={currentTime}
            onChange={(e) => handleSeek(Number(e.target.value))}
            className="w-full accent-white cursor-pointer"
          />
        </div>

        {/* Channel Volume Faders & Phase Inversion Switches */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-white/10">
          {/* Left Channel Fader */}
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex flex-col gap-1.5">
            <div className="flex justify-between text-slate-300 text-[10px]">
              <span>Channel 1 (Left)</span>
              <span className="text-white font-bold">{leftVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              value={leftVolume}
              onChange={(e) => setLeftVolume(Number(e.target.value))}
              className="w-full accent-white cursor-pointer"
            />
          </div>

          {/* Right Channel Fader */}
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex flex-col gap-1.5">
            <div className="flex justify-between text-slate-300 text-[10px]">
              <span>Channel 2 (Right)</span>
              <span className="text-white font-bold">{rightVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              value={rightVolume}
              onChange={(e) => setRightVolume(Number(e.target.value))}
              className="w-full accent-white cursor-pointer"
            />
          </div>

          {/* Master Volume Fader */}
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex flex-col gap-1.5">
            <div className="flex justify-between text-slate-300 text-[10px]">
              <span>Master Output</span>
              <span className="text-white font-bold">{masterVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              value={masterVolume}
              onChange={(e) => setMasterVolume(Number(e.target.value))}
              className="w-full accent-white cursor-pointer"
            />
          </div>
        </div>

        {/* Phase Inversion Trigger Action */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between">
          <button
            onClick={() => setPhaseInverted(!phaseInverted)}
            className={`py-3 px-6 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              phaseInverted
                ? "bg-white text-black border-white shadow-[0_0_25px_rgba(255,255,255,0.3)]"
                : "bg-black text-slate-300 border-white/20 hover:border-white/40"
            }`}
          >
            Right Channel 180° Phase Inverter: {phaseInverted ? "ACTIVE (L - R DIFFERENTIAL NULL)" : "OFF (0° NORMAL)"}
          </button>

          <span className="text-slate-400 text-[11px]">
            {phaseInverted ? "Common-mode noise cancelled. Listen for isolated transmission starting at 9.0s." : "Both channels in-phase (noise floor active)."}
          </span>
        </div>
      </div>
    </div>
  );
}
