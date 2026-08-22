import React, { useRef, useState, useEffect } from "react";
import { ZoomIn, ZoomOut, Sliders, Layers, Search } from "lucide-react";

export default function StegoExtractor({ config }) {
  const canvasRef = useRef(null);

  // Multi-parameter Forensic Controls
  const [selectedChannel, setSelectedChannel] = useState("all"); // 'all' | 'red' | 'green' | 'blue'
  const [bitplane, setBitplane] = useState(0); // 0 to 7
  const [offsetX, setOffsetX] = useState(14); // Spatial phase alignment (-25 to +25)
  const [offsetY, setOffsetY] = useState(-9); // Spatial phase alignment (-25 to +25)
  const [clarity, setClarity] = useState(30); // Denoise & contrast clarification (0 to 100)

  // Zoom & Drag-to-Pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const imgSrc = config.evidenceData?.imageUrl || "/evidence/holiday.png";

  const SUBMERGED_MARKERS = {
    "red_0":   { tag: "1:M", baseX: 180, baseY: 140 },
    "green_1": { tag: "2:7", baseX: 480, baseY: 160 },
    "blue_0":  { tag: "3:7", baseX: 320, baseY: 340 },
    "blue_2":  { tag: "4:R", baseX: 220, baseY: 260 },
    "blue_3":  { tag: "5:B", baseX: 470, baseY: 380 }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = (canvas.width = 640);
    const h = (canvas.height = 440);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imgSrc;
    img.onload = () => {
      ctx.clearRect(0, 0, w, h);

      if (selectedChannel === "all") {
        // Natural full-color 35mm photo
        ctx.drawImage(img, 0, 0, w, h);
      } else {
        // Render base photo slice
        ctx.drawImage(img, 0, 0, w, h);
        const imgData = ctx.getImageData(0, 0, w, h);
        const d = imgData.data;

        const cOffset = selectedChannel === "red" ? 0 : selectedChannel === "green" ? 1 : 2;
        const mask = 1 << bitplane;

        // Phase offset delta distance from optimal resonance (0, 0)
        const dist = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
        const alignCoherence = Math.max(0, 1 - dist / 22);
        const effectiveClarity = (clarity / 100) * 0.5 + alignCoherence * 0.5;

        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4;
            const shiftedX = (x + offsetX + w) % w;
            const shiftedY = (y + offsetY + h) % h;
            const shiftedIdx = (shiftedY * w + shiftedX) * 4;

            const isBitHigh = (d[shiftedIdx + cOffset] & mask) !== 0;
            let val = isBitHigh ? 220 : 30;

            if (Math.random() > effectiveClarity * 0.85) {
              val = Math.random() > 0.5 ? 200 : 40;
            }

            d[idx] = val;
            d[idx + 1] = val;
            d[idx + 2] = val;
          }
        }
        ctx.putImageData(imgData, 0, 0);

        const key = `${selectedChannel}_${bitplane}`;
        const marker = SUBMERGED_MARKERS[key];

        if (marker && effectiveClarity > 0.40) {
          const renderAlpha = Math.min(0.85, (effectiveClarity - 0.40) * 1.6);
          const posX = marker.baseX + offsetX * 1.5;
          const posY = marker.baseY + offsetY * 1.5;

          ctx.save();
          ctx.font = "bold 20px 'JetBrains Mono', monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          ctx.fillStyle = `rgba(255, 255, 255, ${renderAlpha})`;
          ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
          ctx.shadowBlur = 4;
          ctx.fillText(marker.tag, posX, posY);
          ctx.restore();
        }
      }
    };
  }, [selectedChannel, bitplane, offsetX, offsetY, clarity, imgSrc]);

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
      className="flex flex-col gap-5 w-full select-none font-mono text-xs"
    >
      {/* Visual Slicer Canvas Viewport with Drag-to-Pan */}
      <div className="flex flex-col items-center justify-center relative w-full">
        <div
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="overflow-hidden rounded-2xl border border-white/15 shadow-2xl bg-black relative max-w-2xl w-full flex items-center justify-center select-none"
          style={{ cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default" }}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-auto object-contain transition-transform duration-75"
            style={{
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`
            }}
          />

          {/* Top-Right Zoom Controls (Zero Top-Left Search Badges) */}
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

      {/* Forensic Laboratory Tuning Controls Dock */}
      <div className="flex flex-col gap-4">
        {/* Row 1: Color Channel Selectors & Bitplane Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-slate-400 text-[10px] uppercase font-bold">1. Color Channel Slicer:</span>
            <div className="flex gap-2">
              {["all", "red", "green", "blue"].map((ch) => (
                <button
                  key={ch}
                  onClick={() => setSelectedChannel(ch)}
                  className={`flex-1 py-2 rounded-xl border text-xs font-bold uppercase transition-all cursor-pointer ${
                    selectedChannel === ch
                      ? "bg-white text-black border-white shadow-lg"
                      : "bg-black text-slate-400 border-white/10 hover:border-white/30"
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-slate-400 text-[10px] font-bold">
              <span>2. Bitplane Depth (0 = LSB, 7 = MSB)</span>
              <span className="text-white">Bit {bitplane}</span>
            </div>
            <input
              type="range"
              min="0"
              max="7"
              value={bitplane}
              onChange={(e) => setBitplane(Number(e.target.value))}
              disabled={selectedChannel === "all"}
              className="w-full accent-white cursor-pointer mt-2 disabled:opacity-30"
            />
          </div>
        </div>

        {/* Row 2: Spatial Phase Alignment & Clarification Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-black rounded-2xl border border-white/15">
          {/* X Spatial Offset */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-slate-300 text-[10px] font-bold">
              <span>X Phase Alignment</span>
              <span className="text-white">{offsetX} px</span>
            </div>
            <input
              type="range"
              min="-25"
              max="25"
              value={offsetX}
              onChange={(e) => setOffsetX(Number(e.target.value))}
              disabled={selectedChannel === "all"}
              className="w-full accent-white cursor-pointer disabled:opacity-30"
            />
          </div>

          {/* Y Spatial Offset */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-slate-300 text-[10px] font-bold">
              <span>Y Phase Alignment</span>
              <span className="text-white">{offsetY} px</span>
            </div>
            <input
              type="range"
              min="-25"
              max="25"
              value={offsetY}
              onChange={(e) => setOffsetY(Number(e.target.value))}
              disabled={selectedChannel === "all"}
              className="w-full accent-white cursor-pointer disabled:opacity-30"
            />
          </div>

          {/* Noise Clarification */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-slate-300 text-[10px] font-bold">
              <span>Noise Clarification</span>
              <span className="text-white">{clarity}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={clarity}
              onChange={(e) => setClarity(Number(e.target.value))}
              disabled={selectedChannel === "all"}
              className="w-full accent-white cursor-pointer disabled:opacity-30"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
