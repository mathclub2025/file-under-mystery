import React, { useState, useEffect, useRef } from "react";
import { Play, RotateCcw, CheckCircle2, XCircle, Sliders, Cpu, Binary, Lock, Unlock, Zap } from "lucide-react";

export default function AutomataLab({ config, onEvidenceReady }) {
  useEffect(() => {
    onEvidenceReady?.();
  }, [onEvidenceReady]);

  const targetCanvasRef = useRef(null);
  const liveCanvasRef = useRef(null);

  // 8-bit Binary Seed State (Bits 7 down to 0)
  // Correct Ancestral Seed: 10100110_2 = 166 (Decimal, 0xA6)
  const TARGET_SEED = [1, 0, 1, 0, 0, 1, 1, 0];
  const [currentSeed, setCurrentSeed] = useState([0, 0, 0, 0, 0, 0, 0, 0]);
  const [tested, setTested] = useState(false);

  // Intercepted Ciphertext Stream (E) unlocked only upon lattice convergence
  const CIPHERTEXT_VECTOR = [60, 22, 5, 55, 17];

  // Grid dimensions: 88 cols by 26 rows ensures the expanding pyramid
  // (columns 15 to 72) has generous margins on left (15 cols) and right (16 cols)
  const NUM_COLS = 88;
  const NUM_ROWS = 26;

  // Compute Rule 30 row evolution for an 8-bit seed
  const generateRule30Grid = (seed8Bit, numRows = NUM_ROWS, numCols = NUM_COLS) => {
    const grid = [];
    const firstRow = new Array(numCols).fill(0);
    const startIdx = Math.floor((numCols - 8) / 2); // 40
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
  const isLatticeMatched = seedString === TARGET_SEED.join("");

  const targetGrid = generateRule30Grid(TARGET_SEED);
  const liveGrid = generateRule30Grid(currentSeed);

  // Render Target Evidence Lattice (Left) & Live Simulated Lattice (Right)
  useEffect(() => {
    // 1. Draw Target Evidence Grid
    const targetCanvas = targetCanvasRef.current;
    if (targetCanvas) {
      const ctx = targetCanvas.getContext("2d");
      const w = (targetCanvas.width = 720);
      const h = (targetCanvas.height = 260);
      const cellW = w / NUM_COLS;
      const cellH = h / NUM_ROWS;

      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, w, h);

      // Subtle background coordinate grid lines
      ctx.strokeStyle = "rgba(30, 41, 59, 0.35)";
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= w; x += cellW * 4) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      for (let r = 0; r < NUM_ROWS; r++) {
        for (let c = 0; c < NUM_COLS; c++) {
          if (targetGrid[r][c] === 1) {
            ctx.fillStyle = "#F59E0B"; // Amber phosphor
            ctx.shadowColor = "#F59E0B";
            ctx.shadowBlur = 2;
            ctx.fillRect(c * cellW + 0.6, r * cellH + 0.6, cellW - 1.2, cellH - 1.2);
          }
        }
      }
      ctx.shadowBlur = 0;
    }

    // 2. Draw Live Simulated Grid
    const liveCanvas = liveCanvasRef.current;
    if (liveCanvas) {
      const ctx = liveCanvas.getContext("2d");
      const w = (liveCanvas.width = 720);
      const h = (liveCanvas.height = 260);
      const cellW = w / NUM_COLS;
      const cellH = h / NUM_ROWS;

      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = "rgba(30, 41, 59, 0.35)";
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= w; x += cellW * 4) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      const isExact = isLatticeMatched;
      const liveColor = tested && isExact ? "#FFFFFF" : "#38BDF8"; // White when verified, cyan while tuning

      for (let r = 0; r < NUM_ROWS; r++) {
        for (let c = 0; c < NUM_COLS; c++) {
          if (liveGrid[r][c] === 1) {
            ctx.fillStyle = liveColor;
            if (tested && isExact) {
              ctx.shadowColor = "#FFFFFF";
              ctx.shadowBlur = 3;
            }
            ctx.fillRect(c * cellW + 0.6, r * cellH + 0.6, cellW - 1.2, cellH - 1.2);
          }
        }
      }
      ctx.shadowBlur = 0;
    }
  }, [currentSeed, isLatticeMatched, tested]);

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="flex flex-col gap-4 w-full select-none font-mono text-xs max-w-5xl mx-auto"
    >
      {/* Top HUD Header: Topic Name for DOCS Lookup */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-2">
        <div className="flex items-center gap-2 text-white font-bold text-xs">
          <Binary size={15} className="text-white" />
          <span>WOLFRAM RULE 30 DETERMINISTIC CELLULAR AUTOMATA</span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">STATE:</span>
          <span className={`px-2.5 py-0.5 rounded font-bold uppercase ${
            tested && isLatticeMatched
              ? "bg-white text-black font-extrabold shadow"
              : "bg-white/10 text-slate-200 border border-white/10"
          }`}>
            {tested && isLatticeMatched ? "LATTICE CONVERGED" : "TUNING SEED"}
          </span>
        </div>
      </div>

      {/* Viewport 1: Target Evidence Lattice vs Live Simulation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        {/* Left: Intercepted Evidence Lattice */}
        <div className="p-4 rounded-2xl border border-white/15 bg-black flex flex-col gap-2.5 shadow-2xl">
          <div className="flex items-center justify-between text-slate-400 text-[11px] border-b border-white/10 pb-2">
            <span className="flex items-center gap-1.5 text-white font-bold">
              <Cpu size={14} />
              <span>INTERCEPTED EVIDENCE LATTICE (TARGET)</span>
            </span>
            <span className="text-amber-400 font-bold font-mono">Rule 30</span>
          </div>

          <div className="overflow-hidden rounded-xl border border-white/10 bg-black aspect-[2.4/1] flex items-center justify-center p-1">
            <canvas ref={targetCanvasRef} className="w-full h-full object-contain block" />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Generation: 0 ───&gt; 25</span>
            <span className="text-amber-400 font-bold">Target State: [LOCKED]</span>
          </div>
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

          <div className="overflow-hidden rounded-xl border border-white/10 bg-black aspect-[2.4/1] flex items-center justify-center p-1">
            <canvas ref={liveCanvasRef} className="w-full h-full object-contain block" />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Active Seed: <strong className="text-white font-mono">{seedString}</strong></span>
            <span>{isLatticeMatched ? "✓ Matched Pattern" : "Searching State Space"}</span>
          </div>
        </div>
      </div>

      {/* Viewport 2: 8-Bit Ancestral Seed Register Controller */}
      <div className="p-4 rounded-2xl border border-white/15 bg-black flex flex-col gap-3.5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
            <Binary size={14} />
            <span>8-BIT ANCESTRAL SEED REGISTER (GENERATION 0)</span>
          </div>
          <button
            onClick={() => {
              setCurrentSeed([0, 0, 0, 0, 0, 0, 0, 0]);
              setTested(false);
            }}
            className="text-slate-400 hover:text-white text-[10px] flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw size={11} /> Reset Register
          </button>
        </div>

        <p className="text-slate-400 text-[11px] leading-relaxed">
          Toggle the 8 binary bits below to simulate Rule 30 cellular evolution. Align your live lattice with the intercepted evidence pattern on the left.
        </p>

        {/* 8-Bit Interactive Toggle Buttons */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-slate-400 text-[10px] px-1">
            <span>Bit 7 (MSB)</span>
            <span>Binary Register: <strong className="text-white font-mono">{seedString}</strong></span>
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

        {/* Verification Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
          <button
            onClick={() => setTested(true)}
            className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-slate-200 text-black font-bold rounded-xl text-xs cursor-pointer flex items-center justify-center gap-2 shadow-lg"
          >
            <Play size={14} /> Verify Lattice Convergence
          </button>

          {tested && (
            <div className={`flex-1 p-3 rounded-xl border text-xs flex items-center gap-2 animate-fade-in ${
              isLatticeMatched
                ? "bg-white/10 border-white/40 text-white font-bold"
                : "bg-black border-white/20 text-slate-300"
            }`}>
              {isLatticeMatched ? (
                <>
                  <CheckCircle2 size={16} className="text-white shrink-0" />
                  <span>✓ LATTICE CONVERGED: Ancestral Seed S₀ = 10100110₂ (166) validated. Ciphertext transmission unlocked below.</span>
                </>
              ) : (
                <>
                  <XCircle size={16} className="text-slate-500 shrink-0" />
                  <span>LATTICE MISMATCH: Live pattern does not match target evidence. Adjust the binary seed bits.</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Viewport 3: Cryptographic Decryption Terminal */}
      <div className="p-4 rounded-2xl border border-white/15 bg-black flex flex-col gap-3 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
            <Zap size={14} />
            <span>RULE 30 STREAM CIPHER TERMINAL</span>
          </div>
          <span className="text-slate-400 text-[10px]">CIPHER TRANSMISSION</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Intercepted Ciphertext Block (E) - Revealed upon convergence */}
          <div className="p-3.5 bg-white/5 rounded-xl border border-white/10 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px] font-bold">
                INTERCEPTED CIPHERTEXT TRANSMISSION (E):
              </span>
              {tested && isLatticeMatched ? (
                <span className="text-white font-bold text-[10px] flex items-center gap-1">
                  <Unlock size={11} /> UNLOCKED
                </span>
              ) : (
                <span className="text-slate-500 text-[10px] flex items-center gap-1">
                  <Lock size={11} /> LOCKED (MATCH LATTICE)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {CIPHERTEXT_VECTOR.map((val, idx) => (
                <div key={idx} className="flex-1 min-w-[50px] bg-black border border-white/15 rounded-lg py-2 text-center">
                  <span className="text-[10px] text-slate-500 block">E_{idx + 1}</span>
                  <span className={`font-mono font-bold text-xs ${
                    tested && isLatticeMatched ? "text-white" : "text-slate-600"
                  }`}>
                    {tested && isLatticeMatched ? val : "??"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Ancestral Seed Parameter Status */}
          <div className="p-3.5 bg-white/5 rounded-xl border border-white/10 flex flex-col justify-between gap-2">
            <span className="text-slate-400 text-[11px] font-bold">
              ANCESTRAL PARAMETER STATUS:
            </span>
            <div className="bg-black border border-white/15 rounded-lg p-2.5 text-center flex items-center justify-around">
              <div>
                <span className="text-[10px] text-slate-500 block">SEED (BINARY)</span>
                <span className="text-white font-mono font-bold text-xs">
                  {tested && isLatticeMatched ? "10100110" : "--------"}
                </span>
              </div>
              <div className="w-[1px] h-6 bg-white/10" />
              <div>
                <span className="text-[10px] text-slate-500 block">SEED S₀ (DECIMAL)</span>
                <span className="text-white font-mono font-bold text-xs">
                  {tested && isLatticeMatched ? "166" : "---"}
                </span>
              </div>
            </div>
            <p className="text-slate-400 text-[10px] leading-relaxed">
              Open <strong className="text-white">DOCS</strong> &rarr; <strong className="text-white">"Wolfram Rule 30 Deterministic Cellular Automata"</strong> to calculate Keystream K_n and decrypt E_n.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
