import React from "react";
import { useLocation } from "react-router-dom";

export default function MathsClubWatermark() {
  const location = useLocation();

  // Hide global floating watermark when inside investigation labs or final video to prevent duplicate badges
  if (location.pathname.startsWith("/investigate")) {
    return null;
  }

  return (
    <div
      className="fixed z-40 select-none pointer-events-none"
      style={{
        bottom: "2.3rem",
        right: "6.2rem"
      }}
    >
      <img
        src="/maths_club_logo.png"
        alt="Maths Club VIT"
        className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-[0_0_25px_rgba(0,0,0,0.98)] filter brightness-95"
      />
    </div>
  );
}
