import React from "react";

export default function Slider({ label, min, max, value, onChange, unit = "" }) {
  return (
    <div className="flex items-center justify-between text-xs font-mono text-slate-300">
      <span className="w-32">{label}</span>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="flex-1 mx-3" />
      <span className="w-12 text-right">{value}{unit}</span>
    </div>
  );
}
