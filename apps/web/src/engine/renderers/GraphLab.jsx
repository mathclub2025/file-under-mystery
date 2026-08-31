import React, { useState, useRef } from "react";
import { Pipette, Compass, ZoomIn, ZoomOut, RotateCcw, Scroll } from "lucide-react";
import { assetUrl } from "../../lib/assetHelper.js";

export default function GraphLab({ config }) {
  // 1 Central Anchor + 5 Campus Landmark Buildings with Real Color Names
  // Anchor: SlateGray -> #708090 -> RGB(112, 128, 144)
  // 1. Due North (AB3): CadetSlate -> #768392 -> RGB(118, 131, 146) -> Dist: 7 -> 'G'
  // 2. North-East (AB2): HeatherBlue -> #808892 -> RGB(128, 136, 146) -> Dist: 18 -> 'R'
  // 3. South-East (MGA): SlateTeal -> #708490 -> RGB(112, 132, 144) -> Dist: 4 -> '4'
  // 4. South-West (Gate): GraphiteSlate -> #808090 -> RGB(128, 128, 144) -> Dist: 16 -> 'P'
  // 5. North-West (AB1): CobaltDusk -> #708098 -> RGB(112, 128, 152) -> Dist: 8 -> 'H'
  const CAMPUS_BUILDINGS = [
    {
      id: "bldg-clocktower",
      name: "Central Admin Block (Clocktower)",
      colorName: "SlateGray",
      xPercent: 57,
      yPercent: 77,
      isOrigin: true,
      colorHex: "#708090"
    },
    {
      id: "bldg-ab3",
      name: "Academic Block 3 (North Square)",
      colorName: "CadetSlate",
      xPercent: 53,
      yPercent: 23,
      isOrigin: false,
      colorHex: "#768392"
    },
    {
      id: "bldg-ab2",
      name: "Academic Block 2 (East Wing)",
      colorName: "HeatherBlue",
      xPercent: 73,
      yPercent: 28,
      isOrigin: false,
      colorHex: "#808892"
    },
    {
      id: "bldg-mga",
      name: "Mahatma Gandhi Auditorium",
      colorName: "SlateTeal",
      xPercent: 72,
      yPercent: 86,
      isOrigin: false,
      colorHex: "#708490"
    },
    {
      id: "bldg-gate",
      name: "Main Entrance Gate Plaza",
      colorName: "GraphiteSlate",
      xPercent: 51,
      yPercent: 75,
      isOrigin: false,
      colorHex: "#808090"
    },
    {
      id: "bldg-ab1",
      name: "Academic Block 1 (West Complex)",
      colorName: "CobaltDusk",
      xPercent: 43,
      yPercent: 32,
      isOrigin: false,
      colorHex: "#708098"
    }
  ];

  // User input state for the Hex Color entry in each table row
  const [userHexInputs, setUserHexInputs] = useState({});

  // Active inspected building from map clicking
  const [inspectedLandmark, setInspectedLandmark] = useState(null);

  // Zoom & Pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Helper to parse hex string into RGB
  const parseHexToRGB = (hexStr) => {
    if (!hexStr) return null;
    const clean = hexStr.replace(/[^0-9A-Fa-f]/g, "");
    if (clean.length !== 6) return null;
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return { r, g, b };
  };

  const handleHexChange = (bldgId, val) => {
    setUserHexInputs((prev) => ({
      ...prev,
      [bldgId]: val
    }));
  };

  // Drag-to-pan handlers
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

  const handleZoom = (delta) => {
    setZoom((prev) => {
      const next = Math.max(1, Math.min(3, prev + delta));
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="flex flex-col gap-4 w-full font-mono text-xs select-none max-w-5xl mx-auto"
    >
      {/* Top Viewport: VIT Chennai Digital Map with Digital Color-Picker Pipette */}
      <div className="rounded-2xl overflow-hidden border border-white/15 p-4 flex flex-col items-center justify-center bg-black shadow-2xl relative w-full">
        {/* Header HUD */}
        <div className="text-slate-400 text-[11px] mb-2.5 flex items-center justify-between w-full">
          <span className="flex items-center gap-1.5 text-white font-bold">
            <Pipette size={14} className="text-white" />
            FORENSIC ARTIFACT #12 // DIGITAL CHROMATIC MAP SURVEY
          </span>
          <div className="flex items-center gap-2">
            <Compass size={13} className="text-slate-400" />
            <span className="text-slate-400 text-[10px]">CAMPUS SENSOR SURVEY</span>
          </div>
        </div>

        {/* Map Viewport Container */}
        <div
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="overflow-hidden rounded-xl border border-white/15 shadow-2xl bg-black relative w-full aspect-[16/10] max-h-[420px] flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
        >
          {/* Map Layer with Zoom & Pan */}
          <div
            className="w-full h-full relative transition-transform duration-75"
            style={{
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`
            }}
          >
            <img
              src={assetUrl("/evidence/vit_chennai_map.jpg")}
              alt="VIT Chennai Digital Map"
              className="w-full h-full object-cover select-none pointer-events-none"
            />

            {/* Subtle Compass Rose Overlay */}
            <div className="absolute top-4 left-4 p-2 rounded-xl bg-black/85 border border-white/20 flex items-center gap-2 z-20 pointer-events-none">
              <Compass size={16} className="text-white" />
              <div className="flex flex-col text-[9px] text-white font-mono leading-tight">
                <strong className="text-white font-bold">▲ NORTH</strong>
              </div>
            </div>

            {/* Sampled Color Name Readout in Top Right of Map when a building is clicked */}
            {inspectedLandmark && (
              <div className="absolute top-4 right-4 p-2.5 rounded-xl bg-black/90 border border-white/30 flex items-center gap-3 z-20 shadow-2xl animate-fade-in pointer-events-none">
                <div
                  className="w-6 h-6 rounded-full border-2 border-white shadow-[0_0_10px_rgba(255,255,255,0.5)] shrink-0"
                  style={{ backgroundColor: inspectedLandmark.colorHex }}
                />
                <div className="flex flex-col text-[10px] font-mono leading-tight">
                  <span className="text-slate-400 text-[9px] truncate max-w-[140px]">{inspectedLandmark.name}</span>
                  <span className="text-white font-bold tracking-wider">
                    SPECTRUM SIGNATURE: "{inspectedLandmark.colorName}"
                  </span>
                </div>
              </div>
            )}

            {/* Interactive Building Pipette Markers */}
            {CAMPUS_BUILDINGS.map((bldg) => {
              const isSelected = inspectedLandmark?.id === bldg.id;
              const isAnchor = bldg.isOrigin;

              return (
                <button
                  key={bldg.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setInspectedLandmark(bldg);
                  }}
                  style={{
                    left: `${bldg.xPercent}%`,
                    top: `${bldg.yPercent}%`
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 p-2 group cursor-pointer transition-all z-20 focus:outline-none`}
                  title={bldg.name}
                >
                  <div
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? "border-white shadow-[0_0_18px_rgba(255,255,255,0.9)] scale-115 ring-2 ring-white/60"
                        : "border-white/80 shadow-md hover:border-white hover:scale-105"
                    }`}
                    style={{
                      backgroundColor: bldg.colorHex
                    }}
                  >
                    {isAnchor ? (
                      <span className="font-bold text-[11px] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">⚓</span>
                    ) : (
                      <Pipette size={13} className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
                    )}
                  </div>

                  <div
                    className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-0.5 rounded bg-black/90 border border-white/20 text-[9px] text-white whitespace-nowrap pointer-events-none transition-opacity ${
                      isSelected ? "opacity-100 font-bold" : "opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    {bldg.name}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Map Controls */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/80 p-1.5 rounded-xl border border-white/15 z-30">
            <button
              onClick={() => handleZoom(-0.25)}
              className="p-1 text-slate-400 hover:text-white cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut size={13} />
            </button>
            <span className="text-[10px] text-white font-bold px-1">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => handleZoom(0.25)}
              className="p-1 text-slate-400 hover:text-white cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn size={13} />
            </button>
            <button
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              className="p-1 text-slate-400 hover:text-white cursor-pointer ml-1"
              title="Reset View"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Middle Viewport: Dr. Marrow's Indirect Cryptic Field Log */}
      <div className="p-4 bg-black rounded-2xl border border-white/15 shadow-2xl flex flex-col gap-2.5">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <span className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Scroll size={14} />
            <span>DR. MARROW'S FIELD TRANSMISSION // LOG #12</span>
          </span>
          <span className="text-slate-400 text-[10px]">CHROMATIC DISPERSION</span>
        </div>

        <p className="text-slate-300 text-xs leading-relaxed font-sans italic pt-1">
          "The foundation of the campus rests upon the central spire in the tone of SlateGray (#708090). Five architectural anchors echo this resonance into the perimeter grounds. Measure the magnitude of each anchor's chromatic divergence from the foundation, charting your path clockwise starting from the northern summit.
          <br /><br />
          The third step belongs to the machine, while the other four speak the language of letters."
        </p>
      </div>

      {/* Bottom Viewport: Raw Chromatic Sensor Readings with Clean Input Boxes */}
      <div className="p-4 bg-black rounded-2xl border border-white/15 shadow-2xl flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
          <span className="text-white font-bold text-xs uppercase tracking-wider">
            RAW CHROMATIC SENSOR READINGS
          </span>
          <span className="text-slate-400 text-[10px]">ENTER COLOR CODE TO DECOMPOSE RGB</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/10 bg-black">
          <table className="w-full text-left text-xs">
            <thead className="bg-black text-slate-400 uppercase tracking-wider border-b border-white/10">
              <tr>
                <th className="p-2.5">Campus Structure</th>
                <th className="p-2.5 text-center">Color Hex Code</th>
                <th className="p-2.5 text-center">Red (R)</th>
                <th className="p-2.5 text-center">Green (G)</th>
                <th className="p-2.5 text-center">Blue (B)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {CAMPUS_BUILDINGS.map((bldg) => {
                const isSelected = inspectedLandmark?.id === bldg.id;
                const userVal = userHexInputs[bldg.id] || "";
                const parsed = parseHexToRGB(userVal);

                return (
                  <tr
                    key={bldg.id}
                    onClick={() => setInspectedLandmark(bldg)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? "bg-white/15 text-white font-bold" : "hover:bg-white/5"
                    }`}
                  >
                    <td className="p-2.5 font-sans font-bold flex items-center gap-2">
                      <span>{bldg.name}</span>
                      {bldg.isOrigin && (
                        <span className="text-[10px] text-slate-400 font-mono">(Anchor)</span>
                      )}
                    </td>

                    {/* Color Input Textbox for Player to Enter Hex - Clean without spoiler placeholders */}
                    <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={userVal}
                        onChange={(e) => handleHexChange(bldg.id, e.target.value)}
                        placeholder="HEX CODE"
                        className="w-28 bg-black border border-white/20 focus:border-white rounded-lg px-2 py-1 text-center text-white font-mono font-bold text-xs uppercase focus:outline-none placeholder:text-slate-600"
                      />
                    </td>

                    {/* Decomposed RGB Output based on entered Hex */}
                    <td className="p-2.5 text-center font-mono font-bold text-rose-300">
                      {parsed ? parsed.r : "—"}
                    </td>
                    <td className="p-2.5 text-center font-mono font-bold text-emerald-300">
                      {parsed ? parsed.g : "—"}
                    </td>
                    <td className="p-2.5 text-center font-mono font-bold text-sky-300">
                      {parsed ? parsed.b : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
