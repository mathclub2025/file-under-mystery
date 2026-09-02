import React, { useState, useEffect, useRef } from "react";
import { Telescope, Compass, Crosshair, ZoomIn, ZoomOut, RotateCcw, CheckCircle2 } from "lucide-react";

export default function EllipticLab({ config, onEvidenceReady }) {
  useEffect(() => {
    onEvidenceReady?.();
  }, [onEvidenceReady]);

  const radarCanvasRef = useRef(null);

  // 5 Celestial Sectors with Dr. Marrow's Narrative Astrometric Riddles
  const SECTOR_CLUES = [
    {
      sector: 1,
      name: "Alpha Relay",
      riddle: "I first mapped the winter sky upon reaching the quarter-century mark of my life's journey. At a declination equal to seven times the days in a standard work week, the first transmitter listens in the cold.",
      targetX: 25,
      targetY: 35
    },
    {
      sector: 2,
      name: "Cygnus Nebula",
      riddle: "Meet me at the exact midpoint between the old observatory at coordinate twenty and the perimeter tower at fifty. Along the vertical meridian, locate the true center between thirty and fifty.",
      targetX: 35,
      targetY: 40
    },
    {
      sector: 3,
      name: "Orion Core",
      riddle: "Standard human body temperature in degrees Celsius marks my horizontal transit. For my vertical altitude, look precisely one step before reaching four-score—where the last prime before eighty rests.",
      targetX: 37,
      targetY: 79
    },
    {
      sector: 4,
      name: "Pegasus Cluster",
      riddle: "Look to the atomic number of Lead on the periodic table for the celestial horizon. Then cool two degrees down from the forty-degree fever mark to set the telescope declination.",
      targetX: 82,
      targetY: 38
    },
    {
      sector: 5,
      name: "Horizon Array",
      riddle: "Follow Jules Verne's journey around the world in days to find the eastern axis. Three-quarters of a hundred percent along the northern sky reveals the final beacon before midnight.",
      targetX: 80,
      targetY: 75
    }
  ];

  // Active Selected Sector Clue
  const [selectedSector, setSelectedSector] = useState(SECTOR_CLUES[0]);

  // Coordinate Reticle Finder Inputs
  const [finderX, setFinderX] = useState("");
  const [finderY, setFinderY] = useState("");
  const [aimCoord, setAimCoord] = useState({ x: 50, y: 50 });

  // Locked Beacon Coordinates (Stores { 1: {x: 25, y: 35}, ... })
  const [lockedBeacons, setLockedBeacons] = useState({});

  // Zoom & Pan on Starfield Radar
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const handleAimAtCoord = (x, y) => {
    const numX = Number(x);
    const numY = Number(y);
    setAimCoord({ x: numX, y: numY });

    // Check if aim matches any sector target
    const matched = SECTOR_CLUES.find((s) => s.targetX === numX && s.targetY === numY);
    if (matched) {
      setLockedBeacons((prev) => ({
        ...prev,
        [matched.sector]: { x: matched.targetX, y: matched.targetY, name: matched.name }
      }));
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const numX = parseInt(finderX, 10);
    const numY = parseInt(finderY, 10);
    if (!isNaN(numX) && !isNaN(numY)) {
      handleAimAtCoord(numX, numY);
    }
  };

  // Draw Celestial Astrometry Radar Scope
  useEffect(() => {
    const canvas = radarCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = (canvas.width = 720);
    const h = (canvas.height = 360);

    // Deep black cosmic void
    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, w, h);

    // Astrometric coordinate grid
    ctx.strokeStyle = "rgba(30, 41, 59, 0.5)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Background starfield
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    for (let i = 0; i < 90; i++) {
      const sx = (i * 73 + 19) % w;
      const sy = (i * 47 + 31) % h;
      const sr = i % 3 === 0 ? 1.5 : 1;
      ctx.fillRect(sx, sy, sr, sr);
    }

    // Draw discovered / locked stellar beacons
    SECTOR_CLUES.forEach((s) => {
      const isLocked = !!lockedBeacons[s.sector];
      const px = (s.targetX / 100) * w;
      const py = (1 - s.targetY / 100) * h;

      if (isLocked) {
        ctx.save();
        ctx.fillStyle = "#FFFFFF";
        ctx.shadowColor = "#FFFFFF";
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(px, py, 4.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = "bold 10px 'JetBrains Mono', monospace";
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(`SECTOR #${s.sector} [${s.targetX}, ${s.targetY}]`, px + 8, py - 6);
        ctx.restore();
      }
    });

    // Draw Active Telescope Crosshairs
    const clampedAimX = Math.max(0, Math.min(100, aimCoord.x));
    const clampedAimY = Math.max(0, Math.min(100, aimCoord.y));
    const rx = (clampedAimX / 100) * w;
    const ry = (1 - clampedAimY / 100) * h;

    const activeMatched = SECTOR_CLUES.find((s) => s.targetX === aimCoord.x && s.targetY === aimCoord.y);

    ctx.save();
    ctx.strokeStyle = activeMatched ? "#FFFFFF" : "rgba(255, 255, 255, 0.6)";
    ctx.lineWidth = 1.4;

    // Reticle rings
    ctx.beginPath();
    ctx.arc(rx, ry, 22, 0, Math.PI * 2);
    ctx.stroke();

    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(rx - 28, ry);
    ctx.lineTo(rx + 28, ry);
    ctx.moveTo(rx, ry - 28);
    ctx.lineTo(rx, ry + 28);
    ctx.stroke();

    if (activeMatched) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(rx - 65, ry + 30, 130, 28, 6);
      ctx.fill();
      ctx.stroke();

      ctx.font = "bold 10px 'JetBrains Mono', monospace";
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`BEACON #${activeMatched.sector} LOCKED (${activeMatched.targetX}, ${activeMatched.targetY})`, rx, ry + 44);
    } else {
      ctx.font = "10px 'JetBrains Mono', monospace";
      ctx.fillStyle = "#94A3B8";
      ctx.textAlign = "center";
      ctx.fillText(`[ AIM: (${aimCoord.x}, ${aimCoord.y}) ]`, rx, ry + 36);
    }

    ctx.restore();
  }, [aimCoord, lockedBeacons]);

  const hasMovedRef = useRef(false);

  // Click on Starfield Canvas to aim directly
  const handleCanvasClick = (e) => {
    if (hasMovedRef.current) return;
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

    const coordX = Math.round(normX * 100);
    const coordY = Math.round((1 - normY) * 100);

    const clampedX = Math.max(0, Math.min(100, coordX));
    const clampedY = Math.max(0, Math.min(100, coordY));

    setFinderX(clampedX);
    setFinderY(clampedY);
    handleAimAtCoord(clampedX, clampedY);
  };

  const handleMouseDown = (e) => {
    hasMovedRef.current = false;
    if (zoom > 1) {
      setIsDragging(true);
      dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoom > 1) {
      hasMovedRef.current = true;
      setPan({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomChange = (delta) => {
    setZoom((prev) => {
      const next = Math.max(1, Math.min(3.5, prev + delta));
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const lockedCount = Object.keys(lockedBeacons).length;

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="flex flex-col gap-4 w-full select-none font-mono text-xs max-w-5xl mx-auto"
    >
      {/* Top HUD Header: Topic Name for DOCS Lookup */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-2">
        <div className="flex items-center gap-2 text-white font-bold text-xs">
          <Telescope size={15} className="text-white" />
          <span>CELESTIAL ASTROMETRY &amp; PARALLAX MODULAR TRANSFORMATION</span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">BEACONS:</span>
          <span className={`px-2.5 py-0.5 rounded font-bold uppercase ${
            lockedCount === 5
              ? "bg-white text-black font-extrabold shadow"
              : "bg-white/10 text-slate-200 border border-white/10"
          }`}>
            {lockedCount} / 5 LOCKED
          </span>
        </div>
      </div>

      {/* Viewport 1: Celestial Astrometry Starfield Scope */}
      <div className="flex flex-col items-center justify-center relative w-full">
        <div
          onClick={handleCanvasClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="overflow-hidden rounded-2xl border border-white/15 shadow-2xl bg-black relative w-full aspect-[2/1] flex items-center justify-center select-none cursor-crosshair"
        >
          <canvas
            ref={radarCanvasRef}
            className="w-full h-full object-fill transition-transform duration-75 pointer-events-none block"
            style={{
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`
            }}
          />

          {/* Locked Progress Pill */}
          <div className="absolute top-3 left-4 flex items-center gap-2 bg-black/80 px-3 py-1.5 rounded-xl border border-white/15 z-20">
            <Telescope size={13} className="text-white" />
            <span className="text-[11px] text-white font-bold">
              BEACONS LOCKED: {lockedCount} / 5
            </span>
          </div>

          {/* Top-Right Zoom Controls */}
          <div className="absolute top-3 right-4 flex items-center gap-1.5 bg-black/80 p-1 rounded-xl border border-white/15 z-20">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleZoomChange(-0.25);
              }}
              className="p-1 text-slate-400 hover:text-white cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut size={13} />
            </button>
            <span className="text-[10px] text-white font-bold px-1">{Math.round(zoom * 100)}%</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleZoomChange(0.25);
              }}
              className="p-1 text-slate-400 hover:text-white cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Viewport 2: Sector Clues & Coordinate Reticle Finder */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 w-full">
        {/* Left Col: 5 Sector Logs */}
        <div className="lg:col-span-7 p-4 bg-black rounded-2xl border border-white/15 shadow-2xl flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2 text-white font-bold text-xs">
              <Compass size={14} />
              <span>ROOFTOP OBSERVATORY NOTEBOOK // SECTOR LOGS</span>
            </div>
            <span className="text-slate-400 text-[10px]">5 BEACONS TO RECOVER</span>
          </div>

          <div className="overflow-x-auto max-h-[140px] rounded-xl border border-white/10 bg-black">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-black text-slate-400 uppercase tracking-wider border-b border-white/10 z-10">
                <tr>
                  <th className="p-2">Sector</th>
                  <th className="p-2">Log Title</th>
                  <th className="p-2 text-right">Target Coordinates</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {SECTOR_CLUES.map((s) => {
                  const isSelected = selectedSector?.sector === s.sector;
                  const isLocked = !!lockedBeacons[s.sector];
                  return (
                    <tr
                      key={s.sector}
                      onClick={() => setSelectedSector(s)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-white/20 text-white font-bold"
                          : "hover:bg-white/5"
                      }`}
                    >
                      <td className="p-2 font-mono">Sector {s.sector}</td>
                      <td className="p-2 font-mono text-slate-300">{s.name}</td>
                      <td className="p-2 text-right font-bold font-mono">
                        {isLocked ? (
                          <span className="text-white font-bold">LOCKED: ({s.targetX}, {s.targetY})</span>
                        ) : (
                          <span className="text-slate-500">[ UNLOCKED ]</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Inspected Sector Clue Card */}
          {selectedSector && (
            <div className="p-3.5 bg-white/5 rounded-xl border border-white/10 flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between text-[11px] text-white font-bold border-b border-white/10 pb-1.5">
                <span>{selectedSector.name}</span>
                <span className="text-slate-400">Position {selectedSector.sector} of 5</span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed italic font-sans">
                "{selectedSector.riddle}"
              </p>
            </div>
          )}
        </div>

        {/* Right Col: Coordinate Reticle Aim & Telemetry Locking */}
        <div className="lg:col-span-5 p-4 bg-black rounded-2xl border border-white/15 shadow-2xl flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
              <div className="flex items-center gap-1.5 text-white font-bold text-xs uppercase tracking-wider">
                <Crosshair size={14} />
                <span>TELESCOPE RETICLE FINDER</span>
              </div>
              <button
                onClick={() => {
                  setFinderX("");
                  setFinderY("");
                }}
                className="text-slate-400 hover:text-white text-[10px] flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={11} /> Clear
              </button>
            </div>

            <p className="text-slate-400 text-[11px] leading-relaxed mb-3">
              Decipher Dr. Marrow's astronomical riddles to deduce the (X, Y) coordinates of each celestial beacon, then aim the crosshairs to lock the telemetry.
            </p>

            {/* Manual Coordinate Form */}
            <form onSubmit={handleFormSubmit} className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-1 bg-white/5 p-1.5 rounded-xl border border-white/10">
                  <span className="text-slate-400 text-[11px] px-2 font-bold font-mono">X:</span>
                  <input
                    type="number"
                    value={finderX}
                    onChange={(e) => setFinderX(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full bg-black border border-white/20 rounded-lg px-2 py-1 text-white font-mono font-bold text-xs focus:border-white focus:outline-none"
                  />
                </div>

                <div className="flex-1 flex items-center gap-1 bg-white/5 p-1.5 rounded-xl border border-white/10">
                  <span className="text-slate-400 text-[11px] px-2 font-bold font-mono">Y:</span>
                  <input
                    type="number"
                    value={finderY}
                    onChange={(e) => setFinderY(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full bg-black border border-white/20 rounded-lg px-2 py-1 text-white font-mono font-bold text-xs focus:border-white focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-white hover:bg-slate-200 text-black font-bold rounded-xl text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
              >
                <Crosshair size={14} /> Aim &amp; Lock Telescope Reticle
              </button>
            </form>
          </div>

          {/* Status readout */}
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Reticle Aim: ({aimCoord.x}, {aimCoord.y})</span>
            {SECTOR_CLUES.find((s) => s.targetX === aimCoord.x && s.targetY === aimCoord.y) ? (
              <span className="text-white font-bold flex items-center gap-1">
                <CheckCircle2 size={13} /> BEACON LOCKED!
              </span>
            ) : (
              <span className="text-slate-500">Empty Cosmic Sector</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
