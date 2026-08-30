import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from "react-router-dom";
import ConstellationBackground from "./components/ConstellationBackground.jsx";
import BackgroundMusic from "./components/BackgroundMusic.jsx";
import MathsClubWatermark from "./components/MathsClubWatermark.jsx";
import PrologueScreen from "./components/PrologueScreen.jsx";
import Leaderboard from "./components/Leaderboard.jsx";
import LabEngine from "./engine/LabEngine.jsx";
import SecurityLockout from "./components/SecurityLockout.jsx";
import AdminDashboard from "./components/AdminDashboard.jsx";
import { useAuthStore } from "./store/useAuthStore.js";
import { initAntiInspect } from "./lib/antiInspect.js";

function LabEngineRoute() {
  const { levelId } = useParams();
  return <LabEngine key={levelId} />;
}

export default function App() {
  const { setTeam } = useAuthStore();

  useEffect(() => {
    const saved = localStorage.getItem("mystery_team_session");
    if (saved) {
      try {
        setTeam(JSON.parse(saved));
      } catch (e) {}
    }

    // Initialize multi-layered anti-inspect and shortcut protections
    const cleanupSecurity = initAntiInspect();

    return () => {
      if (cleanupSecurity) cleanupSecurity();
    };
  }, []);

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div
        onContextMenu={(e) => e.preventDefault()}
        className="h-screen w-screen bg-black text-slate-100 font-sans relative overflow-hidden select-none flex flex-col"
      >
        {/* Pure Black background with interactive white particles */}
        <ConstellationBackground />

        {/* Global Ambient Background Music Player */}
        <BackgroundMusic />

        {/* Global Maths Club Official Watermark Badge (Covering AI Star) */}
        <MathsClubWatermark />

        {/* Main Content Area - Full height with zero outer padding waste */}
        <main className="flex-1 w-full h-full relative z-10 overflow-y-auto overflow-x-hidden flex items-center justify-center">
          <Routes>
            <Route path="/" element={<PrologueScreen />} />
            <Route path="/investigate/:levelId" element={<LabEngineRoute />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/security-lockout" element={<SecurityLockout />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
