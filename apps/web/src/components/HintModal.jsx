import React, { useState } from "react";
import { HelpCircle, AlertTriangle } from "lucide-react";

export default function HintModal({ hints = [] }) {
  const [revealed, setRevealed] = useState({});

  const handleReveal = (idx) => {
    setRevealed((prev) => ({ ...prev, [idx]: true }));
  };

  return (
    <div className="bg-[#121824] border border-slate-800 rounded-xl p-5 font-mono text-sm">
      <div className="flex items-center gap-2 text-cyan-400 font-bold mb-3">
        <HelpCircle size={18} /> INVESTIGATION HINTS
      </div>
      <div className="flex flex-col gap-2">
        {hints.map((h, idx) => (
          <div key={idx} className="p-3 bg-slate-950 rounded border border-slate-800 text-xs">
            {revealed[idx] ? (
              <div className="text-slate-200">{h.text}</div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Hint #{idx + 1}</span>
                <button onClick={() => handleReveal(idx)} className="px-2 py-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-600/40 rounded flex items-center gap-1">
                  <AlertTriangle size={12} /> Reveal (-{h.cost} pts)
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
