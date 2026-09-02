import React, { useState, useEffect, useRef } from "react";
import { Play, RotateCcw, CheckCircle2, XCircle, Sliders, Cpu, Scroll } from "lucide-react";

export default function AutomataLab({ config, onEvidenceReady }) {
  useEffect(() => {
    onEvidenceReady?.();
  }, [onEvidenceReady]);

  const targetCanvasRef = useRef(null);
  const liveCanvasRef = useRef(null);

  // 8-bit Binary Seed State (Bits 7 down to 0)
  // Target correct seed: 10100110 -> [1, 0, 1, 0, 0, 1, 1, 0]
  const TARGET_SEED = [1, 0, 1, 0, 0, 1, 1, 0];
  const [currentSeed, setCurrentSeed] = useState([0, 0, 0, 0, 0, 0, 0, 0]);
  const [tested, setTested] = useState(false);

  // 8 Pure Narrative Riddles from Dr. Marrow's Journal (NO Answers or Calculation Leaks)
  const STORYLINE_RIDDLES = [
    {
      bit: "Bit 7 (b7)",
      label: "Journal Entry VII // The Apex Cube",
      riddle: "In sacred geometry, count the vertices of a solid geometric cube and add one solitary seed for its center. If this celestial sum is an odd number, set the first pulse to HIGH; otherwise, set to LOW.",
      targetValue: 1
    },
    {
      bit: "Bit 6 (b6)",
      label: "Journal Entry VI // The Sentry Watch",
      riddle: "Eight sentinels guard the inner courtyard. How many distinct pairs of guards can be chosen to watch the main gate? If the total number of combinations is even, quench this bit into LOW (0); if odd, raise to HIGH (1).",
      targetValue: 0
    },
    {
      bit: "Bit 5 (b5)",
      label: "Journal Entry V // The Sacred Remainder",
      riddle: "Cube the three spatial dimensions of our physical universe, then add the square of the four cardinal winds. Divide this combined total by the days in a week. The remainder of this division determines the binary state of this spark.",
      targetValue: 1
    },
    {
      bit: "Bit 4 (b4)",
      label: "Journal Entry IV // The Midnight Cycle",
      riddle: "Take the total hours in a full solar day and join them with the chimes of a midnight quartet. If the resulting sum is an even integer, keep this channel at LOW; if odd, set to HIGH.",
      targetValue: 0
    },
    {
      bit: "Bit 3 (b3)",
      label: "Journal Entry III // The Archive Selection",
      riddle: "From eight philosophical manuscripts, how many ways can an archivist select exactly half of them to preserve? If the number of possible selections is even, set to LOW; if odd, set to HIGH.",
      targetValue: 0
    },
    {
      bit: "Bit 2 (b2)",
      label: "Journal Entry II // The Golden Sequence",
      riddle: "Follow the rabbit breeding sequence of Leonardo of Pisa starting from 1, 1, 2, 3... to the tenth generation term. If that tenth number is odd, ignite this node to HIGH; if even, set to LOW.",
      targetValue: 1
    },
    {
      bit: "Bit 1 (b1)",
      label: "Journal Entry I // The Triangular Pyramid",
      riddle: "Consider a triangular rack of pins standing in six sequential rows, summing all pins from the first row to the sixth. If this triangular sum is an odd number, set to HIGH; if even, set to LOW.",
      targetValue: 1
    },
    {
      bit: "Bit 0 (b0)",
      label: "Journal Entry 0 // The Silent Horizon",
      riddle: "An astronomer has six distinct optical lenses and needs to choose three to assemble a telescope objective. How many unique trios can be formed? If the total count is even, close the seed in LOW (0); if odd, set to HIGH (1).",
      targetValue: 0
    }
  ];

  // Active Selected Journal Entry
  const [selectedRiddle, setSelectedRiddle] = useState(STORYLINE_RIDDLES[0]);

  // Compute Rule 30 row evolution for a given seed
  const generateRule30Grid = (seed8Bit, numRows = 32, numCols = 64) => {
    const grid = [];
    const firstRow = new Array(numCols).fill(0);
    const startIdx = Math.floor((numCols - 8) / 2);
    for (let i = 0; i < 8; i++) {
      firstRow[startIdx + i] = seed8Bit[i];
    }
    grid.push(firstRow);

    for (let r = 1; r < numRows; r++) {
      const prevRow = grid[r - 1];
      const newRow = new Array(numCols).fill(0);
      for (let c = 0; c < numCols; c++) {
        const p = c > 0 ? prevRow[c - 1] : 0;
        const q = prevRow[c];
        const rVal = c < numCols - 1 ? prevRow[c + 1] : 0;
        newRow[c] = p ^ (q | rVal);
      }
      grid.push(newRow);
    }
    return grid;
  };

  // Toggle individual bit (0 -> 7)
  const handleToggleBit = (bitIndex) => {
    setCurrentSeed((prev) => {
      const next = [...prev];
      next[bitIndex] = next[bitIndex] === 1 ? 0 : 1;
      return next;
    });
    setTested(false);
  };

  const seedString = currentSeed.join("");
  const isSolved = seedString === TARGET_SEED.join("");

  const targetGrid = generateRule30Grid(TARGET_SEED);
  const liveGrid = generateRule30Grid(currentSeed);

  // Render Target Evidence Lattice (Left) & Live Simulated Lattice (Right)
  useEffect(() => {
    // 1. Draw Target Evidence Grid
    const targetCanvas = targetCanvasRef.current;
    if (targetCanvas) {
      const ctx = targetCanvas.getContext("2d");
      const w = (targetCanvas.width = 320);
      const h = (targetCanvas.height = 180);
      const cellW = w / 64;
      const cellH = h / 32;

      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, w, h);

      for (let r = 0; r < 32; r++) {
        for (let c = 0; c < 64; c++) {
          if (targetGrid[r][c] === 1) {
            ctx.fillStyle = "#F59E0B"; // Amber phosphor
            ctx.fillRect(c * cellW, r * cellH, cellW - 0.5, cellH - 0.5);
          }
        }
      }
    }

    // 2. Draw Live Simulated Grid
    const liveCanvas = liveCanvasRef.current;
    if (liveCanvas) {
      const ctx = liveCanvas.getContext("2d");
      const w = (liveCanvas.width = 320);
      const h = (liveCanvas.height = 180);
      const cellW = w / 64;
      const cellH = h / 32;

      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, w, h);

      for (let r = 0; r < 32; r++) {
        for (let c = 0; c < 64; c++) {
          if (liveGrid[r][c] === 1) {
            ctx.fillStyle = tested && isSolved ? "#FFFFFF" : "#38BDF8";
            ctx.fillRect(c * cellW, r * cellH, cellW - 0.5, cellH - 0.5);
          }
        }
      }

      if (tested && isSolved) {
        // Overlay Token Badge
        ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
        ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(w / 2 - 65, h / 2 - 20, 130, 40, 8);
        ctx.fill();
        ctx.stroke();

        ctx.font = "bold 14px 'JetBrains Mono', monospace";
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("TOKEN: R30S4", w / 2, h / 2);
      }
    }
  }, [currentSeed, isSolved, tested]);

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="flex flex-col gap-4 w-full select-none font-mono text-xs max-w-5xl mx-auto"
    >
      {/* Top Viewport: Target Evidence Lattice vs Live Simulation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        {/* Left: Intercepted Evidence Lattice */}
        <div className="p-4 rounded-2xl border border-white/15 bg-black flex flex-col gap-2.5 shadow-2xl">
          <div className="flex items-center justify-between text-slate-400 text-[11px] border-b border-white/10 pb-2">
            <span className="flex items-center gap-1.5 text-white font-bold">
              <Cpu size={14} />
              <span>FORENSIC EVIDENCE #10 (TARGET LATTICE)</span>
            </span>
            <span className="text-amber-400 font-bold">Rule 30</span>
          </div>

          <div className="overflow-hidden rounded-xl border border-white/10 bg-black aspect-[16/9] flex items-center justify-center">
            <canvas ref={targetCanvasRef} className="w-full h-full object-contain" />
          </div>

          <p className="text-slate-400 text-[11px] leading-relaxed">
            Dr. Marrow's simulation log. The chaotic pyramid evolved from an 8-bit seed at Generation 0.
          </p>
        </div>

        {/* Right: Live Simulated Lattice */}
        <div className="p-4 rounded-2xl border border-white/15 bg-black flex flex-col gap-2.5 shadow-2xl">
          <div className="flex items-center justify-between text-slate-400 text-[11px] border-b border-white/10 pb-2">
            <span className="flex items-center gap-1.5 text-white font-bold">
              <Sliders size={14} />
              <span>LIVE CELLULAR SIMULATOR</span>
            </span>
            <span className="text-slate-400 font-mono text-[10px]">
              f(p,q,r) = p ⊕ (q ∨ r)
            </span>
          </div>

          <div className="overflow-hidden rounded-xl border border-white/10 bg-black aspect-[16/9] flex items-center justify-center">
            <canvas ref={liveCanvasRef} className="w-full h-full object-contain" />
          </div>

          <p className="text-slate-400 text-[11px] leading-relaxed">
            Decipher Dr. Marrow's journal riddles below, configure the 8 seed bits, and evolve the lattice.
          </p>
        </div>
      </div>

      {/* Middle Viewport: Dr. Marrow's Computational Journal Riddles */}
      <div className="p-4 rounded-2xl border border-white/15 bg-black flex flex-col gap-3 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
            <Scroll size={14} />
            <span>DR. MARROW'S COMPUTATIONAL JOURNAL // 8 SEED RIDDLES</span>
          </div>
          <span className="text-slate-400 text-[10px]">SOLVE EACH JOURNAL ENTRY (1 = HIGH, 0 = LOW)</span>
        </div>

        {/* 8-Tab Selector for Journal Entries */}
        <div className="grid grid-cols-8 gap-1.5">
          {STORYLINE_RIDDLES.map((riddle, idx) => {
            const isSelected = selectedRiddle.bit === riddle.bit;
            return (
              <button
                key={idx}
                onClick={() => setSelectedRiddle(riddle)}
                className={`py-2 px-1 rounded-xl border text-center font-mono text-xs transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                  isSelected
                    ? "bg-white text-black border-white font-bold shadow-md"
                    : "bg-white/5 border-white/10 text-slate-300 hover:border-white/25"
                }`}
              >
                <span className="text-[10px] opacity-70">b{7 - idx}</span>
                <span className="text-xs font-bold">{currentSeed[idx]}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Journal Riddle Card */}
        {selectedRiddle && (
          <div className="p-3.5 bg-white/5 rounded-xl border border-white/10 flex flex-col gap-1.5 text-xs animate-fade-in">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5 text-[11px] text-white font-bold">
              <span>{selectedRiddle.label}</span>
              <span className="text-slate-400">Position {selectedRiddle.bit}</span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed italic font-sans pt-1">
              "{selectedRiddle.riddle}"
            </p>
          </div>
        )}
      </div>

      {/* Bottom Controls: 8-Bit Seed Controller & Verification Button */}
      <div className="p-4 rounded-2xl border border-white/15 bg-black flex flex-col gap-3.5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <span className="text-white font-bold text-xs uppercase tracking-wider">
            8-BIT ANCESTRAL SEED CONTROLLER
          </span>
          <button
            onClick={() => {
              setCurrentSeed([0, 0, 0, 0, 0, 0, 0, 0]);
              setTested(false);
            }}
            className="text-slate-400 hover:text-white text-[10px] flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw size={11} /> Reset Bits
          </button>
        </div>

        {/* 8-Bit Interactive Toggle Buttons - Clean, Zero Feedback Indicators */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-slate-400 text-[10px] px-1">
            <span>Bit 7 (MSB)</span>
            <span>Current Binary Stream: <strong className="text-white font-mono">{seedString}</strong></span>
            <span>Bit 0 (LSB)</span>
          </div>

          <div className="grid grid-cols-8 gap-2 w-full">
            {currentSeed.map((bit, idx) => (
              <button
                key={idx}
                onClick={() => handleToggleBit(idx)}
                className={`py-3.5 rounded-xl border font-mono font-bold text-sm transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                  bit === 1
                    ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.25)] scale-[1.02]"
                    : "bg-white/5 border-white/15 text-slate-400 hover:text-white hover:border-white/30"
                }`}
              >
                <span>{bit}</span>
                <span className="text-[9px] opacity-60">b{7 - idx}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Verification Button */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
          <button
            onClick={() => setTested(true)}
            className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-slate-200 text-black font-bold rounded-xl text-xs cursor-pointer flex items-center justify-center gap-2 shadow-lg"
          >
            <Play size={14} /> Evolve & Verify Seed Lattice
          </button>

          {tested && (
            <div className={`flex-1 p-3 rounded-xl border text-xs flex items-center gap-2 animate-fade-in ${
              isSolved
                ? "bg-white/10 border-white/40 text-white font-bold"
                : "bg-black border-white/20 text-slate-300"
            }`}>
              {isSolved ? (
                <>
                  <CheckCircle2 size={16} className="text-white shrink-0" />
                  <span>✓ LATTICE CONVERGED // ZERO ENTROPY DISCREPANCY (Token: R30S4)</span>
                </>
              ) : (
                <>
                  <XCircle size={16} className="text-slate-500 shrink-0" />
                  <span>LATTICE MISMATCH: Generated pattern does not match evidence. Re-evaluate the 8 journal entries.</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
