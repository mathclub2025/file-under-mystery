import React, { useState, useEffect, useRef } from "react";
import { Activity, RotateCcw, ZoomIn, ZoomOut, Sparkles, Filter, Eye } from "lucide-react";

export default function FourierLab({ config, onEvidenceReady }) {
  useEffect(() => {
    onEvidenceReady?.();
  }, [onEvidenceReady]);

  const spectrumCanvasRef = useRef(null);
  const reconstructionCanvasRef = useRef(null);

  // 2D Frequency Domain Parameters
  const [radialMin, setRadialMin] = useState(0);
  const [radialMax, setRadialMax] = useState(128);
  const [phaseAngle, setPhaseAngle] = useState(0); // 0 to 180 degrees
  const [contrastGain, setContrastGain] = useState(30); // Starts at default 30%

  // Zoom & Drag-to-Pan on Reconstructed Viewport
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // 10 Twin Harmonic Specks on K-Space (5 Real Secret Glyphs for FIN4L + 5 Decoy Noise Artifacts)
  const ALL_SPECK_TARGETS = [
    // 5 Real Characters: FIN4L
    { id: 1, isReal: true, tag: "1:F", targetRadius: 26, targetAngle: 30,  posX: 0.20, posY: 0.35 },
    { id: 2, isReal: true, tag: "2:I", targetRadius: 48, targetAngle: 75,  posX: 0.35, posY: 0.65 },
    { id: 3, isReal: true, tag: "3:N", targetRadius: 70, targetAngle: 120, posX: 0.50, posY: 0.40 },
    { id: 4, isReal: true, tag: "4:4", targetRadius: 92, targetAngle: 45,  posX: 0.65, posY: 0.65 },
    { id: 5, isReal: true, tag: "5:L", targetRadius: 110, targetAngle: 150, posX: 0.80, posY: 0.35 },

    // 5 Decoy Specks (Noise & Null Artifacts)
    { id: 6, isReal: false, tag: "∅", targetRadius: 36, targetAngle: 140, posX: 0.25, posY: 0.70 },
    { id: 7, isReal: false, tag: "∅", targetRadius: 58, targetAngle: 20,  posX: 0.42, posY: 0.30 },
    { id: 8, isReal: false, tag: "∅", targetRadius: 82, targetAngle: 95,  posX: 0.58, posY: 0.70 },
    { id: 9, isReal: false, tag: "∅", targetRadius: 102, targetAngle: 60,  posX: 0.72, posY: 0.30 },
    { id: 10, isReal: false, tag: "∅", targetRadius: 118, targetAngle: 110, posX: 0.85, posY: 0.60 }
  ];

  // Draw 2D Fourier K-Space Spectrum with 10 Twin Points and Interactive Bandpass Mask
  useEffect(() => {
    const canvas = spectrumCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const size = 280;
    canvas.width = size;
    canvas.height = size;
    const center = size / 2;

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, size, size);

    // Draw central DC peak
    const grad = ctx.createRadialGradient(center, center, 0, center, center, 130);
    grad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
    grad.addColorStop(0.15, "rgba(148, 163, 184, 0.35)");
    grad.addColorStop(0.35, "rgba(255, 255, 255, 0.4)");
    grad.addColorStop(0.6, "rgba(148, 163, 184, 0.25)");
    grad.addColorStop(0.85, "rgba(255, 255, 255, 0.2)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0.9)");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(center, center, 130, 0, Math.PI * 2);
    ctx.fill();

    // Draw all 10 Twin Point Pairs on K-Space
    ALL_SPECK_TARGETS.forEach((t) => {
      const rNorm = (t.targetRadius / 128) * (size / 2);
      const aRad = (t.targetAngle * Math.PI) / 180;
      
      const inPassband = radialMin <= t.targetRadius && t.targetRadius <= radialMax;
      ctx.fillStyle = inPassband ? "#ffffff" : "rgba(255, 255, 255, 0.4)";

      ctx.beginPath();
      // Primary speck (+k)
      ctx.arc(center + Math.cos(aRad) * rNorm, center + Math.sin(aRad) * rNorm, 3, 0, Math.PI * 2);
      // Conjugate twin speck (-k)
      ctx.arc(center - Math.cos(aRad) * rNorm, center - Math.sin(aRad) * rNorm, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Active Radial Bandpass Ring Mask Overlay
    const rMinNorm = (radialMin / 128) * (size / 2);
    const rMaxNorm = (radialMax / 128) * (size / 2);

    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);

    ctx.beginPath();
    ctx.arc(center, center, rMinNorm, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(center, center, rMaxNorm, 0, Math.PI * 2);
    ctx.stroke();

    // Shaded Passband Region
    ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
    ctx.beginPath();
    ctx.arc(center, center, rMaxNorm, 0, Math.PI * 2);
    ctx.arc(center, center, rMinNorm, 0, Math.PI * 2, true);
    ctx.fill();

    // Angular Phase Orientation Axis
    const radAngle = (phaseAngle * Math.PI) / 180;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.setLineDash([]);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(center - Math.cos(radAngle) * rMaxNorm, center - Math.sin(radAngle) * rMaxNorm);
    ctx.lineTo(center + Math.cos(radAngle) * rMaxNorm, center + Math.sin(radAngle) * rMaxNorm);
    ctx.stroke();
    ctx.restore();
  }, [radialMin, radialMax, phaseAngle]);

  // Procedural 2D Inverse Fourier Transform Spatial Reconstruction Canvas
  useEffect(() => {
    const canvas = reconstructionCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = (canvas.width = 320);
    const h = (canvas.height = 320);

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, w, h);

    const bandCenter = (radialMin + radialMax) / 2;
    const bandWidth = Math.max(1, radialMax - radialMin);
    const gain = contrastGain / 100; // 0 when contrastGain is 0

    // If gain is 0, leave canvas totally dark/flat
    if (contrastGain <= 0) {
      return;
    }

    const imgData = ctx.createImageData(w, h);
    const d = imgData.data;

    const radAngle = (phaseAngle * Math.PI) / 180;
    const kx = Math.cos(radAngle) * (bandCenter / 14);
    const ky = Math.sin(radAngle) * (bandCenter / 14);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;

        const wave1 = Math.sin(x * 0.08 * kx + y * 0.08 * ky);
        const wave2 = Math.cos(x * 0.06 * ky - y * 0.06 * kx);
        const interference = (wave1 + wave2) * 0.5;

        let val = 128 + interference * 80 * gain;

        // Ripple dispersion noise
        val += (Math.random() - 0.5) * 30 * (1 - gain * 0.5);
        val = Math.max(0, Math.min(255, Math.round(val)));

        d[idx] = val;
        d[idx + 1] = val;
        d[idx + 2] = val;
        d[idx + 3] = Math.round(gain * 255);
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // Check each of the 10 harmonic specks
    ALL_SPECK_TARGETS.forEach((target) => {
      // Must fall within active radial bandpass
      const inRadiusBand = radialMin <= target.targetRadius && target.targetRadius <= radialMax;
      const radiusDist = Math.abs(bandCenter - target.targetRadius);
      const angleDist = Math.abs(phaseAngle - target.targetAngle);

      // Only reveal glyphs when Gain >= 60% and filter is centered on the speck
      if (contrastGain >= 60 && inRadiusBand && radiusDist <= 14 && angleDist <= 12) {
        const coherence = Math.max(0, 1 - (radiusDist / 14) - (angleDist / 12) - (Math.max(0, bandWidth - 24) / 35));
        const gainFactor = Math.max(0, (contrastGain - 60) / 40); // 0 at 60%, 1 at 100%

        if (coherence > 0.25 && gainFactor > 0.05) {
          const alpha = Math.min(0.95, coherence * gainFactor * 1.3);
          const posX = w * target.posX;
          const posY = h * target.posY;

          ctx.save();
          ctx.font = "bold 28px 'JetBrains Mono', monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          if (target.isReal) {
            // Real Secret Character Glyph
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
            ctx.shadowBlur = Math.max(2, (1 - coherence * gainFactor) * 8);
            ctx.fillText(target.tag, posX, posY);
          } else {
            // Decoy Speck: Null noise glyph
            ctx.fillStyle = `rgba(148, 163, 184, ${alpha * 0.6})`;
            ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
            ctx.shadowBlur = 6;
            ctx.fillText("∅ [NULL]", posX, posY);
          }
          ctx.restore();
        }
      }
    });
  }, [radialMin, radialMax, phaseAngle, contrastGain]);

  // Click on K-Space Canvas to inspect and snap filter to nearest speck
  const handleKSpaceClick = (e) => {
    const canvas = spectrumCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const center = canvas.width / 2;

    const dx = x - center;
    const dy = y - center;
    const clickRadius = (Math.sqrt(dx * dx + dy * dy) / (canvas.width / 2)) * 128;
    let clickAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
    if (clickAngle < 0) clickAngle += 180; // Map conjugate reflection into 0-180deg

    // Find nearest speck
    let nearest = null;
    let minDist = Infinity;
    ALL_SPECK_TARGETS.forEach((t) => {
      const dr = Math.abs(t.targetRadius - clickRadius);
      const da = Math.abs(t.targetAngle - clickAngle);
      const dist = dr + da * 0.8;
      if (dist < minDist) {
        minDist = dist;
        nearest = t;
      }
    });

    if (nearest && minDist < 35) {
      setRadialMin(Math.max(0, nearest.targetRadius - 10));
      setRadialMax(Math.min(128, nearest.targetRadius + 10));
      setPhaseAngle(nearest.targetAngle);
      setContrastGain(85);
    }
  };

  // Drag-to-Pan Handlers on Spatial Viewport
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
      className="flex flex-col gap-4 w-full font-mono text-xs select-none max-w-5xl mx-auto"
    >
      {/* Dual Fourier Viewports: 2D K-Space Spectrum + Spatial Reconstruction */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        {/* Viewport 1: 2D Fourier Spectrum */}
        <div className="bg-black p-4 rounded-2xl border border-white/15 shadow-2xl flex flex-col items-center justify-center relative min-h-[320px]">
          <div className="w-full flex justify-between items-center text-[10px] text-slate-400 uppercase tracking-wider mb-2">
            <span>2D K-Space Spectrum // Mask Overlay</span>
            <span className="text-white font-bold font-mono">r ∈ [{radialMin}, {radialMax}] px</span>
          </div>

          <div className="p-2 bg-black rounded-xl border border-white/10 flex items-center justify-center">
            <canvas
              ref={spectrumCanvasRef}
              onClick={handleKSpaceClick}
              className="rounded-lg max-w-full h-auto cursor-crosshair"
              title="Click any harmonic speck to tune bandpass mask directly"
            />
          </div>
          <span className="text-[9px] text-slate-500 mt-2">Click any speck on the spectrum to target the filter</span>
        </div>

        {/* Viewport 2: 2D Inverse FFT Spatial Reconstruction with Drag-to-Pan */}
        <div
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="bg-black p-4 rounded-2xl border border-white/15 shadow-2xl flex flex-col items-center justify-center relative min-h-[320px] overflow-hidden select-none"
          style={{ cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default" }}
        >
          <div className="w-full flex justify-between items-center text-[10px] text-slate-400 uppercase tracking-wider mb-2 z-10">
            <span>2D Inverse FFT Spatial Reconstruction</span>
            <span className="text-white font-bold font-mono">{Math.round(zoom * 100)}%</span>
          </div>

          <div className="p-2 bg-black rounded-xl border border-white/10 flex items-center justify-center overflow-hidden w-full h-full">
            <canvas
              ref={reconstructionCanvasRef}
              className="rounded-lg max-w-full h-auto transition-transform duration-75"
              style={{
                transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`
              }}
            />
          </div>

          {/* Top-Right Zoom Controls */}
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/80 p-1 rounded-xl border border-white/15 z-20">
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

      {/* 2D Fourier Radial Bandpass Filter & Harmonic Alignment Console */}
      <div className="p-4 bg-black rounded-2xl border border-white/15 flex flex-col gap-3 w-full">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
            <Activity size={14} className="text-white" />
            <span>2D RADIAL BANDPASS HARMONIC FILTER & PHASE ISOLATOR</span>
          </div>

          <button
            onClick={() => {
              setRadialMin(0);
              setRadialMax(128);
              setPhaseAngle(0);
              setContrastGain(30);
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className="text-slate-400 hover:text-white text-[10px] flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw size={11} /> Reset Filter
          </button>
        </div>

        {/* Sliders Grid: Radial Min, Radial Max, Phase Orientation & Contrast Gain */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Radial Min Radius */}
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex flex-col gap-1.5">
            <div className="flex justify-between text-slate-300 text-[10px]">
              <span className="font-bold">Radial Min (Inner):</span>
              <span className="text-white font-bold font-mono">{radialMin} px</span>
            </div>
            <input
              type="range"
              min="0"
              max="120"
              value={radialMin}
              onChange={(e) => setRadialMin(Math.min(Number(e.target.value), radialMax - 2))}
              className="w-full accent-white cursor-pointer"
            />
          </div>

          {/* Radial Max Radius */}
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex flex-col gap-1.5">
            <div className="flex justify-between text-slate-300 text-[10px]">
              <span className="font-bold">Radial Max (Outer):</span>
              <span className="text-white font-bold font-mono">{radialMax} px</span>
            </div>
            <input
              type="range"
              min="5"
              max="128"
              value={radialMax}
              onChange={(e) => setRadialMax(Math.max(Number(e.target.value), radialMin + 2))}
              className="w-full accent-white cursor-pointer"
            />
          </div>

          {/* Phase Angle */}
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex flex-col gap-1.5">
            <div className="flex justify-between text-slate-300 text-[10px]">
              <span className="font-bold">Angular Phase (θ):</span>
              <span className="text-white font-bold font-mono">{phaseAngle}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="180"
              step="5"
              value={phaseAngle}
              onChange={(e) => setPhaseAngle(Number(e.target.value))}
              className="w-full accent-white cursor-pointer"
            />
          </div>

          {/* Harmonic Contrast Gain */}
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex flex-col gap-1.5">
            <div className="flex justify-between text-slate-300 text-[10px]">
              <span className="font-bold">Harmonic Gain:</span>
              <span className="text-white font-bold font-mono">{contrastGain}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={contrastGain}
              onChange={(e) => setContrastGain(Number(e.target.value))}
              className="w-full accent-white cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
