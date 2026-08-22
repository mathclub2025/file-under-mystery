import React from "react";
import { BookOpen, Lock } from "lucide-react";

export default function NotebookAccordion({ fragment, isUnlocked }) {
  return (
    <div className="bg-[#121824] border border-slate-800 rounded-xl p-5 font-mono text-sm">
      <div className="flex items-center gap-2 text-amber-400 font-bold mb-3">
        <BookOpen size={18} /> DR. MARROW'S NOTEBOOK FRAGMENT
      </div>
      {isUnlocked ? (
        <div className="p-3 bg-amber-950/20 border border-amber-800/40 rounded text-amber-200 italic leading-relaxed">
          "{fragment}"
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3 bg-slate-950 rounded border border-slate-800/80 text-slate-400 text-xs">
          <Lock size={14} /> Solved fragment unlocks upon correct verification.
        </div>
      )}
    </div>
  );
}
