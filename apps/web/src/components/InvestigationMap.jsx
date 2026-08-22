import React from "react";
import { Link } from "react-router-dom";
import { Lock, Terminal, Radio, Cpu, Network, Sparkles } from "lucide-react";

const PHASES = [
  {
    phaseName: "PHASE I // PERIMETER FORENSICS",
    timeEstimate: "12:00 – 12:50 PM",
    cases: [
      { id: "level1", title: "The Photograph", type: "Image Histogram Stretch", points: 10 },
      { id: "level2", title: "The Voicemail", type: "Audio Spectrogram Morse", points: 12 },
      { id: "level3", title: "The Recording", type: "Temporal Frame Diff", points: 14 },
      { id: "level4", title: "The Holiday Photo", type: "LSB Steganography", points: 16 },
    ]
  },
  {
    phaseName: "PHASE II // MATHEMATICAL CORE",
    timeEstimate: "12:50 – 01:50 PM",
    cases: [
      { id: "level5", title: "The Numbers", type: "Prime Modular Cipher", points: 18 },
      { id: "level6", title: "The Capture", type: "HTTP Packet Triage", points: 15 },
      { id: "level7", title: "The Corrupted Image", type: "Matrix Permutation", points: 18 },
      { id: "level8", title: "The Signal", type: "2D Fourier Transform", points: 20 },
    ]
  },
  {
    phaseName: "PHASE III // DEEP ANOMALIES & TOPOLOGY",
    timeEstimate: "01:50 – 02:50 PM",
    cases: [
      { id: "level9", title: "Orbital Trajectory", type: "Elliptic Curve Discrete Log", points: 22 },
      { id: "level10", title: "Lattice Growth", type: "Rule 30 Cellular Automata", points: 22 },
      { id: "level11", title: "Dual Transmission", type: "Phase Inversion Forensics", points: 24 },
      { id: "level12", title: "Campus Grid", type: "Eulerian Graph Topology", points: 25 },
    ]
  }
];

export default function InvestigationMap() {
  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Top Banner */}
      <div className="bg-[#121824] border border-slate-800 rounded-xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
          <Terminal size={180} />
        </div>
        <div className="text-xs uppercase font-mono tracking-widest text-cyan-400 mb-1 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          CONFIDENTIAL CASE FILE // DR. ELIAS MARROW (MISSING 37 DAYS)
        </div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">The Marrow Protocol // 12-Tier Investigation Board</h2>
        <p className="text-slate-400 text-sm leading-relaxed max-w-3xl font-sans">
          Marrow's research drive <code className="text-cyan-300 font-mono">BLACKBOX.DAT</code> is locked behind 12 mathematical and forensic anomaly tiers. Reconstruct all evidence files, recover the 12 diary fragments, and synthesize the master uplink key to unlock the final transmission.
        </p>
      </div>

      {/* 3-Phase Grid */}
      {PHASES.map((phase, pIdx) => (
        <div key={pIdx} className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-sm font-mono font-bold tracking-wider text-cyan-400 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/40 text-cyan-300 text-xs">P0{pIdx + 1}</span>
              {phase.phaseName}
            </h3>
            <span className="text-xs font-mono text-slate-400">Target: {phase.timeEstimate}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {phase.cases.map((c, idx) => {
              const globalIdx = pIdx * 4 + idx + 1;
              return (
                <Link
                  key={c.id}
                  to={`/investigate/${c.id}`}
                  className="bg-[#121824] hover:border-cyan-500/60 border border-slate-800/90 rounded-xl p-5 transition-all duration-200 hover:-translate-y-1 block shadow-lg group"
                >
                  <div className="flex justify-between items-center mb-3 font-mono">
                    <span className="text-xs text-slate-400 group-hover:text-cyan-300 transition-colors">
                      EVIDENCE #{globalIdx < 10 ? `0${globalIdx}` : globalIdx}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/40 font-bold">
                      +{c.points} PTS
                    </span>
                  </div>
                  <div className="font-bold text-slate-100 mb-1 group-hover:text-cyan-400 transition-colors">
                    {c.title}
                  </div>
                  <div className="text-xs text-slate-400 font-mono mb-4">{c.type}</div>
                  <div className="text-xs text-cyan-400 font-mono flex items-center gap-1">
                    Examine Evidence &rarr;
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      {/* Final Boss Gate Card */}
      <div className="mt-4 p-6 rounded-xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-cyan-950/40 border border-purple-800/40 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase font-mono tracking-widest text-purple-400 mb-1 flex items-center gap-1.5">
            <Sparkles size={14} /> PHASE IV // THE FINAL BLACKBOX META-GATE
          </div>
          <h4 className="text-lg font-bold text-white">The Marrow Meta-Assembly (12-Fragment Uplink)</h4>
          <p className="text-xs text-slate-400 font-mono mt-1">Requires all 12 evidence cases verified to unlock.</p>
        </div>
        <Link
          to="/investigate/final"
          className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg text-white font-mono font-bold text-sm shadow-lg hover:shadow-purple-500/25 transition-all"
        >
          Access Uplink Gateway &rarr;
        </Link>
      </div>
    </div>
  );
}
