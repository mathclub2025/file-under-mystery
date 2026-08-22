import React, { useRef, useState, useEffect } from "react";
import { Activity, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

export default function MatrixUnscrambler({ config }) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  // Smooth interpolated coherences for the 5 letters: [B, X, Z, 1, 9]
  const currentCoherences = useRef([0, 0, 0, 0, 0]);

  // 4 Interactive Oscilloscope Tuning Parameters
  const [harmonicChannel, setHarmonicChannel] = useState(1); // Carrier Channel (1 to 5)
  const [frequencyRatio, setFrequencyRatio] = useState(4);   // Modulation Ratio (1 to 10)
  const [phaseShift, setPhaseShift] = useState(0);           // Phase Angle (0° to 360°)
  const [dampingGain, setDampingGain] = useState(60);         // Wave Damping (20% to 100%)

  // Zoom & Drag-to-Pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // 5 Dispersed Resonances for each individual character:
  const LETTER_RESONANCES = [
    { char: "B", targetChannel: 1, targetRatio: 3,  targetPhase: 45,  centerX: 0.16 },
    { char: "X", targetChannel: 2, targetRatio: 6,  targetPhase: 120, centerX: 0.33 },
    { char: "Z", targetChannel: 3, targetRatio: 2,  targetPhase: 90,  centerX: 0.50 },
    { char: "1", targetChannel: 4, targetRatio: 8,  targetPhase: 180, centerX: 0.67 },
    { char: "9", targetChannel: 5, targetRatio: 5,  targetPhase: 270, centerX: 0.84 },
  ];

  // Normalized stroke segments for each letter
  const GLYPH_SEGMENTS = [
    // 0: 'B' (centerX ≈ 0.16, x: [0.10, 0.22], y: [0.22, 0.78])
    [
      [[0.12, 0.22], [0.12, 0.78]],
      [[0.12, 0.22], [0.18, 0.22]],
      [[0.18, 0.22], [0.21, 0.35]],
      [[0.21, 0.35], [0.18, 0.48]],
      [[0.18, 0.48], [0.12, 0.48]],
      [[0.18, 0.48], [0.22, 0.62]],
      [[0.22, 0.62], [0.18, 0.78]],
      [[0.18, 0.78], [0.12, 0.78]]
    ],
    // 1: 'X' (centerX ≈ 0.33, x: [0.26, 0.40], y: [0.22, 0.78])
    [
      [[0.27, 0.23], [0.39, 0.77]],
      [[0.39, 0.23], [0.27, 0.77]]
    ],
    // 2: 'Z' (centerX ≈ 0.50, x: [0.43, 0.57], y: [0.22, 0.78])
    [
      [[0.44, 0.23], [0.56, 0.23]],
      [[0.56, 0.23], [0.44, 0.77]],
      [[0.44, 0.77], [0.56, 0.77]]
    ],
    // 3: '1' (centerX ≈ 0.67, x: [0.62, 0.72], y: [0.22, 0.78])
    [
      [[0.63, 0.33], [0.67, 0.23]],
      [[0.67, 0.23], [0.67, 0.77]],
      [[0.62, 0.77], [0.72, 0.77]]
    ],
    // 4: '9' (centerX ≈ 0.84, x: [0.78, 0.90], y: [0.22, 0.78])
    [
      [[0.88, 0.48], [0.80, 0.48]],
      [[0.80, 0.48], [0.79, 0.35]],
      [[0.79, 0.35], [0.82, 0.23]],
      [[0.82, 0.23], [0.88, 0.23]],
      [[0.88, 0.23], [0.90, 0.48]],
      [[0.90, 0.48], [0.87, 0.77]],
      [[0.87, 0.77], [0.80, 0.77]]
    ]
  ];

  // Helper: Find closest point and distance from (px, py) to a line segment (a, b)
  const distToSegment = (px, py, [ax, ay], [bx, by]) => {
    const dx = bx - ax;
    const dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return { dist: Math.hypot(px - ax, py - ay), nx: ax, ny: ay };

    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
    const nx = ax + t * dx;
    const ny = ay + t * dy;
    return { dist: Math.hypot(px - nx, py - ny), nx, ny };
  };

  // Helper: Find closest point and distance to an entire character's glyph segments
  const distToGlyph = (px, py, segments) => {
    let minDist = Infinity;
    let nearestPoint = { nx: px, ny: py };

    for (let i = 0; i < segments.length; i++) {
      const res = distToSegment(px, py, segments[i][0], segments[i][1]);
      if (res.dist < minDist) {
        minDist = res.dist;
        nearestPoint = res;
      }
    }
    return { dist: minDist, nx: nearestPoint.nx, ny: nearestPoint.ny };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let time = 0;

    const render = () => {
      time += 0.022;
      const w = (canvas.width = 720);
      const h = (canvas.height = 400);

      // Deep dark CRT oscilloscope screen
      ctx.fillStyle = "#010409";
      ctx.fillRect(0, 0, w, h);

      // Phosphor grid lines
      ctx.strokeStyle = "rgba(15, 23, 42, 0.7)";
      ctx.lineWidth = 1;
      const grid = 40;
      for (let x = 0; x < w; x += grid) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += grid) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Smoothly interpolate target coherences for the 5 characters
      LETTER_RESONANCES.forEach((res, idx) => {
        const chanMatch = harmonicChannel === res.targetChannel ? 1 : 0;
        const ratioDist = Math.abs(frequencyRatio - res.targetRatio);
        const phaseDist = Math.min(
          Math.abs(phaseShift - res.targetPhase),
          Math.abs(phaseShift - (res.targetPhase + 360)),
          Math.abs(phaseShift - (res.targetPhase - 360))
        );

        let targetCoh = 0;
        if (chanMatch) {
          const rScore = Math.max(0, 1 - ratioDist / 2.2);
          const pScore = Math.max(0, 1 - phaseDist / 35.0);
          const gScore = dampingGain / 100;
          targetCoh = rScore * pScore * gScore;
        }

        // Smooth gradual relaxation (slowly slowly taking shape)
        currentCoherences.current[idx] += (targetCoh - currentCoherences.current[idx]) * 0.06;
      });

      // RENDER THE CONTINUOUS BACKGROUND WAVE MATRIX:
      // The background waves THEMSELVES bend and morph into the letter shapes!

      // 1. Horizontal Continuous Flowing Wave Strands (40 strands)
      const numHorizWaves = 38;
      for (let i = 0; i < numHorizWaves; i++) {
        const normBaseY = i / (numHorizWaves - 1);
        const baseY = normBaseY * h;
        const strandPhase = i * 0.35 + (phaseShift * Math.PI) / 180;
        const waveSpeed = (1.2 + (i % 3) * 0.25) * (i % 2 === 0 ? 1 : -1);
        const waveAmp = 6.0 + (i % 4) * 2.0;
        const waveFreq = 0.015 + (i % 3) * 0.003;

        ctx.beginPath();

        let maxPointCoherence = 0;

        for (let x = 0; x <= w; x += 3) {
          const normX = x / w;

          // Pure background sine position
          const baseSine = Math.sin(x * waveFreq + time * waveSpeed + strandPhase) * waveAmp;
          let ptY = baseY + baseSine;

          // Physical Deformation Field from all active letter coherences
          for (let c = 0; c < 5; c++) {
            const coh = currentCoherences.current[c];
            if (coh > 0.03) {
              // Check proximity of this wave point to character glyph segments
              const { dist, ny } = distToGlyph(normX, normBaseY, GLYPH_SEGMENTS[c]);
              
              // Smooth gaussian attraction field towards the glyph contours
              const sigma = 0.12; // Influence radius
              const attraction = Math.exp(-(dist * dist) / (2 * sigma * sigma));
              const pullWeight = coh * attraction * 0.92;

              if (pullWeight > 0.01) {
                const targetPixelY = ny * h;
                // Add traveling high-frequency ripple along the morphing wave
                const travelingRipple = Math.sin(normX * 45 + time * 4.0 + strandPhase) * (3.5 * coh);
                ptY = (1 - pullWeight) * ptY + pullWeight * (targetPixelY + travelingRipple);
                maxPointCoherence = Math.max(maxPointCoherence, pullWeight);
              }
            }
          }

          if (x === 0) ctx.moveTo(x, ptY);
          else ctx.lineTo(x, ptY);
        }

        // Dynamic electric glow: waves glow cyan/blue when deformed into glyphs
        const alpha = 0.18 + maxPointCoherence * 0.75;
        if (maxPointCoherence > 0.35) {
          ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
          ctx.lineWidth = 1.6;
          ctx.shadowColor = "#38bdf8";
          ctx.shadowBlur = Math.round(maxPointCoherence * 10);
        } else {
          ctx.strokeStyle = `rgba(30, 58, 138, ${alpha})`;
          ctx.lineWidth = 1.1;
          ctx.shadowBlur = 0;
        }

        ctx.stroke();
      }

      // 2. Vertical Continuous Flowing Wave Strands (48 strands)
      const numVertWaves = 46;
      for (let j = 0; j < numVertWaves; j++) {
        const normBaseX = j / (numVertWaves - 1);
        const baseX = normBaseX * w;
        const strandPhase = j * 0.30 - (phaseShift * Math.PI) / 240;
        const waveSpeed = 0.9 + (j % 3) * 0.3;
        const waveAmp = 5.0 + (j % 4) * 2.0;
        const waveFreq = 0.018 + (j % 3) * 0.004;

        ctx.beginPath();

        let maxPointCoherence = 0;

        for (let y = 0; y <= h; y += 3) {
          const normY = y / h;

          const baseSine = Math.cos(y * waveFreq - time * waveSpeed + strandPhase) * waveAmp;
          let ptX = baseX + baseSine;

          // Physical Deformation Field from all active letter coherences
          for (let c = 0; c < 5; c++) {
            const coh = currentCoherences.current[c];
            if (coh > 0.03) {
              const { dist, nx } = distToGlyph(normBaseX, normY, GLYPH_SEGMENTS[c]);
              const sigma = 0.10;
              const attraction = Math.exp(-(dist * dist) / (2 * sigma * sigma));
              const pullWeight = coh * attraction * 0.92;

              if (pullWeight > 0.01) {
                const targetPixelX = nx * w;
                const travelingRipple = Math.sin(normY * 45 - time * 4.0 + strandPhase) * (3.5 * coh);
                ptX = (1 - pullWeight) * ptX + pullWeight * (targetPixelX + travelingRipple);
                maxPointCoherence = Math.max(maxPointCoherence, pullWeight);
              }
            }
          }

          if (y === 0) ctx.moveTo(ptX, y);
          else ctx.lineTo(ptX, y);
        }

        const alpha = 0.15 + maxPointCoherence * 0.75;
        if (maxPointCoherence > 0.35) {
          ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
          ctx.lineWidth = 1.6;
          ctx.shadowColor = "#38bdf8";
          ctx.shadowBlur = Math.round(maxPointCoherence * 10);
        } else {
          ctx.strokeStyle = `rgba(14, 116, 144, ${alpha})`;
          ctx.lineWidth = 1.0;
          ctx.shadowBlur = 0;
        }

        ctx.stroke();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [harmonicChannel, frequencyRatio, phaseShift, dampingGain]);

  // Drag-to-Pan Handlers
  const handleMouseDown = (e) => {
    if (zoom > 1) {
      setIsDragging(true);
      dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoom > 1) {
      setPan({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleZoomChange = (delta) => {
    setZoom((prev) => {
      const next = Math.max(1, Math.min(3.5, prev + delta));
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="flex flex-col gap-4 w-full select-none font-mono text-xs max-w-5xl mx-auto"
    >
      {/* Continuous Deforming Wave Field Viewport with Drag-to-Pan */}
      <div className="flex flex-col items-center justify-center relative w-full">
        <div
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="overflow-hidden rounded-2xl border border-white/15 shadow-2xl bg-black relative w-full aspect-[16/9] max-h-[380px] flex items-center justify-center select-none"
          style={{ cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default" }}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain transition-transform duration-75"
            style={{
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`
            }}
          />

          {/* Top-Right Zoom Magnifier Lens */}
          <div className="absolute top-3 right-4 flex items-center gap-1.5 bg-black/80 p-1 rounded-xl border border-white/15 z-20">
            <button
              onClick={() => handleZoomChange(-0.25)}
              className="p-1 text-slate-400 hover:text-white cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut size={13} />
            </button>
            <span className="text-[10px] text-white font-bold px-1">{Math.round(zoom * 100)}%</span>
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

      {/* 4-Parameter Harmonic Resonance & Carrier Console */}
      <div className="p-4 bg-black rounded-2xl border border-white/15 flex flex-col gap-3 w-full">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
            <Activity size={14} className="text-white animate-pulse" />
            <span>SINUSOIDAL WAVE SUPERPOSITION & HARMONIC RESONANCE CONSOLE</span>
          </div>

          <button
            onClick={() => {
              setHarmonicChannel(1);
              setFrequencyRatio(4);
              setPhaseShift(0);
              setDampingGain(60);
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className="text-slate-400 hover:text-white text-[10px] flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw size={11} /> Reset Harmonics
          </button>
        </div>

        {/* 4 Controls: Harmonic Channel (1 to 5), Frequency Ratio, Phase Angle, Damping Gain */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Harmonic Carrier Mode (1 to 5) */}
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex flex-col gap-1.5">
            <div className="flex justify-between text-slate-300 text-[10px]">
              <span className="font-bold">Carrier Channel:</span>
              <span className="text-white font-bold font-mono">CH-0{harmonicChannel}</span>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((ch) => (
                <button
                  key={ch}
                  onClick={() => setHarmonicChannel(ch)}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    harmonicChannel === ch
                      ? "bg-white text-black shadow"
                      : "bg-black border border-white/10 text-slate-400 hover:text-white"
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>

          {/* Modulation Ratio (f_m) */}
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex flex-col gap-1.5">
            <div className="flex justify-between text-slate-300 text-[10px]">
              <span className="font-bold">Modulation Ratio (f_m):</span>
              <span className="text-white font-bold font-mono">{frequencyRatio}x</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={frequencyRatio}
              onChange={(e) => setFrequencyRatio(Number(e.target.value))}
              className="w-full accent-white cursor-pointer"
            />
          </div>

          {/* Superposition Phase Angle */}
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex flex-col gap-1.5">
            <div className="flex justify-between text-slate-300 text-[10px]">
              <span className="font-bold">Interference Phase (ϕ):</span>
              <span className="text-white font-bold font-mono">{phaseShift}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              step="15"
              value={phaseShift}
              onChange={(e) => setPhaseShift(Number(e.target.value))}
              className="w-full accent-white cursor-pointer"
            />
          </div>

          {/* Resonance Q Gain */}
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex flex-col gap-1.5">
            <div className="flex justify-between text-slate-300 text-[10px]">
              <span className="font-bold">Resonance Q Gain:</span>
              <span className="text-white font-bold font-mono">{dampingGain}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              step="5"
              value={dampingGain}
              onChange={(e) => setDampingGain(Number(e.target.value))}
              className="w-full accent-white cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
