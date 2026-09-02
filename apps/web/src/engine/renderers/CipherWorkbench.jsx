import React, { useState, useRef, useEffect } from "react";
import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { assetUrl } from "../../lib/assetHelper.js";

export default function CipherWorkbench({ config, onEvidenceReady }) {
  useEffect(() => {
    onEvidenceReady?.();
  }, [onEvidenceReady]);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // 12-character periodic cipher stream (matching parchment: ETLVGTUJTATE)
  const cipherText = "ETLVGTUJTATE";

  // 4 Interactive Running Key Shift Dials (0 to 25)
  const [dial1, setDial1] = useState(0);
  const [dial2, setDial2] = useState(0);
  const [dial3, setDial3] = useState(0);
  const [dial4, setDial4] = useState(0);

  const dials = [dial1, dial2, dial3, dial4];

  // Decode character given shift
  const decodeChar = (char, shift) => {
    const code = char.charCodeAt(0) - 65;
    const plainCode = (code - shift + 26) % 26;
    return String.fromCharCode(65 + plainCode);
  };

  // Drag to Pan Handlers
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
      {/* Evidence Canvas with Interactive Drag-to-Pan when Zoomed */}
      <div className="flex flex-col items-center justify-center relative w-full">
        <div
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="overflow-hidden rounded-2xl border border-white/15 shadow-2xl bg-black relative max-w-2xl w-full flex items-center justify-center select-none"
          style={{ cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default" }}
        >
          <img
            src={assetUrl("/evidence/shredded_notes.png")}
            alt="Shredded Manuscript Evidence"
            draggable={false}
            className="w-full h-auto object-contain pointer-events-none transition-transform duration-75"
            style={{
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`
            }}
          />

          {/* Maths Club Watermark Overlay to cover bottom-right mark */}
          <div
            className="absolute z-10 pointer-events-none select-none transition-transform duration-75"
            style={{
              bottom: "0.85rem",
              right: "1.05rem",
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`
            }}
          >
            <img
              src={assetUrl("/maths_club_logo.png")}
              alt="Maths Club VIT"
              className="w-6 h-6 sm:w-7 sm:h-7 object-contain drop-shadow-[0_0_15px_rgba(0,0,0,0.98)] filter brightness-95"
            />
          </div>

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

      {/* 4-Dial Running Key Shift Console */}
      <div className="flex flex-col gap-4">
        <div className="p-4 bg-black rounded-2xl border border-white/15 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-white font-bold text-xs uppercase tracking-wider">
              RUNNING KEY MODULAR SHIFT DIALS (4-POSITION PERIODIC STREAM)
            </span>
            <button
              onClick={() => { setDial1(0); setDial2(0); setDial3(0); setDial4(0); }}
              className="text-slate-400 hover:text-white flex items-center gap-1 text-[10px] cursor-pointer"
            >
              <RotateCcw size={12} /> Reset Dials
            </button>
          </div>

          {/* 4 Shift Dials */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Position 1 Dial", val: dial1, setVal: setDial1 },
              { label: "Position 2 Dial", val: dial2, setVal: setDial2 },
              { label: "Position 3 Dial", val: dial3, setVal: setDial3 },
              { label: "Position 4 Dial", val: dial4, setVal: setDial4 }
            ].map((d, dIdx) => (
              <div key={dIdx} className="p-3 bg-white/5 rounded-xl border border-white/10 flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-slate-300 text-[10px]">
                  <span className="font-bold">{d.label}</span>
                  <span className="text-white font-black text-xs px-2 py-0.5 rounded bg-white/10 border border-white/20 font-mono">
                    {String.fromCharCode(65 + d.val)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25"
                  value={d.val}
                  onChange={(e) => d.setVal(Number(e.target.value))}
                  className="w-full accent-white cursor-pointer"
                />
              </div>
            ))}
          </div>

          {/* PURE LETTER-BY-LETTER DECRYPTION GRID (NO TEXT SPOILERS BELOW) */}
          <div className="p-4 bg-white/5 rounded-xl border border-white/15 flex flex-col gap-3">
            <div className="text-[10px] text-slate-400 uppercase tracking-widest">
              PERIODIC STREAM GRID (12 CHARACTERS // ROTATED BY SHIFT DIALS):
            </div>

            <div className="grid grid-cols-6 sm:grid-cols-12 gap-1 text-center font-mono">
              {cipherText.split("").map((c, i) => {
                const shift = dials[i % 4];
                const decryptedChar = decodeChar(c, shift);
                return (
                  <div key={i} className="flex flex-col gap-0.5 p-2 bg-black rounded-lg border border-white/10">
                    <span className="text-[9px] text-slate-500">{c}</span>
                    <span className="text-[8px] text-zinc-500">[{String.fromCharCode(65 + shift)}]</span>
                    <span className="font-bold text-sm text-white">
                      {decryptedChar}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
