import React, { useEffect, useRef } from "react";

export default function DrMarrowHologram() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let angle = 0;

    const width = (canvas.width = 220);
    const height = (canvas.height = 220);
    const cx = width / 2;
    const cy = height / 2;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Outer rotating geometric rings
      angle += 0.015;

      ctx.save();
      ctx.translate(cx, cy);

      // Radar sweep background circle
      ctx.beginPath();
      ctx.arc(0, 0, 85, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Outer dashed ring
      ctx.beginPath();
      ctx.arc(0, 0, 98, angle, angle + Math.PI * 1.5);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 6]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Inner counter-rotating hexagonal frame
      ctx.rotate(-angle * 1.5);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const rad = (i * Math.PI) / 3;
        const x = Math.cos(rad) * 65;
        const y = Math.sin(rad) * 65;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Center silhouette of Dr. Marrow (Wireframe head/shoulders)
      ctx.rotate(angle * 1.5); // Reset rotation for portrait
      ctx.beginPath();
      // Head ellipse
      ctx.arc(0, -15, 22, 0, Math.PI * 2);
      // Glasses wireframe
      ctx.rect(-14, -20, 10, 7);
      ctx.rect(4, -20, 10, 7);
      ctx.moveTo(-4, -17);
      ctx.lineTo(4, -17);
      // Shoulders
      ctx.moveTo(-45, 45);
      ctx.quadraticCurveTo(0, 10, 45, 45);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Glitch scanline horizontal bars
      const scanY = Math.sin(angle * 4) * 50;
      ctx.beginPath();
      ctx.moveTo(-70, scanY);
      ctx.lineTo(70, scanY);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center">
      <canvas ref={canvasRef} className="w-[180px] h-[180px] drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]" />
      <div className="text-[10px] font-mono text-slate-400 tracking-widest uppercase mt-1 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
        SUBJECT: DR. ELIAS MARROW // RECONSTRUCTED TELEMETRY
      </div>
    </div>
  );
}
