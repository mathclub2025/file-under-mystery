import React, { useRef, useState, useEffect } from "react";
import { Play, Pause, ChevronLeft, ChevronRight, RotateCcw, ZoomIn, ZoomOut, Terminal } from "lucide-react";
import { assetUrl } from "../../lib/assetHelper.js";

export default function VideoForensics({ config, onEvidenceReady }) {
  const videoRef = useRef(null);

  const FPS = 30;
  const [currentFrame, setCurrentFrame] = useState(1);
  const [totalFrames, setTotalFrames] = useState(240);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Zoom & Drag-to-Pan
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Forensic Filters
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [invert, setInvert] = useState(false);

  const videoSrc = assetUrl(config.evidenceData?.videoUrl || "/evidence/hallway.mp4");
  const OUTLIER_FRAME = 142; // Outlier anomaly occurs strictly on Frame 142
  
  // Base64 string for "Token: XT4Q1" -> VG9rZW46IFhUNFEx
  const RAW_PAYLOAD = "VG9rZW46IFhUNFEx";

  const handleTimeUpdate = () => {
    if (videoRef.current && isPlaying) {
      const frame = Math.max(1, Math.min(totalFrames, Math.floor(videoRef.current.currentTime * FPS) + 1));
      setCurrentFrame(frame);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration || 8.0;
      setTotalFrames(Math.max(1, Math.round(dur * FPS)));
      onEvidenceReady?.();
    }
  };

  useEffect(() => {
    const safety = setTimeout(() => {
      onEvidenceReady?.();
    }, 2000);
    return () => clearTimeout(safety);
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const seekToFrame = (frameNum) => {
    if (!videoRef.current) return;
    const clamped = Math.max(1, Math.min(totalFrames, frameNum));
    // Center of the target frame window: (frame - 0.5) / FPS
    const targetTime = Math.max(0, (clamped - 0.5) / FPS);
    videoRef.current.currentTime = targetTime;
    setCurrentFrame(clamped);
  };

  const stepFrame = (delta) => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
      const nextFrame = Math.max(1, Math.min(totalFrames, currentFrame + delta));
      seekToFrame(nextFrame);
    }
  };

  const handleSpeedChange = (spd) => {
    setPlaybackSpeed(spd);
    if (videoRef.current) {
      videoRef.current.playbackRate = spd;
    }
  };

  // Drag-to-Pan Handlers
  const handleMouseDown = (e) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoomLevel > 1) {
      setPan({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleZoomChange = (delta) => {
    setZoomLevel((prev) => {
      const next = Math.max(1, Math.min(3.5, prev + delta));
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  // Strictly on Frame 142 ONLY (1 single frame)
  const isAnomalyFrame = currentFrame === OUTLIER_FRAME;

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="flex flex-col gap-4 w-full select-none font-mono text-xs max-w-5xl mx-auto"
    >
      {/* Surveillance Video Viewport */}
      <div className="flex flex-col items-center justify-center relative w-full">
        <div
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="overflow-hidden rounded-2xl border border-white/15 shadow-2xl bg-black relative w-full max-h-[380px] aspect-[16/9] flex items-center justify-center select-none"
          style={{ cursor: zoomLevel > 1 ? (isDragging ? "grabbing" : "grab") : "default" }}
        >
          <div
            className="w-full h-full relative transition-transform duration-75"
            style={{
              transform: `scale(${zoomLevel}) translate(${pan.x / zoomLevel}px, ${pan.y / zoomLevel}px)`
            }}
          >
            <video
              ref={videoRef}
              src={videoSrc}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => setIsPlaying(false)}
              playsInline
              className="w-full h-full object-cover"
              style={{
                filter: `brightness(${brightness}%) contrast(${contrast}%) ${invert ? "invert(1)" : ""}`
              }}
            />

            {/* Anomaly: Submerged in Upper Corner Shadow (Frame 142 ONLY) - Merged with CCTV background */}
            {currentFrame === 142 && (!isPlaying || playbackSpeed < 1) && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div
                  className="absolute font-mono font-bold select-none text-zinc-300 mix-blend-overlay"
                  style={{
                    top: "13.5%",
                    left: "7.5%",
                    fontSize: "9.5px",
                    opacity: invert ? 0.65 : 0.50,
                    letterSpacing: "0.12em",
                    textShadow: invert
                      ? "0 0 2px rgba(0,0,0,0.8)"
                      : "0 0 2px rgba(255,255,255,0.3), 1px 1px 2px rgba(0,0,0,0.9)",
                    transform: "rotate(-2deg)",
                    filter: invert ? "invert(1)" : "none"
                  }}
                >
                  {RAW_PAYLOAD}
                </div>
              </div>
            )}
          </div>

          {/* Top-Right Zoom Magnifier Lens */}
          <div className="absolute top-3 right-4 flex items-center gap-1.5 bg-black/80 p-1 rounded-xl border border-white/15 z-20">
            <button
              onClick={() => handleZoomChange(-0.25)}
              className="p-1 text-slate-400 hover:text-white cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut size={13} />
            </button>
            <span className="text-[10px] text-white font-bold px-1">{Math.round(zoomLevel * 100)}%</span>
            <button
              onClick={() => handleZoomChange(0.25)}
              className="p-1 text-slate-400 hover:text-white cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Frame-by-Frame Controls & Forensic Filters Dock */}
      <div className="flex flex-col gap-3 w-full">
        {/* Row 1: Play, 1-Frame Stepper, Speed Multipliers & Timeline Slider */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center p-3.5 bg-black rounded-2xl border border-white/15">
          <div className="lg:col-span-7 flex flex-wrap items-center gap-2">
            <button
              onClick={togglePlay}
              className="px-4 py-2 bg-white hover:bg-slate-200 text-black font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg whitespace-nowrap"
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />} {isPlaying ? "Pause" : "Play"}
            </button>

            {/* Exact 1-Frame Steppers */}
            <button
              onClick={() => stepFrame(-1)}
              className="px-3 py-2 bg-black border border-white/15 rounded-xl hover:border-white text-slate-200 font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
              title="Previous Frame (1/30s)"
            >
              <ChevronLeft size={14} /> Step -1 Frame
            </button>

            <button
              onClick={() => stepFrame(1)}
              className="px-3 py-2 bg-black border border-white/15 rounded-xl hover:border-white text-slate-200 font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
              title="Next Frame (1/30s)"
            >
              Step +1 Frame <ChevronRight size={14} />
            </button>

            {/* Speed multipliers */}
            <div className="flex items-center gap-1 ml-1 bg-white/5 p-1 rounded-lg border border-white/10">
              {[0.25, 0.5, 1, 2].map((spd) => (
                <button
                  key={spd}
                  onClick={() => handleSpeedChange(spd)}
                  className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-all ${
                    playbackSpeed === spd ? "bg-white text-black shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          {/* Timeline Slider */}
          <div className="lg:col-span-5 flex flex-col gap-1">
            <div className="flex justify-between text-slate-400 text-[10px]">
              <span>Timeline Scrubber</span>
              <span className="text-white font-bold">Frame {currentFrame} / {totalFrames} ({(currentFrame / FPS).toFixed(2)}s)</span>
            </div>
            <input
              type="range"
              min="1"
              max={totalFrames}
              step="1"
              value={currentFrame}
              onChange={(e) => {
                videoRef.current?.pause();
                setIsPlaying(false);
                seekToFrame(Number(e.target.value));
              }}
              className="w-full accent-white cursor-pointer"
            />
          </div>
        </div>

        {/* Row 2: Video Forensic Filters (Brightness, Contrast, Invert) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-black rounded-2xl border border-white/15">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-slate-300 text-[11px]">
              <span>Brightness</span>
              <span className="text-white font-bold">{brightness}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="300"
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="w-full accent-white cursor-pointer"
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-slate-300 text-[11px]">
              <span>Contrast</span>
              <span className="text-white font-bold">{contrast}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="300"
              value={contrast}
              onChange={(e) => setContrast(Number(e.target.value))}
              className="w-full accent-white cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2 pt-2 sm:pt-0">
            <button
              onClick={() => setInvert(!invert)}
              className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all ${
                invert ? "bg-white text-black border-white" : "bg-black border-white/20 text-slate-300"
              }`}
            >
              Negative Invert: {invert ? "ON" : "OFF"}
            </button>

            <button
              onClick={() => {
                setBrightness(100);
                setContrast(100);
                setInvert(false);
                setZoomLevel(1);
                setPan({ x: 0, y: 0 });
              }}
              className="p-2 rounded-xl bg-black border border-white/15 text-slate-400 hover:text-white cursor-pointer"
              title="Reset Filters"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        {/* Storyline Observation Log Card */}
        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex flex-col gap-1 text-xs leading-relaxed text-slate-300 font-mono">
          <div className="flex items-center gap-1.5 font-bold text-white text-xs">
            <Terminal size={14} className="text-white" />
            <span>DISPATCH ARCHIVE (INCIDENT FILE 0418)</span>
          </div>
          <p className="text-slate-400 italic">
            "The optical sensors registered a brief harmonic disturbance across a fifty-frame interval as the fourth second turned to the fifth. An artifact was imprinted into the recording before the corridor lights stabilized."
          </p>
        </div>
      </div>
    </div>
  );
}
