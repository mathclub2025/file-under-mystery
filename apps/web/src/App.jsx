import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import ConstellationBackground from "./components/ConstellationBackground.jsx";
import PrologueScreen from "./components/PrologueScreen.jsx";
import InvestigationMap from "./components/InvestigationMap.jsx";
import Leaderboard from "./components/Leaderboard.jsx";
import LabEngine from "./engine/LabEngine.jsx";
import { useAuthStore } from "./store/useAuthStore.js";

export default function App() {
  const { setTeam } = useAuthStore();

  useEffect(() => {
    const saved = localStorage.getItem("mystery_team_session");
    if (saved) {
      try {
        setTeam(JSON.parse(saved));
      } catch (e) {}
    }

    // Global security: Disable context menu (right click) and selection
    const handleContextMenu = (e) => e.preventDefault();
    const handleCopy = (e) => e.preventDefault();
    const handleDragStart = (e) => e.preventDefault();

    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("copy", handleCopy);
    window.addEventListener("cut", handleCopy);
    window.addEventListener("dragstart", handleDragStart);

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("copy", handleCopy);
      window.removeEventListener("cut", handleCopy);
      window.removeEventListener("dragstart", handleDragStart);
    };
  }, []);

  return (
    <Router>
      <div
        onContextMenu={(e) => e.preventDefault()}
        className="min-h-screen flex flex-col bg-black text-slate-100 font-sans relative overflow-x-hidden select-none"
      >
        {/* Pure Black background with interactive white particles */}
        <ConstellationBackground />

        {/* Main Content Area */}
        <main className="flex-1 w-full flex items-center justify-center p-4 md:p-8 relative z-10">
          <Routes>
            <Route path="/" element={<PrologueScreen />} />
            <Route path="/board" element={<InvestigationMap />} />
            <Route path="/investigate/:levelId" element={<LabEngine />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
