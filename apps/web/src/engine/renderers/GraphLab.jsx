import React, { useState, useRef, useEffect } from "react";
import { Compass, ZoomIn, ZoomOut, RotateCcw, Scroll, MapPin, ChevronDown, Sparkles, Pipette } from "lucide-react";
import { assetUrl } from "../../lib/assetHelper.js";

export default function GraphLab({ config, onEvidenceReady }) {
  useEffect(() => {
    onEvidenceReady?.();
  }, [onEvidenceReady]);

  // Exact Pixel Percentage Positions for White Label Boxes on vit_chennai_map.jpg
  const MAP_LABEL_HOTSPOTS = [
    // --- CENTRAL ANCHOR ---
    {
      id: "loc-ground",
      name: "Ground",
      dropdownName: "Ground (Central Anchor)",
      colorName: "SlateGray",
      colorHex: "#708090",
      x: 50.8,
      y: 46.5,
      w: 60,
      h: 26,
      isAnchor: true
    },
    // --- 5 TARGET SEQUENCE SITES ---
    {
      id: "loc-north-sq",
      name: "North Square",
      dropdownName: "North Square",
      colorName: "CadetSlate",
      colorHex: "#768392",
      x: 47.0,
      y: 23.0,
      w: 75,
      h: 26,
      isAnchor: false
    },
    {
      id: "loc-ab1",
      name: "Academic Block 1",
      dropdownName: "Academic Block 1",
      colorName: "HeatherBlue",
      colorHex: "#808892",
      x: 42.0,
      y: 32.5,
      w: 85,
      h: 32,
      isAnchor: false
    },
    {
      id: "loc-main-gate",
      name: "Main Gate",
      dropdownName: "Main Gate (South Entrance)",
      colorName: "SlateTeal",
      colorHex: "#708490",
      x: 50.5,
      y: 79.5,
      w: 70,
      h: 26,
      isAnchor: false
    },
    {
      id: "loc-d2",
      name: "D2 Block Hostel",
      dropdownName: "D2 Block Hostel",
      colorName: "GraphiteSlate",
      colorHex: "#808090",
      x: 23.8,
      y: 40.0,
      w: 80,
      h: 30,
      isAnchor: false
    },
    {
      id: "loc-ab3",
      name: "Academic Block 3",
      dropdownName: "Academic Block 3 (Terminal)",
      colorName: "CobaltDusk",
      colorHex: "#708098",
      x: 53.4,
      y: 23.0,
      w: 85,
      h: 32,
      isAnchor: false
    },
    // --- OTHER CAMPUS STRUCTURES (DECOYS / FULL SURVEY) ---
    {
      id: "loc-alpha",
      name: "Alpha Block",
      dropdownName: "Alpha Block",
      colorName: "HeatherBlue",
      colorHex: "#808892",
      x: 79.8,
      y: 47.5,
      w: 75,
      h: 26,
      isAnchor: false
    },
    {
      id: "loc-ab2",
      name: "Academic Block 2",
      dropdownName: "Academic Block 2",
      colorName: "SteelIndigo",
      colorHex: "#788294",
      x: 73.6,
      y: 27.0,
      w: 85,
      h: 32,
      isAnchor: false
    },
    {
      id: "loc-ab4",
      name: "Academic Block 4",
      dropdownName: "Academic Block 4",
      colorName: "AshBlue",
      colorHex: "#727E8C",
      x: 62.6,
      y: 34.5,
      w: 85,
      h: 32,
      isAnchor: false
    },
    {
      id: "loc-ab5",
      name: "Academic Block 5",
      dropdownName: "Academic Block 5",
      colorName: "DeepCyanDusk",
      colorHex: "#6C8696",
      x: 74.6,
      y: 56.0,
      w: 85,
      h: 30,
      isAnchor: false
    },
    {
      id: "loc-d1",
      name: "D1 Block Hostel",
      dropdownName: "D1 Block Hostel",
      colorName: "ObsidianMist",
      colorHex: "#847C88",
      x: 28.2,
      y: 38.0,
      w: 80,
      h: 30,
      isAnchor: false
    },
    {
      id: "loc-mga",
      name: "Mahatma Gandhi Auditorium",
      dropdownName: "Mahatma Gandhi Auditorium (MGA)",
      colorName: "ZincBronze",
      colorHex: "#7A8288",
      x: 72.5,
      y: 83.0,
      w: 110,
      h: 34,
      isAnchor: false
    },
    {
      id: "loc-admin",
      name: "Admin Block",
      dropdownName: "Admin Block",
      colorName: "IronSmoke",
      colorHex: "#74868C",
      x: 57.2,
      y: 72.5,
      w: 75,
      h: 26,
      isAnchor: false
    },
    {
      id: "loc-cricket",
      name: "Cricket Ground",
      dropdownName: "Cricket Ground",
      colorName: "AmberDust",
      colorHex: "#827E86",
      x: 63.0,
      y: 47.5,
      w: 90,
      h: 26,
      isAnchor: false
    },
    {
      id: "loc-gazebo",
      name: "Gazebo",
      dropdownName: "Gazebo",
      colorName: "PineSmoke",
      colorHex: "#6E8292",
      x: 62.0,
      y: 57.0,
      w: 60,
      h: 24,
      isAnchor: false
    },
    {
      id: "loc-c-hostel",
      name: "C Block Hostel",
      dropdownName: "C Block Hostel",
      colorName: "ClaySlate",
      colorHex: "#7C808E",
      x: 85.2,
      y: 19.0,
      w: 80,
      h: 30,
      isAnchor: false
    },
    {
      id: "loc-b-hostel",
      name: "B Block Hostel",
      dropdownName: "B Block Hostel",
      colorName: "BasaltGray",
      colorHex: "#728488",
      x: 84.6,
      y: 35.5,
      w: 80,
      h: 30,
      isAnchor: false
    },
    {
      id: "loc-a-hostel",
      name: "A Block hostel",
      dropdownName: "A Block Hostel",
      colorName: "GabbroTeal",
      colorHex: "#76868E",
      x: 30.8,
      y: 24.0,
      w: 80,
      h: 30,
      isAnchor: false
    },
    {
      id: "loc-sigma",
      name: "Sigma Block",
      dropdownName: "Sigma Block",
      colorName: "PewterDusk",
      colorHex: "#7E828E",
      x: 40.8,
      y: 18.5,
      w: 70,
      h: 26,
      isAnchor: false
    },
    {
      id: "loc-tennis",
      name: "Tennis Court",
      dropdownName: "Tennis Court",
      colorName: "MossStone",
      colorHex: "#6E8890",
      x: 42.0,
      y: 46.0,
      w: 75,
      h: 26,
      isAnchor: false
    },
    {
      id: "loc-swimming",
      name: "Swimming Pool",
      dropdownName: "Swimming Pool",
      colorName: "AquamarineSlate",
      colorHex: "#688498",
      x: 80.2,
      y: 57.5,
      w: 85,
      h: 26,
      isAnchor: false
    },
    {
      id: "loc-guest-house",
      name: "Guest House",
      dropdownName: "Guest House",
      colorName: "ShaleBlue",
      colorHex: "#748096",
      x: 38.4,
      y: 56.0,
      w: 75,
      h: 26,
      isAnchor: false
    }
  ];

  // 5 Cryptic Sequence Targets
  const TARGET_STEPS = [
    {
      stepNum: 1,
      heading: "Target #1",
      riddle: "The northern apex courtyard where the campus pathways converge beneath the open quad.",
      correctLocId: "loc-north-sq"
    },
    {
      stepNum: 2,
      heading: "Target #2",
      riddle: "The western academic block designated as the first numbered building of the primary academic quad.",
      correctLocId: "loc-ab1"
    },
    {
      stepNum: 3,
      heading: "Target #3",
      riddle: "The grand southern threshold where every seeker first enters past the perimeter security boundary.",
      correctLocId: "loc-main-gate"
    },
    {
      stepNum: 4,
      heading: "Target #4",
      riddle: "The residential sector marked by the second block designation of the Delta hostel wing.",
      correctLocId: "loc-d2"
    },
    {
      stepNum: 5,
      heading: "Target #5",
      riddle: "Where the investigation takes place.",
      correctLocId: "loc-ab3"
    }
  ];

  // Player Form Selections: { [stepNum]: { locId, hex } }
  const [rowSelections, setRowSelections] = useState({
    1: { locId: "", hex: "" },
    2: { locId: "", hex: "" },
    3: { locId: "", hex: "" },
    4: { locId: "", hex: "" },
    5: { locId: "", hex: "" }
  });

  // Active sampled point from ink-pen pointer probe
  const [probedLocation, setProbedLocation] = useState(null);

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

  const handleSelectChange = (stepNum, locId) => {
    setRowSelections((prev) => ({
      ...prev,
      [stepNum]: { ...prev[stepNum], locId }
    }));
  };

  const handleHexInputChange = (stepNum, hex) => {
    setRowSelections((prev) => ({
      ...prev,
      [stepNum]: { ...prev[stepNum], hex }
    }));
  };

  // Click on a specific landmark white box
  const handleBoxClick = (loc, e) => {
    e.stopPropagation();
    setProbedLocation(loc);
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

  const anchorLoc = MAP_LABEL_HOTSPOTS.find((l) => l.isAnchor);

  // Custom Ink-Dropper SVG cursor for precision probing
  const inkCursor = "crosshair";

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="flex flex-col gap-4 w-full font-mono text-xs select-none max-w-5xl mx-auto"
    >
      {/* Top Header HUD: Topic Name for DOCS Lookup */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-2">
        <div className="flex items-center gap-2 text-white font-bold text-xs">
          <MapPin size={15} className="text-white" />
          <span>EUCLIDEAN COLOR VECTOR SPACE &amp; CHROMATIC DISPERSION</span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">ANCHOR:</span>
          <span className="px-2.5 py-0.5 rounded font-bold uppercase bg-white/10 text-white border border-white/15">
            GROUND ⚓ SLATEGRAY (#708090)
          </span>
        </div>
      </div>

      {/* Viewport 1: VIT Chennai Map with Precision Clickable White Boxes */}
      <div className="rounded-2xl overflow-hidden border border-white/15 p-4 flex flex-col items-center justify-center bg-black shadow-2xl relative w-full">
        <div className="text-slate-400 text-[11px] mb-2.5 flex items-center justify-between w-full">
          <span className="flex items-center gap-1.5 text-white font-bold">
            <Pipette size={14} className="text-white animate-pulse" />
            <span>CAMPUS CHROMATIC SURVEY // INK-PEN PROBE</span>
          </span>
          <span className="text-slate-400 text-[10px]">CLICK ON ANY PRINTED WHITE NAME BOX</span>
        </div>

        {/* Map Viewport Container */}
        <div
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: inkCursor }}
          className="overflow-hidden rounded-xl border border-white/15 shadow-2xl bg-black relative w-full aspect-[16/10] max-h-[460px] flex items-center justify-center select-none"
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

            {/* Compass Rose Overlay */}
            <div className="absolute top-4 left-4 p-2 rounded-xl bg-black/85 border border-white/20 flex items-center gap-2 z-20 pointer-events-none">
              <Compass size={16} className="text-white" />
              <strong className="text-white font-bold text-[9px] font-mono">▲ NORTH</strong>
            </div>

            {/* ONLY Anchor (Ground) has a Special Pulsing Badge */}
            {anchorLoc && (
              <div
                style={{
                  left: `${anchorLoc.x}%`,
                  top: `${anchorLoc.y}%`
                }}
                className="absolute -translate-x-1/2 -translate-y-full -mt-2.5 z-20 pointer-events-none"
              >
                <div className="px-2 py-0.5 rounded bg-black/90 border border-white/40 text-[9px] text-white whitespace-nowrap font-bold flex items-center gap-1 shadow-lg animate-pulse">
                  <span>⚓</span>
                  <span>ANCHOR: GROUND (#708090)</span>
                </div>
              </div>
            )}

            {/* Exact Clickable Hitbox Overlays for ALL White Label Boxes on Map */}
            {MAP_LABEL_HOTSPOTS.map((loc) => {
              const isSelected = probedLocation?.id === loc.id;

              return (
                <button
                  key={loc.id}
                  onClick={(e) => handleBoxClick(loc, e)}
                  style={{
                    left: `${loc.x}%`,
                    top: `${loc.y}%`,
                    width: `${loc.w}px`,
                    height: `${loc.h}px`
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 rounded cursor-pointer z-20 transition-all flex items-center justify-center group ${
                    isSelected
                      ? "ring-2 ring-white bg-white/40 shadow-[0_0_20px_rgba(255,255,255,0.9)] scale-110"
                      : "bg-transparent hover:bg-white/25 hover:ring-1 hover:ring-white/80"
                  }`}
                  title={`Click to sample ${loc.name} Ink Color`}
                >
                  {/* Subtle Pipette indicator on hover / selection */}
                  <Pipette
                    size={11}
                    className={`transition-opacity ${
                      isSelected ? "opacity-100 text-black drop-shadow" : "opacity-0 group-hover:opacity-100 text-white"
                    }`}
                  />
                </button>
              );
            })}

            {/* Sampled Ink Readout HUD Overlay in Top-Right of Map */}
            {probedLocation && (
              <div className="absolute top-4 right-4 p-3 rounded-xl bg-black/95 border border-white/40 flex items-center gap-3 z-30 shadow-2xl animate-fade-in pointer-events-none">
                <div
                  className="w-8 h-8 rounded-full border-2 border-white shadow-[0_0_15px_rgba(255,255,255,0.8)] shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: probedLocation.colorHex }}
                >
                  <Pipette size={12} className="text-white drop-shadow" />
                </div>
                <div className="flex flex-col text-[10px] font-mono leading-tight">
                  <span className="text-slate-400 text-[10px] font-sans font-bold">{probedLocation.name}</span>
                  <span className="text-white font-bold tracking-wider text-[11px]">
                    "{probedLocation.colorName}" &bull; {probedLocation.colorHex}
                  </span>
                  <span className="text-slate-400 text-[9px]">
                    RGB({parseHexToRGB(probedLocation.colorHex)?.r}, {parseHexToRGB(probedLocation.colorHex)?.g}, {parseHexToRGB(probedLocation.colorHex)?.b})
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Map Controls */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/80 p-1.5 rounded-xl border border-white/15 z-30">
            <button
              onClick={(e) => { e.stopPropagation(); handleZoom(-0.25); }}
              className="p-1 text-slate-400 hover:text-white cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut size={13} />
            </button>
            <span className="text-[10px] text-white font-bold px-1">{Math.round(zoom * 100)}%</span>
            <button
              onClick={(e) => { e.stopPropagation(); handleZoom(0.25); }}
              className="p-1 text-slate-400 hover:text-white cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn size={13} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
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

        {/* Bottom Banner of Map: Immediate Ink Readout */}
        <div className="w-full mt-2.5 p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-white" />
            <span className="text-slate-400 text-[11px]">ACTIVE INK PROBE:</span>
            {probedLocation ? (
              <span className="text-white font-bold text-[11px] flex items-center gap-1.5">
                <span
                  className="w-3.5 h-3.5 rounded-full inline-block border border-white"
                  style={{ backgroundColor: probedLocation.colorHex }}
                />
                <span>{probedLocation.name} ➔ {probedLocation.colorName} ({probedLocation.colorHex})</span>
              </span>
            ) : (
              <span className="text-slate-500 italic text-[11px]">Click any white name box on the map above to probe its ink signature</span>
            )}
          </div>

          {probedLocation && (
            <span className="text-slate-400 text-[10px] font-mono">
              Vector: [{parseHexToRGB(probedLocation.colorHex)?.r}, {parseHexToRGB(probedLocation.colorHex)?.g}, {parseHexToRGB(probedLocation.colorHex)?.b}]
            </span>
          )}
        </div>
      </div>

      {/* Viewport 2: Sequence Riddles & Dropdown Structure Selection Table */}
      <div className="p-4 bg-black rounded-2xl border border-white/15 shadow-2xl flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <span className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Scroll size={14} />
            <span>CAMPUS CHROMATIC SURVEY WORKBENCH // 5 TARGET SEQUENCE</span>
          </span>
          <span className="text-slate-400 text-[10px]">ANCHOR: GROUND #708090 (112, 128, 144)</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/10 bg-black">
          <table className="w-full text-left text-xs">
            <thead className="bg-black text-slate-400 uppercase tracking-wider border-b border-white/10 text-[10px]">
              <tr>
                <th className="p-2.5 w-1/3">Target &amp; Landmark Riddle</th>
                <th className="p-2.5">Campus Structure Selection</th>
                <th className="p-2.5 text-center">Sampled Hex</th>
                <th className="p-2.5 text-center">R</th>
                <th className="p-2.5 text-center">G</th>
                <th className="p-2.5 text-center">B</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {TARGET_STEPS.map((target) => {
                const sel = rowSelections[target.stepNum];
                const parsed = parseHexToRGB(sel.hex);

                return (
                  <tr key={target.stepNum} className="hover:bg-white/5 transition-colors">
                    {/* Target Name & Riddle */}
                    <td className="p-2.5 flex flex-col gap-0.5">
                      <span className="font-bold text-white text-[11px]">{target.heading}</span>
                      <p className="text-slate-400 text-[10px] italic font-sans leading-relaxed">
                        "{target.riddle}"
                      </p>
                    </td>

                    {/* Landmark Dropdown Selector */}
                    <td className="p-2.5">
                      <div className="relative">
                        <select
                          value={sel.locId}
                          onChange={(e) => handleSelectChange(target.stepNum, e.target.value)}
                          className="w-full bg-white/5 border border-white/20 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:border-white focus:outline-none appearance-none cursor-pointer pr-7"
                        >
                          <option value="" className="bg-black text-slate-500">-- Select Campus Location --</option>
                          {MAP_LABEL_HOTSPOTS.filter((l) => !l.isAnchor).map((loc) => (
                            <option key={loc.id} value={loc.id} className="bg-black text-white">
                              {loc.dropdownName}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </td>

                    {/* Hex Input Textbox */}
                    <td className="p-2.5 text-center">
                      <input
                        type="text"
                        value={sel.hex}
                        onChange={(e) => handleHexInputChange(target.stepNum, e.target.value)}
                        placeholder="e.g. #768392"
                        className="w-28 bg-black border border-white/20 focus:border-white rounded-lg px-2 py-1 text-center text-white font-mono font-bold text-xs uppercase focus:outline-none placeholder:text-slate-600"
                      />
                    </td>

                    {/* Decomposed RGB */}
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
