import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Terminal,
  Shield,
  ArrowRight,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  UserPlus,
  Trash2,
  LogIn,
  AlertCircle,
  CheckCircle2,
  Users
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore.js";
import { useGameStore } from "../store/useGameStore.js";
import { apiRegisterTeam, apiLoginTeam } from "../lib/api.js";
import { notifyAudioPlay, notifyAudioPause, notifyAudioEnded } from "../lib/audioManager.js";

const STORY_LINES = [
  "August 25, 2026. Department of Mathematics.",
  "Dr. Elias Marrow, Senior Faculty in Theoretical Mathematics, has vanished.",
  "His campus office in Room 418 was found completely deserted.",
  "For twenty-four years, Marrow was the quiet pillar of mathematical rigor.",
  "Eight months ago, he formulated what colleagues termed The Marrow Conjecture.",
  "He claimed prime distributions and entropy were not chaotic anomalies...",
  "But deterministic harmonic projections of a single unified matrix transformation.",
  "In the wrong hands, his equations could collapse global asymmetric encryption.",
  "On the night of his disappearance, campus cameras tracked him into the perimeter woods.",
  "In Room 418, all chalkboards had been scrubbed clean.",
  "On his desk sat a single air-gapped solid-state drive labeled BLACKBOX.DAT.",
  "Standard recovery tools failed. The drive refused master decryption keys.",
  "Its firmware broadcasted a single message: A proof is not given; it is earned.",
  "The drive has released twelve encrypted pieces of mathematical and forensic evidence.",
  "Along with each evidence artifact comes an encrypted fragment from his lost handwritten diary.",
  "No single fragment can be solved in isolation.",
  "Your team has been authorized as the official Forensics Unit.",
  "Level 01: The Photograph has been decrypted and is ready for inspection."
];

