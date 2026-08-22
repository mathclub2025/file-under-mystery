import React from "react";

export default function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between text-xs font-mono text-slate-300 cursor-pointer">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="rounded bg-slate-800 border-slate-700 text-cyan-500" />
    </label>
  );
}
