import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Terminal,
  RefreshCw,
  Search,
  Filter,
  Plus,
  Minus,
  Edit3,
  Trash2,
  RotateCcw,
  Send,
  Download,
  Eye,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Clock,
  Award,
  Users,
  Radio,
  FileText,
  Sliders,
  X,
  UserPlus,
  Tv,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Link2,
  Wifi,
  WifiOff,
  Server,
  Coffee
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore.js";
import {
  apiAdminGetTeams,
  apiAdminUpdateTeamDetails,
  apiAdminUpdateTeamPoints,
  apiAdminUpdateTeamLevel,
  apiAdminUpdateTeamProgress,
  apiAdminUpdateTeamHint,
  apiAdminResetTeam,
  apiAdminDeleteTeam,
  apiAdminClearDatabase,
  apiGetEventStatus,
  apiAdminUpdateEventStatus,
  getApiBase,
  setCustomApiUrl,
  apiCheckHealth
} from "../lib/api.js";
import { STORY_LINES } from "./PrologueScreen.jsx";

const LEVEL_LIST = [
  { id: "level1", num: 1, name: "L01: The Photograph", maxPts: 20, durationSeconds: 1500 },
  { id: "level2", num: 2, name: "L02: The Voicemail", maxPts: 20, durationSeconds: 1500 },
  { id: "level3", num: 3, name: "L03: The Corridor Video", maxPts: 20, durationSeconds: 1500 },
  { id: "level4", num: 4, name: "L04: The Holiday Photo", maxPts: 20, durationSeconds: 1500 },
  { id: "level5", num: 5, name: "L05: The Shredded Notes", maxPts: 20, durationSeconds: 1500 },
  { id: "level6", num: 6, name: "L06: The Network Capture", maxPts: 20, durationSeconds: 1500 },
  { id: "level7", num: 7, name: "L07: Harmonic Waves", maxPts: 20, durationSeconds: 1500 },
  { id: "level8", num: 8, name: "L08: 2D Fourier Dispersion", maxPts: 20, durationSeconds: 1500 },
  { id: "level9", num: 9, name: "L09: Celestial Astrometry", maxPts: 20, durationSeconds: 1500 },
  { id: "level10", num: 10, name: "L10: Rule 30 Lattice", maxPts: 20, durationSeconds: 1500 },
  { id: "level11", num: 11, name: "L11: Dual Transmission", maxPts: 20, durationSeconds: 1500 },
  { id: "level12", num: 12, name: "L12: Chromatic Distance", maxPts: 20, durationSeconds: 1500 },
  { id: "final", num: 13, name: "Phase IV: Meta-Assembly", maxPts: 20, durationSeconds: 1500 }
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { team, logout, isAdmin } = useAuthStore();

  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(10);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [sortBy, setSortBy] = useState("points_desc");

  // Selected Team Modal State
  const [selectedTeam, setSelectedTeam] = useState(null);

  // Clear Database State
  const [showClearDbModal, setShowClearDbModal] = useState(false);
  const [clearingDb, setClearingDb] = useState(false);

  // Live Event Control State
  const [eventStatus, setEventStatus] = useState(() => {
    try {
      const cached = localStorage.getItem("mystery_event_status_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        return {
          isLive: !!parsed.isLive,
          introEnabled: parsed.introEnabled !== false,
          phase2Unlocked: parsed.phase2Unlocked !== false
        };
      }
    } catch (e) {}
    return { isLive: false, introEnabled: true, phase2Unlocked: true };
  });
  const [statusLoading, setStatusLoading] = useState(false);

  // Backend Server Connection & Health State
  const [serverUrlInput, setServerUrlInput] = useState(getApiBase());
  const [serverHealth, setServerHealth] = useState({ status: "checking", latency: 0, error: null });
  const [serverTesting, setServerTesting] = useState(false);

  const checkConnection = async (urlToTest) => {
    setServerTesting(true);
    const target = urlToTest !== undefined ? urlToTest : serverUrlInput;
    const res = await apiCheckHealth(target);
    if (res.success) {
      setServerHealth({ status: "connected", latency: res.latency, error: null, data: res.data });
    } else {
      setServerHealth({ status: "disconnected", latency: res.latency, error: res.error });
    }
    setServerTesting(false);
    return res.success;
  };

  const handleSaveServerUrl = async (e) => {
    if (e) e.preventDefault();
    const clean = (serverUrlInput || "").trim();
    setCustomApiUrl(clean);
    showToast(`Testing connection to: ${clean || "Default"}...`, "info");
    const ok = await checkConnection(clean);
    if (ok) {
      showToast("Connected to backend server successfully!", "success");
      fetchTeamsData();
    } else {
      showToast("Could not reach backend at specified URL", "error");
    }
  };

  const handleResetToEnv = () => {
    setCustomApiUrl("");
    const envBase = import.meta.env.VITE_API_URL || "";
    setServerUrlInput(envBase);
    checkConnection(envBase);
    fetchTeamsData();
    showToast("Reset server URL to deployment default", "info");
  };

  // Toast notification
  const [statusNotification, setStatusNotification] = useState(null);

  // Authenticate Admin Guard
  useEffect(() => {
    let authValid = false;
    if (isAdmin && isAdmin()) authValid = true;
    else if (team && (team.role === "admin" || team.isAdmin || team.teamName?.toLowerCase() === "admin")) authValid = true;
    else {
      try {
        const saved = localStorage.getItem("mystery_team_session");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.role === "admin" || parsed.isAdmin || parsed.teamName?.toLowerCase() === "admin") {
            authValid = true;
          }
        }
      } catch (e) {}
    }

    if (!authValid) {
      navigate("/", { replace: true });
    }
  }, [team, isAdmin, navigate]);

  const showToast = (msg, type = "success") => {
    setStatusNotification({ msg, type });
    setTimeout(() => setStatusNotification(null), 3500);
  };

  const fetchEventStatus = async () => {
    if (statusLoading) return;
    try {
      const res = await apiGetEventStatus();
      if (res && res.success) {
        setEventStatus((prev) => ({
          ...prev,
          isLive: res.isLive !== undefined ? !!res.isLive : prev.isLive,
          introEnabled: res.introEnabled !== undefined ? res.introEnabled !== false : prev.introEnabled,
          phase2Unlocked: res.phase2Unlocked !== undefined ? res.phase2Unlocked !== false : prev.phase2Unlocked
        }));
      }
    } catch (e) {}
  };

  const toggleLiveStatus = async () => {
    setStatusLoading(true);
    const newLive = !eventStatus.isLive;
    const updated = { ...eventStatus, isLive: newLive };
    setEventStatus(updated);
    try {
      localStorage.setItem("mystery_event_status_cache", JSON.stringify(updated));
    } catch (e) {}
    showToast(newLive ? "EVENT IS NOW LIVE: Terminals Unlocked." : "EVENT PAUSED: Players in Standby Lobby.");
    try {
      await apiAdminUpdateEventStatus({ isLive: newLive });
    } catch (e) {}
    setStatusLoading(false);
  };

  const toggleIntroStatus = async () => {
    setStatusLoading(true);
    const newIntro = !eventStatus.introEnabled;
    const updated = { ...eventStatus, introEnabled: newIntro };
    setEventStatus(updated);
    try {
      localStorage.setItem("mystery_event_status_cache", JSON.stringify(updated));
    } catch (e) {}
    showToast(newIntro ? "18-Slide Prologue ENABLED for players" : "18-Slide Prologue DISABLED (Players jump straight to case)");
    try {
      await apiAdminUpdateEventStatus({ introEnabled: newIntro });
    } catch (e) {}
    setStatusLoading(false);
  };

  const togglePhase2Status = async () => {
    setStatusLoading(true);
    const newPhase2 = eventStatus.phase2Unlocked === false ? true : false;
    const updated = { ...eventStatus, phase2Unlocked: newPhase2 };
    setEventStatus(updated);
    try {
      localStorage.setItem("mystery_event_status_cache", JSON.stringify(updated));
    } catch (e) {}
    showToast(
      newPhase2
        ? "PHASE 2 UNLOCKED: Players can proceed to Level 7 & beyond."
        : "PHASE 1 BREAK ACTIVE: Teams finishing Level 6 are held in Refreshment Lobby."
    );
    try {
      await apiAdminUpdateEventStatus({ phase2Unlocked: newPhase2 });
    } catch (e) {}
    setStatusLoading(false);
  };

  const fetchTeamsData = async () => {
    setLoading(true);
    try {
      fetchEventStatus();
      const data = await apiAdminGetTeams();
      if (Array.isArray(data)) {
        setTeams(data);
        setLastRefreshed(new Date());
        if (selectedTeam) {
          const updatedSelected = data.find((t) => t.id === selectedTeam.id);
          if (updatedSelected) setSelectedTeam(updatedSelected);
        }
      }
    } catch (err) {
      console.warn("Admin fetch error:", err);
      showToast("Failed to fetch live team records", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkConnection();
    fetchTeamsData();
  }, []);

  useEffect(() => {
    if (autoRefreshInterval <= 0) return;
    const interval = setInterval(fetchTeamsData, autoRefreshInterval * 1000);
    return () => clearInterval(interval);
  }, [autoRefreshInterval, selectedTeam]);

  // Filtered & Sorted Teams
  const processedTeams = useMemo(() => {
    return teams
      .filter((t) => {
        if (!t) return false;
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          (t.teamName || "").toLowerCase().includes(q) ||
          (t.captainName || "").toLowerCase().includes(q) ||
          (t.captainRegNo || "").toLowerCase().includes(q) ||
          (t.members || []).some(
            (m) =>
              (m.name || "").toLowerCase().includes(q) ||
              (m.regNo || "").toLowerCase().includes(q)
          );

        const matchesLevel =
          levelFilter === "all" || (t.currentLevel || "level1").toLowerCase() === levelFilter.toLowerCase();

        return matchesSearch && matchesLevel;
      })
      .sort((a, b) => {
        if (sortBy === "points_desc") return (b.totalPoints || 0) - (a.totalPoints || 0);
        if (sortBy === "points_asc") return (a.totalPoints || 0) - (b.totalPoints || 0);
        if (sortBy === "solved_desc") return (b.solvedCount || 0) - (a.solvedCount || 0);
        if (sortBy === "time_asc") return (a.totalTimeSeconds || 0) - (b.totalTimeSeconds || 0);
        if (sortBy === "recent") return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        if (sortBy === "name_asc") return (a.teamName || "").localeCompare(b.teamName || "");
        return 0;
      });
  }, [teams, searchQuery, levelFilter, sortBy]);

  // Stats
  const metrics = useMemo(() => {
    const totalTeams = teams.length;
    const totalSolves = teams.reduce((acc, t) => acc + (t.solvedCount || 0), 0);
    const avgScore = totalTeams > 0 ? Math.round(teams.reduce((acc, t) => acc + (t.totalPoints || 0), 0) / totalTeams) : 0;
    const topScore = teams.reduce((max, t) => Math.max(max, t.totalPoints || 0), 0);

    const levelCounts = {};
    LEVEL_LIST.forEach((l) => (levelCounts[l.id] = 0));
    teams.forEach((t) => {
      const lvl = t.currentLevel || "level1";
      levelCounts[lvl] = (levelCounts[lvl] || 0) + 1;
    });

    return { totalTeams, totalSolves, avgScore, topScore, levelCounts };
  }, [teams]);

  const handleQuickPoints = async (teamId, delta) => {
    const target = teams.find((t) => t.id === teamId);
    if (!target) return;
    const newPts = Math.max(0, (target.totalPoints || 0) + delta);
    try {
      const res = await apiAdminUpdateTeamPoints(teamId, newPts);
      if (res.success) {
        showToast(`Updated ${target.teamName} to ${newPts} pts`);
        fetchTeamsData();
      } else {
        showToast(res.error || "Failed to update points", "error");
      }
    } catch (e) {
      showToast("Error updating points", "error");
    }
  };

  const handleQuickLevel = async (teamId, newLevel) => {
    const target = teams.find((t) => t.id === teamId);
    if (!target) return;
    try {
      const res = await apiAdminUpdateTeamLevel(teamId, newLevel);
      if (res.success) {
        showToast(`Moved ${target.teamName} to ${newLevel.toUpperCase()}`);
        fetchTeamsData();
      } else {
        showToast(res.error || "Failed to switch level", "error");
      }
    } catch (e) {
      showToast("Error switching level", "error");
    }
  };

  const handleExportCSV = () => {
    if (teams.length === 0) {
      showToast("No records available to export", "error");
      return;
    }

    const headers = [
      "Team ID",
      "Team Name",
      "Captain Name",
      "Captain Reg No",
      "Members",
      "Current Level",
      "Cases Solved",
      "Total Points",
      "Time Elapsed (sec)",
      "Registered At"
    ];

    const rows = teams.map((t) => [
      `"${t.id}"`,
      `"${(t.teamName || "").replace(/"/g, '""')}"`,
      `"${(t.captainName || "").replace(/"/g, '""')}"`,
      `"${(t.captainRegNo || "").replace(/"/g, '""')}"`,
      `"${(t.members || []).map((m) => `${m.name} (${m.regNo})`).join(", ").replace(/"/g, '""')}"`,
      `"${t.currentLevel || "level1"}"`,
      t.solvedCount || 0,
      t.totalPoints || 0,
      t.totalTimeSeconds || 0,
      `"${t.createdAt || ""}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FILE_UNDER_MYSTERY_TEAMS_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Exported teams roster to CSV");
  };

  const handleClearDatabase = async () => {
    setClearingDb(true);
    try {
      const res = await apiAdminClearDatabase();
      if (res.success) {
        try {
          localStorage.removeItem("mystery_registered_teams");
        } catch (e) {}
        showToast("Database successfully cleared");
        setShowClearDbModal(false);
        fetchTeamsData();
      } else {
        showToast(res.error || "Failed to clear database", "error");
      }
    } catch (err) {
      showToast("Error clearing database", "error");
    } finally {
      setClearingDb(false);
    }
  };

  const formatTime = (totalSec) => {
    if (!totalSec || totalSec <= 0) return "00m 00s";
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) {
      const remMins = mins % 60;
      return `${hrs}h ${remMins < 10 ? "0" : ""}${remMins}m ${secs < 10 ? "0" : ""}${secs}s`;
    }
    return `${mins < 10 ? "0" : ""}${mins}m ${secs < 10 ? "0" : ""}${secs}s`;
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="w-full shrink-0 min-h-full bg-black text-slate-100 font-mono select-text flex flex-col px-4 sm:px-6 md:px-8 pt-8 sm:pt-10 md:pt-12 pb-36 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {statusNotification && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-2xl border border-white/20 bg-[#0e0e12] text-white flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200 text-xs font-bold">
          {statusNotification.type === "error" ? <AlertCircle size={16} className="text-white" /> : <CheckCircle2 size={16} className="text-white" />}
          <span>{statusNotification.msg}</span>
        </div>
      )}

      {/* TOP LIVE EVENT CONTROL BANNER (Pure Black & White Monochrome UI) */}
      <div className="rounded-3xl border border-white/20 p-5 bg-black shadow-2xl flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl border border-white/20 bg-white/5 text-white">
            <Radio size={22} className={eventStatus.isLive ? 'animate-pulse text-white' : 'text-zinc-500'} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-xs text-zinc-400 uppercase tracking-widest font-bold">EVENT STATUS:</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black tracking-wider border ${
                eventStatus.isLive
                  ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                  : 'bg-black text-zinc-300 border-white/30'
              }`}>
                {eventStatus.isLive ? "LIVE (TERMINALS UNLOCKED)" : "STANDBY (LOBBY ACTIVE)"}
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5 font-mono">
              {eventStatus.isLive ? "Participants can actively solve cases and submit tokens." : "Participants are held in the Waiting Room lobby until you click Go Live."}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 justify-start xl:justify-end">
          {/* Go Live Toggle */}
          <button
            type="button"
            onClick={toggleLiveStatus}
            disabled={statusLoading}
            className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer border ${
              eventStatus.isLive
                ? "bg-black hover:bg-zinc-900 border-white/40 text-white"
                : "bg-white hover:bg-zinc-200 text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.25)]"
            }`}
          >
            {eventStatus.isLive ? <Pause size={14} /> : <Play size={14} />}
            <span>{eventStatus.isLive ? "PAUSE EVENT (PUT IN LOBBY)" : "GO LIVE (START EVENT)"}</span>
          </button>

          {/* Phase 1 Break (Gate Level 7+) Toggle */}
          <button
            type="button"
            onClick={togglePhase2Status}
            disabled={statusLoading}
            className={`px-4 py-2.5 rounded-xl border font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              eventStatus.phase2Unlocked === false
                ? "bg-amber-400 text-black border-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.35)] animate-pulse"
                : "bg-white/10 hover:bg-white/20 border-white/30 text-zinc-300 hover:text-white"
            }`}
            title="When active, teams that finish Level 6 are held in the Refreshment Break Lobby until you unlock Phase 2"
          >
            <Coffee size={15} className={eventStatus.phase2Unlocked === false ? "text-black" : "text-amber-400"} />
            <span>
              {eventStatus.phase2Unlocked === false
                ? "☕ REFRESHMENT BREAK ACTIVE (LEVEL 7+ GATED)"
                : "ENABLE PHASE 1 BREAK (GATE LEVEL 7+)"}
            </span>
          </button>

          {/* 18-Slide Intro Toggle */}
          <button
            type="button"
            onClick={toggleIntroStatus}
            disabled={statusLoading}
            className={`px-3.5 py-2.5 rounded-xl border font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              eventStatus.introEnabled
                ? "bg-white/10 border-white/40 text-white"
                : "bg-black border-white/20 text-zinc-400 hover:text-white"
            }`}
            title="Toggle whether players see the 18-slide prologue intro or jump straight to Level 1"
          >
            <Sliders size={14} className="text-white" />
            <span>Player Intro Slides: <strong className="text-white">{eventStatus.introEnabled ? "ENABLED" : "DISABLED"}</strong></span>
          </button>

          {/* Projector Presentation Mode */}
          <button
            type="button"
            onClick={() => {
              navigate("/presentation?from=admin");
            }}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-extrabold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.25)] border border-white"
          >
            <Tv size={15} />
            <span>PLAY 18-SLIDE PROLOGUE ON PROJECTOR</span>
          </button>

          {/* Top Quick Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/15 text-zinc-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur"
            title="Sign out of Administrator Session"
          >
            <LogOut size={14} className="text-zinc-400" />
            <span>LOGOUT</span>
          </button>
        </div>
      </div>

      {/* BACKEND SERVER CONNECTION & HEALTH STATUS BAR */}
      <div className="rounded-3xl border border-white/20 p-5 bg-[#0d0d10] shadow-2xl mb-6 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className={`p-3 rounded-2xl border ${
            serverHealth.status === "connected"
              ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-400"
              : serverHealth.status === "disconnected"
              ? "bg-rose-950/40 border-rose-500/40 text-rose-400"
              : "bg-amber-950/40 border-amber-500/40 text-amber-400"
          }`}>
            {serverHealth.status === "connected" ? (
              <Wifi size={22} className="animate-pulse text-emerald-400" />
            ) : serverHealth.status === "disconnected" ? (
              <WifiOff size={22} className="text-rose-400" />
            ) : (
              <Server size={22} className="animate-spin text-amber-400" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-zinc-300 font-bold tracking-wider uppercase">BACKEND SERVER:</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border flex items-center gap-1.5 ${
                serverHealth.status === "connected"
                  ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                  : serverHealth.status === "disconnected"
                  ? "bg-rose-500/15 border-rose-500/50 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.2)]"
                  : "bg-amber-500/15 border-amber-500/50 text-amber-300"
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  serverHealth.status === "connected" ? "bg-emerald-400 animate-ping" : serverHealth.status === "disconnected" ? "bg-rose-400" : "bg-amber-400 animate-pulse"
                }`} />
                {serverHealth.status === "connected"
                  ? `ONLINE (${serverHealth.latency}ms ping)`
                  : serverHealth.status === "disconnected"
                  ? "OFFLINE / UNREACHABLE"
                  : "CHECKING..."}
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 mt-1 font-mono break-all">
              {serverHealth.status === "connected" ? (
                <span className="text-emerald-400/90 font-medium">
                  Connected to Supabase DB. Ready to register teams and sync live state.
                </span>
              ) : (
                <span className="text-rose-400 font-medium">
                  Cannot connect to server. Check tunnel URL or run: <code className="bg-black/60 px-1 py-0.5 rounded text-white">node apps/web/server.js</code>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Server URL Configuration Form */}
        <form onSubmit={handleSaveServerUrl} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1 min-w-[280px]">
            <input
              type="text"
              value={serverUrlInput}
              onChange={(e) => setServerUrlInput(e.target.value)}
              placeholder="https://your-tunnel.trycloudflare.com"
              className="w-full pl-3 pr-3 py-2 bg-black/80 border border-white/20 rounded-xl text-xs text-white font-mono placeholder:text-zinc-600 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={serverTesting}
              className="px-3.5 py-2 bg-white hover:bg-zinc-200 text-black font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(255,255,255,0.2)] disabled:opacity-50 shrink-0"
            >
              <Link2 size={13} />
              <span>{serverTesting ? "Connecting..." : "Save & Connect"}</span>
            </button>
            <button
              type="button"
              onClick={() => checkConnection()}
              disabled={serverTesting}
              className="px-3 py-2 bg-white/5 hover:bg-white/15 border border-white/20 text-zinc-300 hover:text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1 shrink-0"
              title="Test ping to current server URL"
            >
              <RefreshCw size={13} className={serverTesting ? "animate-spin text-white" : "text-zinc-400"} />
              <span>Ping</span>
            </button>
            <button
              type="button"
              onClick={handleResetToEnv}
              disabled={serverTesting}
              className="px-3 py-2 bg-white/5 hover:bg-white/15 border border-white/20 text-zinc-400 hover:text-zinc-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1 shrink-0"
              title="Reset URL to GitHub build variable default"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          </div>
        </form>
      </div>

      {/* Top Header Bar */}
      <header className="rounded-3xl border border-white/15 p-5 md:p-6 bg-[#0a0a0c] shadow-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-white/10 border border-white/20 text-white">
            <Shield size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl md:text-2xl font-bold text-white tracking-wide">COMMAND CENTER</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white text-[10px] font-extrabold border border-white/20">
                MASTER ADMIN
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono tracking-widest uppercase mt-0.5">
              FILE UNDER MYSTERY // OPERATIONS & TEAM RECORDS
            </div>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs w-full lg:w-auto justify-start lg:justify-end">
          {/* Auto Refresh Switcher */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300">
            <Clock size={13} className="text-slate-400" />
            <span className="text-[10px] text-slate-400 uppercase">Auto:</span>
            <select
              value={autoRefreshInterval}
              onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
              className="bg-transparent text-white font-bold outline-none cursor-pointer text-xs"
            >
              <option value={0} className="bg-black text-white">OFF</option>
              <option value={5} className="bg-black text-white">5s</option>
              <option value={10} className="bg-black text-white">10s</option>
              <option value={30} className="bg-black text-white">30s</option>
            </select>
          </div>

          {/* Manual Refresh */}
          <button
            onClick={fetchTeamsData}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            title="Refresh Live Records"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-white" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold transition-all flex items-center gap-2 cursor-pointer"
            title="Export Records to CSV"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Clear Database Modal Trigger */}
          <button
            onClick={() => setShowClearDbModal(true)}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold transition-all flex items-center gap-2 cursor-pointer"
            title="Clear and purge all database records"
          >
            <Trash2 size={14} />
            <span>Clear Database</span>
          </button>

          {/* Explicit Logout Button */}
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-zinc-200 hover:text-white font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer ml-auto sm:ml-0"
            title="Sign out of Administrator Session"
          >
            <LogOut size={14} className="text-zinc-400" />
            <span>LOGOUT</span>
          </button>
        </div>
      </header>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6">
        <div className="p-4 rounded-2xl bg-[#0a0a0c] border border-white/15 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>REGISTERED TEAMS</span>
            <Users size={15} className="text-white" />
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white mt-2">{metrics.totalTeams}</div>
          <div className="text-[10px] text-slate-500 mt-1">Live active cohorts</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0a0a0c] border border-white/15 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>CASES SOLVED</span>
            <CheckCircle2 size={15} className="text-white" />
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white mt-2">{metrics.totalSolves}</div>
          <div className="text-[10px] text-slate-500 mt-1">Across all levels</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0a0a0c] border border-white/15 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>AVERAGE SCORE</span>
            <Award size={15} className="text-white" />
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white mt-2">
            {metrics.avgScore} <span className="text-xs text-slate-400 font-normal">pts</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Team average</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0a0a0c] border border-white/15 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>TOP RUNNER</span>
            <Shield size={15} className="text-white" />
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white mt-2">
            {metrics.topScore} <span className="text-xs text-slate-400 font-normal">pts</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Highest tally</div>
        </div>
      </div>

      {/* Search, Filter & Quick Toolbar */}
      <div className="rounded-2xl border border-white/15 p-4 bg-[#0a0a0c] shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search team, captain, reg no, or member..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-black border border-white/15 text-white text-xs outline-none focus:border-white transition-colors placeholder:text-slate-600"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Level Filter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black border border-white/15 text-xs text-slate-300">
            <Filter size={13} className="text-slate-400" />
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="bg-transparent text-white font-bold outline-none cursor-pointer text-xs"
            >
              <option value="all" className="bg-black text-white">All Levels</option>
              {LEVEL_LIST.map((l) => (
                <option key={l.id} value={l.id} className="bg-black text-white">
                  {l.name} ({metrics.levelCounts[l.id] || 0})
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black border border-white/15 text-xs text-slate-300">
            <Sliders size={13} className="text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-white font-bold outline-none cursor-pointer text-xs"
            >
              <option value="points_desc" className="bg-black text-white">Points (High &rarr; Low)</option>
              <option value="points_asc" className="bg-black text-white">Points (Low &rarr; High)</option>
              <option value="solved_desc" className="bg-black text-white">Solved Count</option>
              <option value="time_asc" className="bg-black text-white">Fastest Time</option>
              <option value="recent" className="bg-black text-white">Recently Registered</option>
              <option value="name_asc" className="bg-black text-white">Team Name (A-Z)</option>
            </select>
          </div>

          <div className="text-[11px] text-slate-400 px-1 font-mono">
            Showing <strong className="text-white">{processedTeams.length}</strong> of {teams.length}
          </div>
        </div>
      </div>

      {/* Main Teams Roster Table */}
      <div className="rounded-3xl border border-white/15 bg-[#0a0a0c] shadow-2xl overflow-hidden mb-12">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0e0e12] text-slate-400 uppercase tracking-wider border-b border-white/10">
              <tr>
                <th className="p-4 pl-6">#</th>
                <th className="p-4">Team & Roster</th>
                <th className="p-4 text-center">Active Level</th>
                <th className="p-4 text-center">Progress</th>
                <th className="p-4 text-center">Time</th>
                <th className="p-4 text-right">Points</th>
                <th className="p-4 text-center pr-6">Command Dossier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {loading && teams.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500 italic">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <RefreshCw className="animate-spin text-white" size={24} />
                      <span>Loading team records...</span>
                    </div>
                  </td>
                </tr>
              ) : processedTeams.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500 italic">
                    No teams found matching search criteria.
                  </td>
                </tr>
              ) : (
                processedTeams.map((t, idx) => (
                  <tr key={t.id || idx} className="hover:bg-white/[0.04] transition-colors group">
                    <td className="p-4 pl-6 font-bold text-slate-500">
                      #{idx + 1}
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{t.teamName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-slate-300 font-mono border border-white/15">
                          {t.captainRegNo || "NO_REG"}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Capt: <span className="text-slate-300 font-semibold">{t.captainName || "Unknown"}</span>
                        {t.members && t.members.length > 0 && (
                          <span className="text-slate-500 ml-2">
                            + {t.members.map((m) => m.name || m.regNo).join(", ")}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-4 text-center">
                      <select
                        value={t.currentLevel || "level1"}
                        onChange={(e) => handleQuickLevel(t.id, e.target.value)}
                        className="px-2.5 py-1 rounded-xl bg-white/10 border border-white/20 text-white text-[11px] font-bold outline-none cursor-pointer hover:border-white transition-colors"
                      >
                        {LEVEL_LIST.map((lvl) => (
                          <option key={lvl.id} value={lvl.id} className="bg-black text-white">
                            {lvl.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="p-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="font-bold text-white text-xs">
                          {t.solvedCount || 0} / 13
                        </span>
                        <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden mt-1.5">
                          <div
                            className="h-full bg-white transition-all duration-300"
                            style={{ width: `${((t.solvedCount || 0) / 13) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="p-4 text-center font-mono text-slate-300 text-[11px]">
                      <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
                        {formatTime(t.totalTimeSeconds)}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleQuickPoints(t.id, -5)}
                          className="p-1 rounded bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer border border-white/15"
                          title="-5 Points"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="font-bold text-white text-sm min-w-[45px] text-center">
                          {t.totalPoints || 0}
                        </span>
                        <button
                          onClick={() => handleQuickPoints(t.id, 5)}
                          className="p-1 rounded bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer border border-white/15"
                          title="+5 Points"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </td>

                    <td className="p-4 text-center pr-6">
                      <button
                        onClick={() => setSelectedTeam(t)}
                        className="px-3.5 py-1.5 rounded-xl bg-white text-black font-bold hover:bg-slate-200 transition-all flex items-center gap-1.5 cursor-pointer mx-auto text-xs"
                      >
                        <Edit3 size={13} />
                        <span>Edit Dossier</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FULL TEAM DOSSIER & EDITOR MODAL */}
      {selectedTeam && (
        <TeamDossierEditorModal
          team={selectedTeam}
          onClose={() => setSelectedTeam(null)}
          onUpdate={() => {
            fetchTeamsData();
            showToast("Team record updated successfully");
          }}
          showToast={showToast}
        />
      )}

      {/* CLEAR DATABASE CONFIRMATION MODAL */}
      {showClearDbModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0a0a0c] border border-white/20 rounded-3xl p-6 max-w-md w-full shadow-2xl font-mono text-xs flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <AlertCircle size={18} className="text-white" />
                <span>CLEAR DATABASE</span>
              </div>
              <button
                onClick={() => setShowClearDbModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-black border border-white/15 text-slate-300 leading-relaxed">
              <p className="font-bold text-white mb-1.5">Are you sure you want to clear everything?</p>
              This will permanently delete all registered teams, active logins, case progress records, and timer configurations from the database. This action cannot be reversed.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearDbModal(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearDatabase}
                disabled={clearingDb}
                className="px-5 py-2 rounded-xl bg-white text-black font-bold hover:bg-slate-200 cursor-pointer transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <Trash2 size={14} />
                <span>{clearingDb ? "Purging..." : "Confirm & Clear All Data"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// COMPREHENSIVE TEAM DOSSIER EDITOR MODAL COMPONENT (MONOCHROME)
// -------------------------------------------------------------
function TeamDossierEditorModal({ team, onClose, onUpdate, showToast }) {
  const [activeTab, setActiveTab] = useState("profile");
  const [saving, setSaving] = useState(false);

  // Profile Form State
  const [teamName, setTeamName] = useState(team.teamName || "");
  const [captainName, setCaptainName] = useState(team.captainName || "");
  const [captainRegNo, setCaptainRegNo] = useState(team.captainRegNo || "");
  const [members, setMembers] = useState(Array.isArray(team.members) ? team.members : []);

  // Points & Level Form State
  const [totalPoints, setTotalPoints] = useState(team.totalPoints || 0);
  const [currentLevel, setCurrentLevel] = useState(team.currentLevel || "level1");

  // Hint Add State
  const [hintLevel, setHintLevel] = useState("level1");
  const [hintIndex, setHintIndex] = useState(0);
  const [hintPenalty, setHintPenalty] = useState(2);

  // Custom Hint Transmission State
  const [customHintText, setCustomHintText] = useState("");

  const progressMap = useMemo(() => {
    const map = {};
    (team.progress || []).forEach((p) => {
      map[p.level_id] = p;
    });
    return map;
  }, [team.progress]);

  const handleAddMember = () => {
    setMembers((prev) => [...prev, { name: "", regNo: "" }]);
  };

  const handleRemoveMember = (idx) => {
    setMembers((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleMemberChange = (idx, field, val) => {
    setMembers((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiAdminUpdateTeamDetails({
        teamId: team.id,
        teamName: teamName.trim(),
        captainName: captainName.trim(),
        captainRegNo: captainRegNo.trim().toUpperCase(),
        members
      });
      if (res.success) {
        onUpdate();
      } else {
        showToast(res.error || "Failed to update profile", "error");
      }
    } catch (e) {
      showToast("Error updating profile", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePointsAndLevel = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiAdminUpdateTeamPoints(team.id, Number(totalPoints));
      await apiAdminUpdateTeamLevel(team.id, currentLevel);
      onUpdate();
    } catch (e) {
      showToast("Error updating points/level", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleLevelSolved = async (levelId, currentSolved, maxPts) => {
    setSaving(true);
    try {
      const res = await apiAdminUpdateTeamProgress({
        teamId: team.id,
        levelId,
        solved: !currentSolved,
        pointsAwarded: !currentSolved ? maxPts : 0
      });
      if (res.success) {
        onUpdate();
      } else {
        showToast("Failed to update progress", "error");
      }
    } catch (e) {
      showToast("Error updating progress", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSetLevelPoints = async (levelId, pts) => {
    try {
      const res = await apiAdminUpdateTeamProgress({
        teamId: team.id,
        levelId,
        solved: true,
        pointsAwarded: Number(pts)
      });
      if (res.success) {
        onUpdate();
      }
    } catch (e) {
      showToast("Error updating level points", "error");
    }
  };

  const handleGrantHint = async (levelId, hintIdx, penalty = 2) => {
    try {
      const res = await apiAdminUpdateTeamHint({
        teamId: team.id,
        levelId,
        hintIndex: hintIdx,
        pointsDeducted: penalty,
        action: "add"
      });
      if (res.success) {
        onUpdate();
        showToast(`Hint ${hintIdx + 1} granted for ${levelId}`);
      }
    } catch (e) {
      showToast("Error granting hint", "error");
    }
  };

  const handleRevokeHint = async (levelId, hintIdx) => {
    try {
      const res = await apiAdminUpdateTeamHint({
        teamId: team.id,
        levelId,
        hintIndex: hintIdx,
        action: "remove"
      });
      if (res.success) {
        onUpdate();
        showToast(`Hint ${hintIdx + 1} revoked for ${levelId}`);
      }
    } catch (e) {
      showToast("Error revoking hint", "error");
    }
  };

  const handleSendCustomHint = async () => {
    if (!customHintText.trim()) return;
    try {
      await apiAdminBroadcast({
        targetTeamId: team.id,
        message: customHintText.trim(),
        type: "hint",
        levelId: currentLevel
      });
      showToast(`Custom hint transmitted to ${team.teamName}!`);
      setCustomHintText("");
    } catch (e) {
      showToast("Error sending hint", "error");
    }
  };

  const handleResetTeam = async () => {
    if (!window.confirm(`Reset all progress for "${team.teamName}"? This resets points to 0 on Level 1.`)) {
      return;
    }
    setSaving(true);
    try {
      const res = await apiAdminResetTeam(team.id);
      if (res.success) {
        onUpdate();
        showToast(`Team ${team.teamName} reset to Level 1.`);
      }
    } catch (e) {
      showToast("Error resetting team", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!window.confirm(`PERMANENT ACTION: Delete team "${team.teamName}" from database?`)) {
      return;
    }
    setSaving(true);
    try {
      const res = await apiAdminDeleteTeam(team.id);
      if (res.success) {
        onUpdate();
        onClose();
        showToast(`Team ${team.teamName} deleted.`);
      }
    } catch (e) {
      showToast("Error deleting team", "error");
    } finally {
      setSaving(false);
    }
  };

  // Level-wise timer state
  const [levelTimersState, setLevelTimersState] = useState(team.levelTimers || {});
  const [timerInputs, setTimerInputs] = useState({});

  const handleUpdateTimer = async (levelId, remainingSec, duration = 1200) => {
    const rem = Math.max(0, parseInt(remainingSec, 10));
    try {
      const res = await apiAdminUpdateLevelTimer({
        teamId: team.id,
        levelId,
        remainingSeconds: rem,
        duration
      });
      if (res.success) {
        setLevelTimersState(res.levelTimers || {});
        showToast(`Timer updated for ${levelId.toUpperCase()}: ${formatSeconds(rem)}`);
        onUpdate();
      }
    } catch (e) {
      showToast("Error updating timer", "error");
    }
  };

  const handleAdjustTimer = (levelId, deltaSec) => {
    const current = levelTimersState[levelId];
    const currentRem = current && current.remainingSeconds !== undefined ? current.remainingSeconds : 1200;
    const newRem = Math.max(0, currentRem + deltaSec);
    handleUpdateTimer(levelId, newRem, current?.duration || 1200);
  };

  const formatSeconds = (sec) => {
    if (sec === undefined || sec === null || sec < 0) sec = 1200;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const grossSolveMax = useMemo(() => {
    let sum = 0;
    LEVEL_LIST.forEach((lvl) => {
      if (progressMap[lvl.id]?.solved) {
        sum += lvl.maxPts || 0;
      }
    });
    return sum;
  }, [progressMap]);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0a0a0c] border border-white/20 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl font-mono">
        {/* Modal Header */}
        <div className="p-5 md:p-6 border-b border-white/10 flex items-center justify-between bg-[#0e0e12] rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 border border-white/20 text-white">
              <FileText size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">{team.teamName}</h2>
                <span className="px-2 py-0.5 rounded bg-white/10 text-slate-300 text-[10px] font-bold border border-white/15">
                  {team.captainRegNo}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Team ID: <span className="font-mono text-slate-300">{team.id}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Tabs Navigation */}
        <div className="grid grid-cols-5 border-b border-white/10 bg-[#060608] text-[10px] sm:text-xs">
          <button
            onClick={() => setActiveTab("profile")}
            className={`py-3 px-1 font-bold border-b-2 transition-colors cursor-pointer text-center truncate ${
              activeTab === "profile"
                ? "border-white text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
            title="1. Team Profile"
          >
            1. Profile
          </button>

          <button
            onClick={() => setActiveTab("points")}
            className={`py-3 px-1 font-bold border-b-2 transition-colors cursor-pointer text-center truncate ${
              activeTab === "points"
                ? "border-white text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
            title="2. Score & Level"
          >
            2. Score & Level
          </button>

          <button
            onClick={() => setActiveTab("timers")}
            className={`py-3 px-1 font-bold border-b-2 transition-colors cursor-pointer text-center truncate ${
              activeTab === "timers"
                ? "border-white text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
            title="3. Case Timers"
          >
            3. Case Timers
          </button>

          <button
            onClick={() => setActiveTab("matrix")}
            className={`py-3 px-1 font-bold border-b-2 transition-colors cursor-pointer text-center truncate ${
              activeTab === "matrix"
                ? "border-white text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
            title="4. Level Matrix"
          >
            4. Level Matrix
          </button>

          <button
            onClick={() => setActiveTab("danger")}
            className={`py-3 px-1 font-bold border-b-2 transition-colors cursor-pointer text-center truncate ${
              activeTab === "danger"
                ? "border-white text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
            title="5. Danger Zone"
          >
            5. Danger Zone
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 text-xs">
          {/* TAB 1: PROFILE */}
          {activeTab === "profile" && (
            <form onSubmit={handleSaveProfile} className="flex flex-col gap-4 max-w-xl">
              <div>
                <label className="text-[11px] text-slate-400 font-bold block mb-1">TEAM NAME</label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black border border-white/15 text-white outline-none focus:border-white font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] text-slate-400 font-bold block mb-1">CAPTAIN NAME</label>
                  <input
                    type="text"
                    value={captainName}
                    onChange={(e) => setCaptainName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-black border border-white/15 text-white outline-none focus:border-white font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 font-bold block mb-1">CAPTAIN REG NO</label>
                  <input
                    type="text"
                    value={captainRegNo}
                    onChange={(e) => setCaptainRegNo(e.target.value.toUpperCase())}
                    className="w-full p-2.5 rounded-xl bg-black border border-white/15 text-white outline-none focus:border-white font-bold uppercase"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] text-slate-400 font-bold">TEAM MEMBERS</label>
                  <button
                    type="button"
                    onClick={handleAddMember}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer border border-white/15"
                  >
                    <UserPlus size={12} /> Add Member
                  </button>
                </div>

                {members.length === 0 ? (
                  <p className="text-slate-500 italic text-[11px]">No additional members added.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {members.map((m, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Member Name"
                          value={m.name || ""}
                          onChange={(e) => handleMemberChange(idx, "name", e.target.value)}
                          className="flex-1 p-2 rounded-lg bg-black border border-white/15 text-white text-xs outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Reg No"
                          value={m.regNo || ""}
                          onChange={(e) => handleMemberChange(idx, "regNo", e.target.value.toUpperCase())}
                          className="w-32 p-2 rounded-lg bg-black border border-white/15 text-white text-xs outline-none uppercase"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(idx)}
                          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-white text-black font-bold cursor-pointer hover:bg-slate-200 transition-all disabled:opacity-50"
                >
                  {saving ? "Saving Changes..." : "Save Profile Details"}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: SCORE & LEVEL */}
          {activeTab === "points" && (
            <form onSubmit={handleSavePointsAndLevel} className="flex flex-col gap-5 max-w-lg">
              {/* Score Breakdown Summary */}
              <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-black border border-white/15 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">NET SCORE</span>
                  <span className="text-xl font-bold text-white mt-1 block">{team.totalPoints || 0} pts</span>
                  <span className="text-[9px] text-slate-500">Official Standing</span>
                </div>
                <div className="border-x border-white/10">
                  <span className="text-[10px] text-slate-400 font-bold block">GROSS SOLVE MAX</span>
                  <span className="text-xl font-bold text-white mt-1 block">
                    {grossSolveMax} pts
                  </span>
                  <span className="text-[9px] text-slate-500">Max of Solved Cases</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">EFFICIENCY</span>
                  <span className="text-xl font-bold text-white mt-1 block">
                    {grossSolveMax > 0 ? Math.round(((team.totalPoints || 0) / grossSolveMax) * 100) : 100}%
                  </span>
                  <span className="text-[9px] text-slate-500">Score Realized</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-bold block mb-1">TOTAL POINTS OVERRIDE</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={totalPoints}
                    onChange={(e) => setTotalPoints(e.target.value)}
                    className="flex-1 p-3 rounded-xl bg-black border border-white/15 text-white font-bold text-lg outline-none focus:border-white"
                    min="0"
                  />
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => setTotalPoints((p) => Number(p) + 5)}
                      className="px-2.5 py-1 rounded bg-white/10 text-white font-bold text-xs hover:bg-white/20 cursor-pointer border border-white/15"
                    >
                      +5
                    </button>
                    <button
                      type="button"
                      onClick={() => setTotalPoints((p) => Math.max(0, Number(p) - 5))}
                      className="px-2.5 py-1 rounded bg-white/10 text-white font-bold text-xs hover:bg-white/20 cursor-pointer border border-white/15"
                    >
                      -5
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Directly sets the final net points for this team on both student UI and leaderboard.</p>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-bold block mb-1">SET ACTIVE CASE LEVEL</label>
                <select
                  value={currentLevel}
                  onChange={(e) => setCurrentLevel(e.target.value)}
                  className="w-full p-3 rounded-xl bg-black border border-white/15 text-white font-bold outline-none focus:border-white cursor-pointer"
                >
                  {LEVEL_LIST.map((l) => (
                    <option key={l.id} value={l.id} className="bg-black text-white">
                      {l.name} (Max {l.maxPts} pts)
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">Jumps the player team immediately to this case in their workbench.</p>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-white text-black font-bold cursor-pointer hover:bg-slate-200 transition-all disabled:opacity-50"
                >
                  {saving ? "Updating..." : "Save Score & Level Changes"}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: CASE TIMERS (TIME TAKEN & MANIPULATION) */}
          {activeTab === "timers" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div>
                  <span className="text-xs font-bold text-white">CASE DURATION & TIME TAKEN CONTROLLER</span>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    View actual time taken by this player per case and adjust time left or duration.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    LEVEL_LIST.forEach((l) => handleUpdateTimer(l.id, l.durationSeconds || 1200, l.durationSeconds || 1200));
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-[10px] cursor-pointer"
                >
                  Reset All to 20:00
                </button>
              </div>

              <div className="divide-y divide-white/5 border border-white/10 rounded-2xl overflow-hidden bg-black max-h-[50vh] overflow-y-auto">
                {LEVEL_LIST.map((lvl) => {
                  const tState = levelTimersState[lvl.id];
                  const dur = lvl.durationSeconds || tState?.duration || 1200;
                  const remaining = tState && tState.remainingSeconds !== undefined ? tState.remainingSeconds : dur;
                  const timeSpent = tState && tState.timeSpentSeconds !== undefined ? tState.timeSpentSeconds : Math.max(0, dur - remaining);
                  const isExpired = remaining <= 0;
                  const isSolved = !!progressMap[lvl.id]?.solved;

                  const inputMins = timerInputs[`${lvl.id}_m`] !== undefined ? timerInputs[`${lvl.id}_m`] : Math.floor(remaining / 60);
                  const inputSecs = timerInputs[`${lvl.id}_s`] !== undefined ? timerInputs[`${lvl.id}_s`] : remaining % 60;

                  return (
                    <div key={lvl.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.03]">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">{lvl.name}</span>
                          {isSolved && (
                            <span className="px-2 py-0.5 rounded bg-white/10 text-white text-[9px] font-bold border border-white/20">
                              SOLVED
                            </span>
                          )}
                          {isExpired && !isSolved && (
                            <span className="px-2 py-0.5 rounded bg-white/10 text-slate-400 text-[9px] font-bold border border-white/15">
                              EXPIRED (00:00)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-slate-300 mt-1 flex items-center gap-3">
                          <span>Time Taken: <strong className="text-white text-xs">{formatSeconds(timeSpent)}</strong></span>
                          <span className="text-slate-500">|</span>
                          <span>Time Left: <strong className="text-white text-xs">{formatSeconds(remaining)}</strong> <span className="text-slate-500">/ {formatSeconds(dur)}</span></span>
                        </div>
                      </div>

                      {/* Time Adjustment Controls */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Quick +/- Buttons */}
                        <button
                          type="button"
                          onClick={() => handleAdjustTimer(lvl.id, -120)}
                          className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-bold text-[10px] cursor-pointer border border-white/15"
                          title="Subtract 2 Minutes"
                        >
                          -2m
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdjustTimer(lvl.id, -300)}
                          className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-bold text-[10px] cursor-pointer border border-white/15"
                          title="Subtract 5 Minutes"
                        >
                          -5m
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdjustTimer(lvl.id, 120)}
                          className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-bold text-[10px] cursor-pointer border border-white/15"
                          title="Add 2 Minutes"
                        >
                          +2m
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdjustTimer(lvl.id, 300)}
                          className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-bold text-[10px] cursor-pointer border border-white/15"
                          title="Add 5 Minutes"
                        >
                          +5m
                        </button>

                        {/* Direct input */}
                        <div className="flex items-center gap-1 ml-1">
                          <input
                            type="number"
                            min="0"
                            max="99"
                            value={inputMins}
                            onChange={(e) => setTimerInputs((prev) => ({ ...prev, [`${lvl.id}_m`]: e.target.value }))}
                            className="w-10 p-1 rounded bg-black border border-white/20 text-white font-bold text-center text-xs outline-none"
                            placeholder="MM"
                          />
                          <span className="text-slate-500 font-bold">:</span>
                          <input
                            type="number"
                            min="0"
                            max="59"
                            value={inputSecs}
                            onChange={(e) => setTimerInputs((prev) => ({ ...prev, [`${lvl.id}_s`]: e.target.value }))}
                            className="w-10 p-1 rounded bg-black border border-white/20 text-white font-bold text-center text-xs outline-none"
                            placeholder="SS"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const m = parseInt(inputMins, 10) || 0;
                              const s = parseInt(inputSecs, 10) || 0;
                              handleUpdateTimer(lvl.id, m * 60 + s, dur);
                            }}
                            className="px-2.5 py-1 rounded bg-white text-black font-bold text-[10px] hover:bg-slate-200 cursor-pointer"
                          >
                            Set
                          </button>
                        </div>

                        {/* Reset / Expire */}
                        <button
                          type="button"
                          onClick={() => handleUpdateTimer(lvl.id, dur, dur)}
                          className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-slate-300 font-bold text-[10px] cursor-pointer border border-white/15"
                          title="Reset to Duration"
                        >
                          20m
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateTimer(lvl.id, 0, dur)}
                          className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-slate-400 font-bold text-[10px] cursor-pointer border border-white/15"
                          title="Expire Immediately (00:00)"
                        >
                          Expire
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: LEVEL PROGRESS MATRIX */}
          {activeTab === "matrix" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2">
                <span className="text-[11px] text-slate-400 font-bold">CASE PROGRESS MATRIX</span>
                <span className="text-[11px] text-white font-bold">
                  {Object.values(progressMap).filter((p) => p.solved).length} Solved / 13
                </span>
              </div>

              <div className="divide-y divide-white/5 border border-white/10 rounded-2xl overflow-hidden bg-black">
                {LEVEL_LIST.map((lvl) => {
                  const prog = progressMap[lvl.id] || { solved: false, points_awarded: 0 };
                  const isSolved = prog.solved;
                  return (
                    <div key={lvl.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-white/[0.03]">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={!!isSolved}
                          onChange={() => handleToggleLevelSolved(lvl.id, isSolved, lvl.maxPts)}
                          className="w-4 h-4 rounded accent-white cursor-pointer"
                        />
                        <div>
                          <div className={`font-bold ${isSolved ? "text-white" : "text-slate-400"}`}>
                            {lvl.name}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Base: {lvl.maxPts} pts {prog.solved_at && `• Solved ${new Date(prog.solved_at).toLocaleTimeString()}`}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">Pts:</span>
                        <input
                          type="number"
                          defaultValue={prog.points_awarded || 0}
                          onBlur={(e) => handleSetLevelPoints(lvl.id, e.target.value)}
                          className="w-16 p-1.5 rounded-lg bg-black border border-white/15 text-white font-bold text-center outline-none focus:border-white"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: DANGER ZONE */}
          {activeTab === "danger" && (
            <div className="flex flex-col gap-5 max-w-lg">
              <div className="p-4 rounded-2xl bg-black border border-white/20">
                <h4 className="text-xs font-bold text-white mb-1 flex items-center gap-2">
                  <RotateCcw size={14} />
                  <span>Reset Team Progress</span>
                </h4>
                <p className="text-[11px] text-slate-400 mb-3">
                  Wipes out all solved levels, unlocked hints, and resets total score to 0 on Level 1. Team account remains active.
                </p>
                <button
                  type="button"
                  onClick={handleResetTeam}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold cursor-pointer"
                >
                  Reset Team Progress
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-black border border-white/20">
                <h4 className="text-xs font-bold text-white mb-1 flex items-center gap-2">
                  <Trash2 size={14} />
                  <span>Delete Team Account</span>
                </h4>
                <p className="text-[11px] text-slate-400 mb-3">
                  Permanently deletes this team and all their historical records from the database.
                </p>
                <button
                  type="button"
                  onClick={handleDeleteTeam}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-white text-black font-bold cursor-pointer hover:bg-slate-200"
                >
                  Delete Team Permanently
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