export default function PrologueScreen({ onStartInvestigation }) {
  const navigate = useNavigate();
  const { team, setTeam } = useAuthStore();

  // Screen State: 'auth' | 'cinema'
  const [screenStep, setScreenStep] = useState("auth");
  // Auth Tab Mode: 'register' | 'login'
  const [authMode, setAuthMode] = useState("register");

  // Registration Form State
  const [teamName, setTeamName] = useState("");
  const [captainName, setCaptainName] = useState("");
  const [captainRegNo, setCaptainRegNo] = useState("");
  const [members, setMembers] = useState([]); // [{ id, name, regNo }] (max 2 additional members -> max 3 total including captain)

  // Login Form State
  const [loginTeamName, setLoginTeamName] = useState("");
  const [loginCaptainRegNo, setLoginCaptainRegNo] = useState("");

  // Feedback State
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Cinematic Engine State
  const [activeLineIdx, setActiveLineIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const audioRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("mystery_team_session");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTeam(parsed);
      } catch (e) {}
    }
  }, [setTeam]);

  // Add a new dynamic team member row (max 2 additional members -> max 3 total including captain)
  const handleAddMember = () => {
    if (members.length >= 2) return;
    setMembers((prev) => [
      ...prev,
      { id: Date.now().toString(), name: "", regNo: "" }
    ]);
  };

  // Remove a dynamic team member row
  const handleRemoveMember = (id) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  // Update member field values
  const handleMemberChange = (id, field, value) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  // Helper to load registered teams database from localStorage
  const getRegisteredTeams = () => {
    try {
      const stored = localStorage.getItem("mystery_registered_teams");
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  };

  // Handle Team Registration
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const cleanTeamName = teamName.trim();
    const cleanCaptainName = captainName.trim();
    const cleanCaptainRegNo = captainRegNo.trim().toUpperCase();

    if (cleanTeamName.toLowerCase() === "admin") {
      setErrorMessage("This team identifier is reserved.");
      return;
    }

    if (!cleanTeamName || !cleanCaptainName || !cleanCaptainRegNo) {
      setErrorMessage("Please complete Team Name, Captain Name, and Captain Reg No.");
      return;
    }

    const cleanMembers = members
      .map((m) => ({
        name: m.name.trim(),
        regNo: m.regNo.trim().toUpperCase()
      }))
      .filter((m) => m.name !== "" || m.regNo !== "");

    for (let i = 0; i < cleanMembers.length; i++) {
      if (!cleanMembers[i].name || !cleanMembers[i].regNo) {
        setErrorMessage(`Please provide both Name and Reg No for Member #${i + 1}`);
        return;
      }
    }

    setSuccessMessage("Saving...");

    const teamData = {
      teamName: cleanTeamName,
      captainName: cleanCaptainName,
      captainRegNo: cleanCaptainRegNo,
      regNo: cleanCaptainRegNo,
      members: cleanMembers,
      registeredAt: new Date().toISOString()
    };

    // Save to Supabase
    try {
      const dbTeam = await apiRegisterTeam(teamData);
      if (dbTeam && dbTeam.id) {
        teamData.id = dbTeam.id;
        teamData.total_points = dbTeam.total_points || 0;
      }
    } catch (err) {
      console.warn("DB save warning:", err);
    }

    const existingTeams = getRegisteredTeams();
    const updatedTeams = existingTeams.filter(
      (t) =>
        t.teamName.toLowerCase() !== cleanTeamName.toLowerCase() &&
        t.captainRegNo.toLowerCase() !== cleanCaptainRegNo.toLowerCase()
    );
    updatedTeams.push(teamData);
    localStorage.setItem("mystery_registered_teams", JSON.stringify(updatedTeams));

    localStorage.setItem("mystery_team_session", JSON.stringify(teamData));
    setTeam(teamData);
    useGameStore.getState().resetGameState();

    setSuccessMessage("Saving...");
    setTimeout(() => {
      setScreenStep("cinema");
      setActiveLineIdx(0);
      setIsPlaying(true);
    }, 500);
  };

  // Handle Team Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const cleanTeamName = loginTeamName.trim();
    const rawCaptainRegNo = loginCaptainRegNo.trim();
    const cleanCaptainRegNo = rawCaptainRegNo.toUpperCase();

    if (!cleanTeamName || !rawCaptainRegNo) {
      setErrorMessage("Please provide both Team Name and Captain Reg No.");
      return;
    }

    // RBAC Admin Login Check (support all-caps FILEUNDERMYSTERY@03)
    if (cleanTeamName.toLowerCase() === "admin") {
      if (cleanCaptainRegNo === "FILEUNDERMYSTERY@03") {
        const adminObj = {
          id: "admin",
          teamName: "admin",
          captainName: "Administrator",
          captainRegNo: "ADMIN",
          regNo: "ADMIN",
          role: "admin",
          isAdmin: true,
          members: [],
          total_points: 0,
          current_level: "level1"
        };
        localStorage.setItem("mystery_team_session", JSON.stringify(adminObj));
        setTeam(adminObj);
        setSuccessMessage("Authorizing Command Unit...");
        setTimeout(() => {
          navigate("/admin");
        }, 400);
        return;
      } else {
        setErrorMessage("Invalid credentials provided for this team.");
        return;
      }
    }

    setSuccessMessage("Saving...");

    // Try Supabase first
    try {
      const dbRes = await apiLoginTeam({
        teamName: cleanTeamName,
        captainRegNo: cleanCaptainRegNo
      });

      if (dbRes && dbRes.team) {
        if (dbRes.isAdmin || dbRes.team.role === "admin") {
          const adminObj = {
            id: "admin",
            teamName: "admin",
            captainName: "Administrator",
            captainRegNo: "ADMIN",
            regNo: "ADMIN",
            role: "admin",
            isAdmin: true,
            members: [],
            total_points: 0,
            current_level: "level1"
          };
          localStorage.setItem("mystery_team_session", JSON.stringify(adminObj));
          setTeam(adminObj);
          setSuccessMessage("Authorizing Command Unit...");
          setTimeout(() => {
            navigate("/admin");
          }, 400);
          return;
        }

        const teamObj = {
          id: dbRes.team.id,
          teamName: dbRes.team.team_name,
          captainName: dbRes.team.captain_name || "Lead Investigator",
          captainRegNo: dbRes.team.captain_reg_no || cleanCaptainRegNo,
          regNo: dbRes.team.captain_reg_no || cleanCaptainRegNo,
          members: dbRes.team.members || [],
          total_points: dbRes.team.total_points || 0,
          current_level: dbRes.team.current_level || "level1"
        };

        localStorage.setItem("mystery_team_session", JSON.stringify(teamObj));
        setTeam(teamObj);
        await useGameStore.getState().loadRemoteTeamProgress(teamObj.id);
        const targetLevel = useGameStore.getState().getActiveLevelId() || teamObj.current_level || "level1";

        setSuccessMessage("Saving...");
        setTimeout(() => {
          navigate(`/investigate/${targetLevel}`);
        }, 500);
        return;
      }
    } catch (err) {
      console.warn("DB login error, checking local session:", err);
    }

    // Fallback to local storage
    const registeredTeams = getRegisteredTeams();
    const matchedTeam = registeredTeams.find(
      (t) =>
        t.teamName.toLowerCase() === cleanTeamName.toLowerCase() &&
        (t.captainRegNo.toUpperCase() === cleanCaptainRegNo || t.regNo.toUpperCase() === cleanCaptainRegNo)
    );

    if (matchedTeam) {
      localStorage.setItem("mystery_team_session", JSON.stringify(matchedTeam));
      setTeam(matchedTeam);
      const targetLevel = useGameStore.getState().getActiveLevelId() || "level1";
      setSuccessMessage("Saving...");
      setTimeout(() => {
        navigate(`/investigate/${targetLevel}`);
      }, 500);
    } else {
      const fallbackTeam = {
        teamName: cleanTeamName,
        captainName: "Lead Investigator",
        captainRegNo: cleanCaptainRegNo,
        regNo: cleanCaptainRegNo,
        members: [],
        registeredAt: new Date().toISOString()
      };
      // Attempt to register in db
      try {
        const dbTeam = await apiRegisterTeam(fallbackTeam);
        if (dbTeam && dbTeam.id) {
          fallbackTeam.id = dbTeam.id;
        }
      } catch (e) {}

      localStorage.setItem("mystery_team_session", JSON.stringify(fallbackTeam));
      setTeam(fallbackTeam);
      const targetLevel = useGameStore.getState().getActiveLevelId() || "level1";
      setSuccessMessage("Saving...");
      setTimeout(() => {
        navigate(`/investigate/${targetLevel}`);
      }, 500);
    }
  };

  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Load and play audio when activeLineIdx changes or cinema screen starts
  useEffect(() => {
    if (screenStep !== "cinema") {
      if (audioRef.current) {
        audioRef.current.pause();
        notifyAudioPause();
        audioRef.current = null;
      }
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      notifyAudioPause();
      audioRef.current = null;
    }

    const audioUrl = `/audio/prologue_${activeLineIdx}.mp3`;
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.onended = () => {
      notifyAudioEnded();
      if (isPlayingRef.current) {
        setActiveLineIdx((prev) => {
          if (prev < STORY_LINES.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }
    };

    audio.onerror = () => {
      notifyAudioEnded();
      if (isPlayingRef.current) {
        setTimeout(() => {
          if (isPlayingRef.current) {
            setActiveLineIdx((prev) => (prev < STORY_LINES.length - 1 ? prev + 1 : prev));
          }
        }, 2800);
      }
    };

    if (isPlaying && voiceEnabled) {
      audio.play().then(() => {
        notifyAudioPlay();
      }).catch(() => {});
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        notifyAudioPause();
      }
    };
  }, [screenStep, activeLineIdx, voiceEnabled]);

  const handlePrevLine = () => {
    if (audioRef.current) audioRef.current.pause();
    setActiveLineIdx((prev) => Math.max(0, prev - 1));
  };

  const handleNextLine = () => {
    if (audioRef.current) audioRef.current.pause();
    if (activeLineIdx < STORY_LINES.length - 1) {
      setActiveLineIdx((prev) => prev + 1);
    } else {
      handleEnterLab();
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
        notifyAudioPause();
      }
    } else {
      setIsPlaying(true);
      if (audioRef.current) {
        if (voiceEnabled) {
          audioRef.current.play().then(() => {
            notifyAudioPlay();
          }).catch(() => {});
        }
      }
    }
  };

  const handleEnterLab = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      notifyAudioPause();
    }
    if (onStartInvestigation) onStartInvestigation();
    const target = useGameStore.getState().getActiveLevelId() || "level1";
    navigate(`/investigate/${target}`);
  };

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="w-full h-full flex items-center justify-center select-none font-mono px-3"
    >
      {/* Background Looping Atmospheric Script Video for Cinema mode */}
      {screenStep === "cinema" && (
        <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
          <video
            src="/script_bg/prologue.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-40 brightness-40 contrast-125 scale-105"
          />
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
        </div>
      )}

      {screenStep === "auth" ? (
        /* FULL-SIZED PROMINENT AUTHENTICATION CARD (ZERO PADDING BLOAT) */
        <div className="w-full max-w-lg relative z-10 animate-rise-up flex flex-col items-center gap-3">
          {/* Pure Full-Sized Mathematics Club Official Logo */}
          <div className="flex flex-col items-center text-center gap-1.5">
            <img
              src="/maths_club_logo.png"
              alt="VIT Mathematics Club"
              className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-[0_4px_25px_rgba(0,0,0,0.85)] filter brightness-105 select-none pointer-events-none"
            />
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-wider text-white">
                FILE UNDER MYSTERY
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-400 font-mono tracking-widest uppercase mt-0.5">
                VIT Mathematics Club // Forensics Authentication
              </p>
            </div>
          </div>

          {/* Auth Tab Switcher */}
          <div className="w-full grid grid-cols-2 p-1 bg-black/80 border border-white/20 rounded-2xl backdrop-blur-md">
            <button
              type="button"
              onClick={() => {
                setAuthMode("register");
                setErrorMessage("");
                setSuccessMessage("");
              }}
              className={`py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                authMode === "register"
                  ? "bg-white text-black shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Shield size={14} />
              <span>REGISTER TEAM</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode("login");
                setErrorMessage("");
                setSuccessMessage("");
              }}
              className={`py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                authMode === "login"
                  ? "bg-white text-black shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <LogIn size={14} />
              <span>LOGIN</span>
            </button>
          </div>

          {/* Alert Messages */}
          {errorMessage && (
            <div className="w-full p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2 animate-fade-in font-bold">
              <AlertCircle size={14} className="shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="w-full p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in font-bold">
              <CheckCircle2 size={14} className="shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* FORM CONTAINER */}
          <div className="w-full bg-black/90 border border-white/20 rounded-3xl p-5 shadow-2xl backdrop-blur-xl flex flex-col gap-3.5">
            {authMode === "register" ? (
              /* 1. REGISTRATION FORM */
              <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-3 text-xs font-mono">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-300 mb-1 font-bold">
                    Team Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="e.g. Vector Space Cowboys"
                    className="w-full bg-black border border-white/20 focus:border-white rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none transition-all font-mono text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-slate-300 mb-1 font-bold">
                      Team Captain Name *
                    </label>
                    <input
                      required
                      type="text"
                      value={captainName}
                      onChange={(e) => setCaptainName(e.target.value)}
                      placeholder="e.g. Alex Kumar"
                      className="w-full bg-black border border-white/20 focus:border-white rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none transition-all font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-slate-300 mb-1 font-bold">
                      Captain Reg No *
                    </label>
                    <input
                      required
                      type="text"
                      value={captainRegNo}
                      onChange={(e) => setCaptainRegNo(e.target.value)}
                      placeholder="e.g. 23BCE1042"
                      className="w-full bg-black border border-white/20 focus:border-white rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none transition-all font-mono text-xs uppercase"
                    />
                  </div>
                </div>

                {/* DYNAMIC TEAM MEMBERS SECTION (MAX 3 MEMBERS INCLUDING CAPTAIN) */}
                <div className="pt-2 border-t border-white/10 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                      <Users size={13} className="text-cyan-400" />
                      Additional Members ({members.length}/2) &bull; Max 3 Total
                    </span>

                    {members.length < 2 && (
                      <button
                        type="button"
                        onClick={handleAddMember}
                        className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/20 text-slate-200 hover:text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <UserPlus size={12} className="text-cyan-400" />
                        <span>+ Add Member</span>
                      </button>
                    )}
                  </div>

                  {members.map((member, idx) => (
                    <div
                      key={member.id}
                      className="w-full flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center animate-fade-in"
                    >
                      <div className="flex-1">
                        <input
                          type="text"
                          required
                          value={member.name}
                          onChange={(e) => handleMemberChange(member.id, "name", e.target.value)}
                          placeholder={`Member #${idx + 1} Name`}
                          className="w-full bg-black border border-white/20 focus:border-white rounded-xl px-3.5 py-2 text-white placeholder:text-slate-600 text-xs focus:outline-none transition-all font-mono"
                        />
                      </div>

                      <div className="flex-1">
                        <input
                          type="text"
                          required
                          value={member.regNo}
                          onChange={(e) => handleMemberChange(member.id, "regNo", e.target.value)}
                          placeholder={`Member #${idx + 1} Reg No (e.g. 23BCE1099)`}
                          className="w-full bg-black border border-white/20 focus:border-white rounded-xl px-3.5 py-2 text-white placeholder:text-slate-600 text-xs uppercase focus:outline-none transition-all font-mono"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member.id)}
                        className="p-2 bg-black hover:bg-rose-950/60 border border-rose-500/30 hover:border-rose-500/60 text-rose-400 rounded-xl cursor-pointer transition-all flex items-center justify-center shrink-0"
                        title="Remove Member"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}

                  {members.length === 0 && (
                    <p className="text-[10px] text-slate-500 italic">
                      No additional members added. (Max 3 investigators per team including Captain).
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="mt-1 w-full py-3.5 bg-white hover:bg-slate-200 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.25)] flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <Shield size={15} />
                  <span>INITIALIZE INVESTIGATION PROTOCOL</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </form>
            ) : (
              /* 2. LOGIN FORM */
              <form onSubmit={handleLoginSubmit} className="flex flex-col gap-3.5 text-xs font-mono">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-300 mb-1 font-bold">
                    Registered Team Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={loginTeamName}
                    onChange={(e) => setLoginTeamName(e.target.value)}
                    placeholder="e.g. Vector Space Cowboys"
                    className="w-full bg-black border border-white/20 focus:border-white rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none transition-all font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-300 mb-1 font-bold">
                    Team Captain Reg No *
                  </label>
                  <input
                    required
                    type="text"
                    value={loginCaptainRegNo}
                    onChange={(e) => setLoginCaptainRegNo(e.target.value)}
                    placeholder="e.g. 23BCE1042"
                    className="w-full bg-black border border-white/20 focus:border-white rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none transition-all font-mono text-xs uppercase"
                  />
                </div>

                <button
                  type="submit"
                  className="mt-1 w-full py-3.5 bg-white hover:bg-slate-200 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.25)] flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <LogIn size={15} />
                  <span>AUTHENTICATE & ENTER CASE BOARD</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </form>
            )}
          </div>
        </div>
      ) : (
        /* PURE FULLSCREEN CINEMATIC STORY OVER LOOPING VIDEO BACKGROUND */
        <div className="w-full max-w-6xl min-h-[85vh] flex flex-col justify-between py-6 sm:py-8 px-4 sm:px-6 animate-rise-up relative z-10">
          {/* Top Audio Toggle */}
          <div className="flex justify-end">
            <button
              onClick={() => {
                if (voiceEnabled && audioRef.current) audioRef.current.pause();
                setVoiceEnabled(!voiceEnabled);
              }}
              className="p-2 rounded-xl bg-black/60 border border-white/10 hover:bg-white/15 text-slate-300 hover:text-white transition-all flex items-center gap-2 text-xs font-mono cursor-pointer backdrop-blur"
            >
              {voiceEnabled ? <Volume2 size={16} className="text-white" /> : <VolumeX size={16} className="text-slate-500" />}
              <span className="hidden sm:inline">{voiceEnabled ? "Voice Narrator: ON" : "Voice Narrator: OFF"}</span>
            </button>
          </div>

          {/* LARGE CINEMATIC STORY TEXT VIEWPORT */}
          <div className="relative h-[280px] sm:h-[320px] flex items-center justify-center overflow-hidden my-auto w-full">
            <div className="w-full flex flex-col items-center justify-center relative">
              {STORY_LINES.map((line, idx) => {
                const isCurrent = idx === activeLineIdx;
                const isNext = idx === activeLineIdx + 1;

                if (idx > activeLineIdx + 1) return null;

                return (
                  <div
                    key={idx}
                    className="text-center font-mono transition-all duration-500 ease-out absolute w-full px-4 sm:px-6 max-w-5xl"
                    style={{
                      transform: isCurrent
                        ? "translateY(0px) scale(1)"
                        : isNext
                        ? "translateY(80px) scale(0.94)"
                        : "translateY(-80px) scale(0.92)",
                      opacity: isCurrent ? 1 : isNext ? 0.35 : 0,
                      filter: isCurrent ? "blur(0px)" : isNext ? "blur(5px)" : "blur(10px)",
                      color: isCurrent ? "#FFFFFF" : isNext ? "#94A3B8" : "#475569",
                      fontWeight: isCurrent ? 700 : 400,
                      fontSize: isCurrent ? "clamp(18px, 4vw, 30px)" : "clamp(14px, 3vw, 22px)",
                      lineHeight: "1.5",
                      textShadow: isCurrent ? "0 0 30px rgba(0,0,0,0.9), 0 2px 10px rgba(0,0,0,0.9)" : "none",
                      pointerEvents: "none"
                    }}
                  >
                    "{line}"
                  </div>
                );
              })}
            </div>
          </div>

          {/* MINIMAL BOTTOM CONTROLS (Centered Action Button) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-3 border-t border-white/10 pt-4 sm:pt-6 font-mono text-xs">
            <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3">
              <button
                onClick={handlePrevLine}
                disabled={activeLineIdx === 0}
                className="p-2 sm:p-2.5 rounded-xl bg-black/60 border border-white/10 hover:bg-white/15 disabled:opacity-30 disabled:pointer-events-none text-white transition-all cursor-pointer backdrop-blur"
                title="Previous Line"
              >
                <ChevronLeft size={16} />
              </button>

              <button
                onClick={togglePlay}
                className="px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-white text-black font-bold flex items-center gap-1.5 hover:bg-slate-200 transition-all cursor-pointer shadow-xl text-xs"
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                <span>{isPlaying ? "Pause" : "Play"}</span>
              </button>

              <button
                onClick={handleNextLine}
                className="p-2 sm:p-2.5 rounded-xl bg-black/60 border border-white/10 hover:bg-white/15 text-white transition-all cursor-pointer backdrop-blur"
                title="Next Line"
              >
                <ChevronRight size={16} />
              </button>

              <span className="text-slate-400 text-[10px] sm:text-[11px] ml-1 bg-black/40 px-2 py-1 rounded-lg border border-white/5 whitespace-nowrap">
                {activeLineIdx + 1}/{STORY_LINES.length}
              </span>
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleEnterLab}
                className="px-6 py-2.5 bg-white hover:bg-slate-200 text-black font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_25px_rgba(255,255,255,0.25)] text-xs uppercase tracking-wider whitespace-nowrap"
              >
                <span>Enter Laboratory &rarr;</span>
              </button>
            </div>

            <div className="hidden sm:block"></div>
          </div>
        </div>
      )}
    </div>
  );
}
