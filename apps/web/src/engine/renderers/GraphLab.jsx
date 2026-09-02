import React, { useState, useRef, useEffect } from "react";
import { Compass, ZoomIn, ZoomOut, RotateCcw, Scroll, MapPin, CheckCircle2, ChevronDown, Sparkles } from "lucide-react";
import { assetUrl } from "../../lib/assetHelper.js";

export default function GraphLab({ config, onEvidenceReady }) {
  useEffect(() => {
    onEvidenceReady?.();
  }, [onEvidenceReady]);

  // Anchor & All Landmark Hotspots on VIT Chennai Map
  const ALL_CAMPUS_LOCATIONS = [
    {
      id: "loc-ground",
      name: "Central Sports Ground",
      shortName: "Central Ground (Anchor)",
      colorName: "SlateGray",
      colorHex: "#708090",
      xPercent: 60,
      yPercent: 55,
      isOrigin: true
    },
    {
      id: "loc-north-sq",
      name: "North Square",
      shortName: "North Square",
      colorName: "CadetSlate",
      colorHex: "#768392",
      xPercent: 53,
      yPercent: 23,
      isOrigin: false
    },
    {
      id: "loc-ab1",
      name: "Alpha Block (Academic Block 1)",
      shortName: "Alpha Block (AB1)",
      colorName: "HeatherBlue",
      colorHex: "#808892",
      xPercent: 43,
      yPercent: 32,
      isOrigin: false
    },
    {
      id: "loc-main-gate",
      name: "Main Entrance Gate Plaza",
      shortName: "Main Entrance Gate",
      colorName: "SlateTeal",
      colorHex: "#708490",
      xPercent: 51,
      yPercent: 88,
      isOrigin: false
    },
    {
      id: "loc-d2",
      name: "Delta-2 (D2) Residential Block",
      shortName: "D2 Residential Block",
      colorName: "GraphiteSlate",
      colorHex: "#808090",
      xPercent: 82,
      yPercent: 45,
      isOrigin: false
    },
    {
      id: "loc-ab3",
      name: "Academic Block 3",
      shortName: "Academic Block 3 (Terminal)",
      colorName: "CobaltDusk",
      colorHex: "#708098",
      xPercent: 56,
      yPercent: 38,
      isOrigin: false
    },
    {
      id: "loc-ab2",
      name: "Academic Block 2 (East Wing)",
      shortName: "Academic Block 2 (AB2)",
      colorName: "SteelIndigo",
      colorHex: "#788294",
      xPercent: 73,
      yPercent: 28,
      isOrigin: false
    },
    {
      id: "loc-d1",
      name: "Delta-1 (D1) Residential Block",
      shortName: "D1 Residential Block",
      colorName: "ObsidianMist",
      colorHex: "#847C88",
      xPercent: 82,
      yPercent: 35,
      isOrigin: false
    },
    {
      id: "loc-mga",
      name: "Mahatma Gandhi Auditorium",
      shortName: "MG Auditorium (MGA)",
      colorName: "DeepCyanDusk",
      colorHex: "#6C8696",
      xPercent: 72,
      yPercent: 86,
      isOrigin: false
    },
    {
      id: "loc-library",
      name: "Central Campus Library",
      shortName: "Central Library",
      colorName: "AshBlue",
      colorHex: "#727E8C",
      xPercent: 48,
      yPercent: 50,
      isOrigin: false
    },
    {
      id: "loc-food-court",
      name: "Campus Food Court",
      shortName: "Food Court / Cafeteria",
      colorName: "SageSlate",
      colorHex: "#7E8A90",
      xPercent: 68,
      yPercent: 48,
      isOrigin: false
    },
    {
      id: "loc-gazebo",
      name: "Central Gazebo Pavilions",
      shortName: "Gazebo Pavilions",
      colorName: "PineSmoke",
      colorHex: "#6E8292",
      xPercent: 38,
      yPercent: 65,
      isOrigin: false
    }
  ];

  // 5 Cryptic Sequence Targets
  const TARGET_STEPS = [
    {
      stepNum: 1,
      heading: "Target #1 (North Apex)",
      riddle: "The northern apex courtyard where the campus pathways converge beneath the open quad.",
      correctLocId: "loc-north-sq"
    },
    {
      stepNum: 2,
      heading: "Target #2 (West Wing)",
      riddle: "The western academic complex designated by the first letter of the Greek alphabet.",
      correctLocId: "loc-ab1"
    },
    {
      stepNum: 3,
      heading: "Target #3 (South Threshold)",
      riddle: "The grand southern threshold where every seeker first enters past the perimeter boundary.",
      correctLocId: "loc-main-gate"
    },
    {
      stepNum: 4,
      heading: "Target #4 (Eastern Redoubt)",
      riddle: "The eastern residential sector marked by the second bastion of the Delta wing.",
      correctLocId: "loc-d2"
    },
    {
      stepNum: 5,
      heading: "Target #5 (Present Location)",
      riddle: "The tertiary academic redoubt where your active investigation terminal is currently situated.",
      correctLocId: "loc-ab3"
    }
  ];

  // Player Form Selections: { [stepNum]: { selectedLocId, hexInput } }
  const [rowSelections, setRowSelections] = useState({
    1: { locId: "", hex: "" },
    2: { locId: "", hex: "" },
    3: { locId: "", hex: "" },
    4: { locId: "", hex: "" },
    5: { locId: "", hex: "" }
  });

  // Active sampled point from ink-pen pointer probe
  const [probedLocation, setProbedLocation] = useState(null);
  const [lastClickPos, setLastClickPos] = useState(null);

  // Zoom & Pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const mapContainerRef = useRef(null);

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

  // Map Click Handler: Finds nearest landmark to click position and samples its ink color!
  const handleMapClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    let normX, normY;
    if (zoom > 1) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const unzoomedX = (clickX - centerX - pan.x) / zoom + centerX;
      const unzoomedY = (clickY - centerY - pan.y) / zoom + centerY;
      normX = Math.max(0, Math.min(1, unzoomedX / rect.width));
      normY = Math.max(0, Math.min(1, unzoomedY / rect.height));
    } else {
      normX = Math.max(0, Math.min(1, clickX / rect.width));
      normY = Math.max(0, Math.min(1, clickY / rect.height));
    }

    const clickPctX = normX * 100;
    const clickPctY = normY * 100;

    setLastClickPos({ x: clickPctX, y: clickPctY });

    // Find closest landmark within radius threshold (12% map distance)
    let closest = null;
    let minDist = 14;

    ALL_CAMPUS_LOCATIONS.forEach((loc) => {
      const dx = loc.xPercent - clickPctX;
      const dy = loc.yPercent - clickPctY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        closest = loc;
      }
    });

    if (closest) {
      setProbedLocation(closest);
    } else {
      setProbedLocation({
        name: "Campus Quad Grounds",
        colorName: "NeutralAsphalt",
        colorHex: "#505860"
      });
    }
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

  const anchorLoc = ALL_CAMPUS_LOCATIONS.find((l) => l.isOrigin);

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
            SLATEGRAY (#708090)
          </span>
        </div>
      </div>

      {/* Viewport 1: VIT Chennai Map with Ink-Pen Pointer Dropper */}
      <div className="rounded-2xl overflow-hidden border border-white/15 p-4 flex flex-col items-center justify-center bg-black shadow-2xl relative w-full">
        <div className="text-slate-400 text-[11px] mb-2.5 flex items-center justify-between w-full">
          <span className="flex items-center gap-1.5 text-white font-bold">
            <Sparkles size={14} className="text-white" />
            <span>CAMPUS CHROMATIC SURVEY // INK-PEN PROBE</span>
          </span>
          <span className="text-slate-400 text-[10px]">CLICK ANY LOCATION TO SAMPLE INK COLOR</span>
        </div>

        {/* Map Viewport Container */}
        <div
          ref={mapContainerRef}
          onClick={handleMapClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="overflow-hidden rounded-xl border border-white/15 shadow-2xl bg-black relative w-full aspect-[16/10] max-h-[420px] flex items-center justify-center cursor-crosshair select-none"
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

            {/* ONLY Central Anchor Marker is Fixed on Map */}
            {anchorLoc && (
              <div
                style={{
                  left: `${anchorLoc.xPercent}%`,
                  top: `${anchorLoc.yPercent}%`
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
              >
                <div className="w-8 h-8 rounded-full border-2 border-white bg-[#708090] shadow-[0_0_15px_rgba(255,255,255,0.7)] flex items-center justify-center animate-pulse">
                  <span className="font-bold text-[12px] text-white">⚓</span>
                </div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-0.5 rounded bg-black/90 border border-white/20 text-[9px] text-white whitespace-nowrap font-bold">
                  ANCHOR: CENTRAL GROUND (#708090)
                </div>
              </div>
            )}

            {/* Last Probed Click Ripple Indicator */}
            {lastClickPos && (
              <div
                style={{
                  left: `${lastClickPos.x}%`,
                  top: `${lastClickPos.y}%`
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full border-2 border-white bg-white/20 animate-ping pointer-events-none z-30"
              />
            )}

            {/* Sampled Ink Readout HUD Overlay */}
            {probedLocation && (
              <div className="absolute top-4 right-4 p-2.5 rounded-xl bg-black/90 border border-white/30 flex items-center gap-3 z-30 shadow-2xl animate-fade-in pointer-events-none">
                <div
                  className="w-6 h-6 rounded-full border-2 border-white shadow-[0_0_12px_rgba(255,255,255,0.6)] shrink-0"
                  style={{ backgroundColor: probedLocation.colorHex }}
                />
                <div className="flex flex-col text-[10px] font-mono leading-tight">
                  <span className="text-slate-400 text-[9px]">{probedLocation.name}</span>
                  <span className="text-white font-bold tracking-wider">
                    SPECTRUM: "{probedLocation.colorName}" [{probedLocation.colorHex}]
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
      </div>

      {/* Viewport 2: Sequence Riddles & Dropdown Structure Selection Table */}
      <div className="p-4 bg-black rounded-2xl border border-white/15 shadow-2xl flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <span className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Scroll size={14} />
            <span>CAMPUS CHROMATIC SURVEY WORKBENCH // 5 TARGET SEQUENCE</span>
          </span>
          <span className="text-slate-400 text-[10px]">ANCHOR = SLATEGRAY #708090 (112, 128, 144)</span>
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
                          {ALL_CAMPUS_LOCATIONS.filter((l) => !l.isOrigin).map((loc) => (
                            <option key={loc.id} value={loc.id} className="bg-black text-white">
                              {loc.shortName}
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
