import React, { useState, useEffect, useRef } from "react";
import { Activity, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

export default function FourierLab({ config }) {
  const spectrumCanvasRef = useRef(null);
  const reconstructionCanvasRef = useRef(null);

  // 2D Frequency Domain Parameters
  const [radialMin, setRadialMin] = useState(10);
  const [radialMax, setRadialMax] = useState(115);
  const [phaseAngle, setPhaseAngle] = useState(0); // 0 to 180 degrees
  const [contrastGain, setContrastGain] = useState(50); // 20 to 100%

  // Zoom & Drag-to-Pan on Reconstructed Viewport
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // 5 Dispersed Harmonic Resonance Targets across K-Space:
  // 1:F, 2:I, 3:N, 4:4, 5:L
  const HARMONIC_TARGETS = [
    { tag: "1:F", targetRadius: 26, targetAngle: 30,  posX: 0.22, posY: 0.35 },
    { tag: "2:I", targetRadius: 48, targetAngle: 75,  posX: 0.36, posY: 0.65 },
    { tag: "3:N", targetRadius: 70, targetAngle: 120, posX: 0.50, posY: 0.40 },
    { tag: "4:4", targetRadius: 92, targetAngle: 45,  posX: 0.64, posY: 0.60 },
    { tag: "5:L", targetRadius: 110, targetAngle: 150, posX: 0.78, posY: 0.35 }
  ];

  // Draw 2D Fourier K-Space Spectrum with interactive Bandpass Ring Mask
  useEffect(() => {
    const canvas = spectrumCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const size = 260;
    canvas.width = size;
    canvas.height = size;
    const center = size / 2;

    ctx.fillStyle = "#030712";
    ctx.fillRect(0, 0, size, size);

    // Draw central DC peak
    const grad = ctx.createRadialGradient(center, center, 0, center, center, 120);
    grad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
    grad.addColorStop(0.2, "rgba(148, 163, 184, 0.3)");
    grad.addColorStop(0.4, "rgba(255, 255, 255, 0.4)");
    grad.addColorStop(0.6, "rgba(148, 163, 184, 0.3)");
    grad.addColorStop(0.8, "rgba(255, 255, 255, 0.35)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0.8)");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(center, center, 120, 0, Math.PI * 2);
    ctx.fill();

    // Draw dispersed harmonic specks on K-Space
    HARMONIC_TARGETS.forEach((t) => {
      const rNorm = (t.targetRadius / 128) * (size / 2);
      const aRad = (t.targetAngle * Math.PI) / 180;
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.beginPath();
      ctx.arc(center + Math.cos(aRad) * rNorm, center + Math.sin(aRad) * rNorm, 2.5, 0, Math.PI * 2);
      ctx.arc(center - Math.cos(aRad) * rNorm, center - Math.sin(aRad) * rNorm, 2.5, 0, Math.PI * 2);
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

    // Shaded Translucent Passband
    ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
    ctx.beginPath();
    ctx.arc(center, center, rMaxNorm, 0, Math.PI * 2);
    ctx.arc(center, center, rMinNorm, 0, Math.PI * 2, true);
    ctx.fill();

    // Phase orientation axis
    const radAngle = (phaseAngle * Math.PI) / 180;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.setLineDash([]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(center - Math.cos(radAngle) * rMaxNorm, center - Math.sin(radAngle) * rMaxNorm);
    ctx.lineTo(center + Math.cos(radAngle) * rMaxNorm, center + Math.sin(radAngle) * rMaxNorm);
    ctx.stroke();
    ctx.restore();
  }, [radialMin, radialMax, phaseAngle]);

  // Procedural 2D Inverse Fourier Transform Spatial Synthesis Canvas
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
    const gain = contrastGain / 100;

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

        let val = 128 + interference * 75 * gain;

        // Ripple dispersion
        val += (Math.random() - 0.5) * 25 * (1 - gain * 0.5);
        val = Math.max(0, Math.min(255, Math.round(val)));

        d[idx] = val;
        d[idx + 1] = val;
        d[idx + 2] = val;
        d[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // Check each dispersed harmonic tag individually
    HARMONIC_TARGETS.forEach((target) => {
      // Must fall within the active radial bandpass
      const inRadiusBand = radialMin <= target.targetRadius && target.targetRadius <= radialMax;
      const radiusDist = Math.abs(bandCenter - target.targetRadius);
      const angleDist = Math.min(
        Math.abs(phaseAngle - target.targetAngle),
        Math.abs(phaseAngle - (target.targetAngle + 180)),
        Math.abs(phaseAngle - (target.targetAngle - 180))
      );

      // Coherence is strong when band is focused around target radius and angle is aligned (within +/- 15 deg)
      if (inRadiusBand && radiusDist < 16 && angleDist < 18) {
        const coherence = Math.max(0, 1 - (radiusDist / 16) - (angleDist / 18) - (Math.max(0, bandWidth - 24) / 40));

        if (coherence > 0.35) {
          const alpha = Math.min(0.92, (coherence - 0.35) * 1.7) * gain;
          const posX = w * target.posX;
          const posY = h * target.posY;

          ctx.save();
          ctx.font = "bold 26px 'JetBrains Mono', monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
          ctx.shadowBlur = Math.max(2, (1 - coherence) * 8);
          ctx.fillText(target.tag, posX, posY);
          ctx.restore();
        }
      }
    });
  }, [radialMin, radialMax, phaseAngle, contrastGain]);

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
      className="flex flex-col gap-4 w-full font-mono text-xs select-none max-w-5xl mx-auto"
    >
      {/* Dual Fourier Viewports: 2D K-Space Spectrum + Spatial Reconstruction */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        {/* Viewport 1: 2D Fourier Spectrum (K-Space & Mask) */}
        <div className="bg-black p-4 rounded-2xl border border-white/15 shadow-2xl flex flex-col items-center justify-center relative min-h-[320px]">
          <div className="w-full flex justify-between items-center text-[10px] text-slate-400 uppercase tracking-wider mb-2">
            <span>2D K-Space Spectrum // Mask Overlay</span>
            <span className="text-white font-bold font-mono">r ∈ [{radialMin}, {radialMax}] px</span>
          </div>

          <div className="p-2 bg-black rounded-xl border border-white/10 flex items-center justify-center">
            <canvas ref={spectrumCanvasRef} className="rounded-lg max-w-full h-auto" />
          </div>
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
              setRadialMin(10);
              setRadialMax(115);
              setPhaseAngle(0);
              setContrastGain(50);
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
              min="20"
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
