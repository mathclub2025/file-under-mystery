import React, { useEffect } from "react";
import { HashRouter as Router, Routes, Route, Navigate, useParams } from "react-router-dom";
import ConstellationBackground from "./components/ConstellationBackground.jsx";
import BackgroundMusic from "./components/BackgroundMusic.jsx";
import MathsClubWatermark from "./components/MathsClubWatermark.jsx";
import PrologueScreen from "./components/PrologueScreen.jsx";
import PresentationScreen from "./components/PresentationScreen.jsx";
import Leaderboard from "./components/Leaderboard.jsx";
import LabEngine from "./engine/LabEngine.jsx";
import SecurityLockout from "./components/SecurityLockout.jsx";
import AdminDashboard from "./components/AdminDashboard.jsx";
import BrowserPermissionModal from "./components/BrowserPermissionModal.jsx";
import { useAuthStore } from "./store/useAuthStore.js";
import { initAntiInspect } from "./lib/antiInspect.js";
import { apiLoginTeam, apiRegisterTeam } from "./lib/api.js";

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
        const parsed = JSON.parse(saved);
        setTeam(parsed);

        // Background auto-sync with Supabase to ensure permanent UUID & live state
        if (parsed && parsed.teamName && (parsed.teamName.toLowerCase() !== "admin" || !parsed.isAdmin)) {
          const tName = parsed.teamName || "";
          const regNo = parsed.captainRegNo || parsed.regNo || "";
          if (tName && regNo) {
            apiLoginTeam({ teamName: tName, captainRegNo: regNo })
              .then((res) => {
                if (res && res.team && res.team.id) {
                  const upgraded = {
                    ...parsed,
                    id: res.team.id,
                    total_points: res.team.total_points ?? parsed.total_points ?? 0,
                    current_level: res.team.current_level ?? parsed.current_level ?? "level1"
                  };
                  localStorage.setItem("mystery_team_session", JSON.stringify(upgraded));
                  setTeam(upgraded);
                } else {
                  apiRegisterTeam({
                    teamName: tName,
                    captainName: parsed.captainName || "Lead Investigator",
                    captainRegNo: regNo,
                    members: parsed.members || []
                  })
                    .then((regTeam) => {
                      if (regTeam && regTeam.id) {
                        const upgraded = { ...parsed, id: regTeam.id };
                        localStorage.setItem("mystery_team_session", JSON.stringify(upgraded));
                        setTeam(upgraded);
                      }
                    })
                    .catch(() => {});
                }
              })
              .catch(() => {});
          }
        }
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

        {/* Global Browser Hardware & Audio Authorization Modal on Startup */}
        <BrowserPermissionModal />

        {/* Global Maths Club Official Watermark Badge (Covering AI Star) */}
        <MathsClubWatermark />

        {/* Main Content Area - Full height with natural top-down scrolling */}
        <main className="flex-1 min-h-0 w-full relative z-10 overflow-y-auto overflow-x-hidden flex flex-col">
          <Routes>
            <Route path="/" element={<PrologueScreen />} />
            <Route path="/presentation" element={<PresentationScreen />} />
            <Route path="/prologue" element={<PresentationScreen />} />
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
