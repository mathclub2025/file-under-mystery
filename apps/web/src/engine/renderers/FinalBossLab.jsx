import React, { useState, useRef, useEffect } from "react";
import { Terminal, ShieldAlert, KeyRound, CheckCircle2, Lock, Radio, Trophy, ArrowRight, ShieldCheck, BookOpen, Layers, Award, Play, Pause, Volume2, VolumeX, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import { useGameStore } from "../../store/useGameStore.js";
import { useAuthStore } from "../../store/useAuthStore.js";

// The 12 levels in reverse assembly order
const LEVEL_TOKENS = [
  { id: "level1",  token: "A19X7", title: "L01: The Photograph" },
  { id: "level2",  token: "K4P82", title: "L02: The Voicemail" },
  { id: "level3",  token: "XT4Q1", title: "L03: Corridor Video" },
  { id: "level4",  token: "M77RB", title: "L04: Holiday Photo" },
  { id: "level5",  token: "P0W3R", title: "L05: Shredded Notes" },
  { id: "level6",  token: "NT2K5", title: "L06: Network PCAP" },
  { id: "level7",  token: "BXZ19", title: "L07: Harmonic Wave Superposition" },
  { id: "level9",  token: "EL7P9", title: "L08: Orbital Telemetry" },
  { id: "level8",  token: "FIN4L", title: "L09: 2D Fourier Dispersion" },
  { id: "level10", token: "R30S4", title: "L10: Rule 30 Lattice" },
  { id: "level11", token: "PH4Z3", title: "L11: Dual Transmission" },
  { id: "level12", token: "GR4PH", title: "L12: Chromatic Distance Vector" },
];

// Unified Subtitle Cues synced to the seamless single video
const MARROW_SUBTITLE_CUES = [
  { start: 0.0, end: 6.02, text: "If you are hearing this broadcast, the Marrow Conjecture is complete." },
  { start: 6.02, end: 14.02, text: "The harmonic projection theorem stands mathematically verified across all twelve physical and computational domains." },
  { start: 14.02, end: 20.03, text: "The truth could no longer remain inside the tower. I have crossed the perimeter." },
  { start: 20.03, end: 30.04, text: "They thought that by erasing my research servers and seizing my laboratory, they could silence the mathematics." },
  { start: 30.04, end: 40.04, text: "They failed to understand the fundamental law of information theory: truth is invariant under transformation." },
  { start: 40.04, end: 50.05, text: "I encoded the master decryption key into the very fabric of the campus—in hidden byte planes, Morse subcarriers, and residue primes..." },
  { start: 50.05, end: 58.05, text: "...in celestial coordinates, Rule 30 automata, and the chromatic distance vectors radiating from our clocktower." },
  { start: 58.05, end: 66.05, text: "To the investigative team who pieced together every fragment: you did not merely solve a mystery." },
  { start: 66.05, end: 76.05, text: "You proved that logic, geometry, and mathematics cannot be corrupted or suppressed." },
  { start: 76.05, end: 84.05, text: "The air-gapped uplink is now live. The proof is mirrored across the international academic archive." },
  { start: 84.05, end: 90.07, text: "Thank you, investigators. The beacon is awake." },
  { start: 90.07, end: 100.10, text: "Do not be deceived into thinking this case is closed. What you unlocked today was only the first harmonic node. The real game has only just begun. Stay vigilant." }
];

export default function FinalBossLab({ config }) {
  const { solvedLevels, markLevelSolved, getScore } = useGameStore();
  const { team } = useAuthStore();
  const [assembledKey, setAssembledKey] = useState("");
  const [isDecrypted, setIsDecrypted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // Single Unified Video Playback & Subtitle State
  const [videoEnded, setVideoEnded] = useState(false);
  const [currentSubtitle, setCurrentSubtitle] = useState(MARROW_SUBTITLE_CUES[0].text);
  const [isPlayingVideo, setIsPlayingVideo] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [activeTab, setActiveTab] = useState("dossier"); // 'dossier' | 'certificate'
  
  const videoRef = useRef(null);
  const finalScore = getScore();

  const handleDecryptUplink = (e) => {
    e.preventDefault();
    setErrorMsg("");

    const cleanInput = assembledKey.replace(/[^A-Za-z0-9]/g, "").toUpperCase();

    const validVariants = [
      "GR4PHPH4Z3R30S4FIN4LEL7P9BXZ19NT2K5P0W3RM77RBXT4Q1K4P82A19X7",
      "GR4PHPH4Z3R30S4EL7P9FIN4LBXZ19NT2K5P0W3RM77RBXT4Q1K4P82A19X7",
      "GR4PHPH4Z3R30S4FIN4LEL7P9BXZ19NT2K5POWEROFSEVENM77RBXT4Q1K4P82A19X7",
      "GR4PHPH4Z3R30S4EL7P9FIN4LBXZ19NT2K5POWEROFSEVENM77RBXT4Q1K4P82A19X7",
      "39175PH4Z3R30S4FIN4LEL7P9BXZ19NT2K5P0W3RM77RBXT4Q1K4P82A19X7",
      "39175PH4Z3R30S4EL7P9FIN4LBXZ19NT2K5P0W3RM77RBXT4Q1K4P82A19X7"
    ];

    if (validVariants.includes(cleanInput)) {
      setIsDecrypted(true);
      markLevelSolved("final");
      setVideoEnded(false);
    } else {
      setErrorMsg("INTEGRITY CHECK FAILED: The cryptographic tensor permutation is misaligned. Review the reverse sequence order (Level 12 down to Level 01).");
    }
  };

  // Video time update handler for bottom subtitles
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    const activeCue = MARROW_SUBTITLE_CUES.find((c) => time >= c.start && time < c.end);
    if (activeCue) {
      setCurrentSubtitle(activeCue.text);
    } else if (time >= 90.0) {
      setCurrentSubtitle(MARROW_SUBTITLE_CUES[MARROW_SUBTITLE_CUES.length - 1].text);
    }
  };

  const handleVideoEnded = () => {
    setVideoEnded(true);
    setIsPlayingVideo(false);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlayingVideo(true);
    } else {
      videoRef.current.pause();
      setIsPlayingVideo(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const replayVideo = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play();
    setIsPlayingVideo(true);
    setVideoEnded(false);
  };

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="flex flex-col gap-6 w-full select-none font-mono text-xs max-w-5xl mx-auto pb-8"
    >
      {/* Centered Evidence: Physical Drive Forensic Photo & Terminal */}
      {!isDecrypted && (
        <div className="flex flex-col items-center justify-center relative w-full">
          <div className="overflow-hidden rounded-2xl border border-white/15 shadow-2xl bg-black max-w-2xl w-full">
            <img
              src="/evidence/blackbox_drive.png"
              alt="Physical Blackbox Drive"
              draggable={false}
              className="w-full h-auto object-cover pointer-events-none"
            />
          </div>
        </div>
      )}

      {/* Hardware Key Assembly Interface or Video Broadcast */}
      <div className="rounded-2xl p-6 border border-white/15 bg-black flex flex-col gap-5 shadow-2xl">
        {!isDecrypted ? (
          <>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Terminal size={18} />
                <span>BLACKBOX HARDWARE BOOTSTRAP UPLINK</span>
              </div>
              <span className="px-3 py-1 rounded-lg bg-white/10 border border-white/20 text-white font-bold text-xs">
                12-STAGE INVERSE PERMUTATION
              </span>
            </div>

            <p className="text-slate-300 text-xs leading-relaxed">
              Dr. Marrow's air-gapped solid-state drive requires the 60-character reverse concatenated cryptographic key composed from all 12 forensic tokens assembled in reverse order (<span className="text-white font-bold">Level 12 &rarr; Level 01</span>).
            </p>

            {/* 12-Slot Vault Status Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
              {LEVEL_TOKENS.map((lvl) => {
                const isSolved = solvedLevels[lvl.id] !== undefined;
                return (
                  <div
                    key={lvl.id}
                    className={`p-2.5 rounded-xl border flex flex-col gap-1 transition-all ${
                      isSolved
                        ? "bg-white/10 border-white/30 text-white"
                        : "bg-white/5 border-white/10 text-slate-500"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span>{lvl.id.toUpperCase()}</span>
                      {isSolved ? <CheckCircle2 size={12} className="text-white" /> : <Lock size={12} />}
                    </div>
                    <div className="font-bold tracking-wider text-xs truncate">
                      {isSolved ? lvl.token : "•••••"}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Master Uplink Submission Form */}
            <form onSubmit={handleDecryptUplink} className="flex flex-col gap-3 pt-2">
              <div className="flex flex-col gap-1">
                <span className="text-slate-400 text-xs">Enter 60-Character Master Reverse Key:</span>
                <input
                  type="text"
                  value={assembledKey}
                  onChange={(e) => setAssembledKey(e.target.value)}
                  placeholder="ENTER 60-CHAR MASTER REVERSE KEY..."
                  className="w-full bg-black border border-white/20 focus:border-white rounded-xl px-4 py-3 text-white uppercase focus:outline-none transition-all font-bold tracking-widest text-xs"
                />
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl text-xs flex items-center gap-2">
                  <ShieldAlert size={16} /> {errorMsg}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 bg-white hover:bg-slate-200 text-black font-bold rounded-xl transition-all shadow-[0_0_25px_rgba(255,255,255,0.2)] cursor-pointer text-xs flex items-center justify-center gap-2"
              >
                <KeyRound size={16} /> TRANSMIT MASTER DECRYPTION UPLINK
              </button>
            </form>
          </>
        ) : (
          /* ========================================================================= */
          /* THE GRAND FINALE SEAMLESS VIDEO BROADCAST & MATHEMATICS CLUB LOGO WATERMARK*/
          /* ========================================================================= */
          <div className="flex flex-col gap-6 animate-fade-in">
            {/* VIDEO CINEMATIC CONTAINER WITH BOTTOM SUBTITLES & MATHS CLUB LOGO */}
            <div className="relative rounded-2xl overflow-hidden border border-white/20 bg-black aspect-video max-h-[500px] w-full flex items-center justify-center shadow-2xl group">
              {/* The Seamless Continuous Video with Muffled Old Professor Voice */}
              <video
                ref={videoRef}
                src="/marrow_full_broadcast.mp4"
                autoPlay
                playsInline
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleVideoEnded}
                className="w-full h-full object-cover"
              />

              {/* Top HUD Overlay (Clean, no segment counter) */}
              <div className="absolute top-4 left-4 flex items-center pointer-events-none z-20">
                <div className="px-3 py-1 rounded-xl bg-black/80 border border-white/20 text-white font-mono text-[10px] flex items-center gap-2 backdrop-blur">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                  <span>LIVE TRANSMISSION // DR. JULIAN MARROW</span>
                </div>
              </div>

              {/* Bottom-Right Watermark: Mathematics Club VIT Chennai Logo (Cleanly covering gemini icon) */}
              <div className="absolute bottom-3 right-3 md:bottom-4 md:right-4 z-30 pointer-events-none drop-shadow-[0_6px_20px_rgba(0,0,0,0.98)]">
                <img
                  src="/maths_club_logo.png"
                  alt="Mathematics Club VIT Chennai"
                  className="w-20 h-20 md:w-24 md:h-24 object-contain"
                />
              </div>

              {/* Dynamic Bottom Subtitle Bar (Anchored at the Bottom) */}
              <div className="absolute bottom-14 left-6 right-6 flex justify-center pointer-events-none z-20">
                <div className="px-5 py-2.5 rounded-xl bg-black/90 border border-white/30 text-white font-sans text-xs md:text-sm text-center shadow-2xl backdrop-blur max-w-2xl leading-relaxed animate-fade-in font-medium">
                  {currentSubtitle}
                </div>
              </div>

              {/* Bottom Video Controls Overlay */}
              <div className="absolute bottom-3 left-4 right-18 flex items-center justify-between z-30 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-4 py-2 rounded-xl border border-white/15 backdrop-blur">
                <div className="flex items-center gap-3">
                  <button
                    onClick={togglePlay}
                    className="p-1 text-white hover:text-slate-300 cursor-pointer"
                    title={isPlayingVideo ? "Pause" : "Play"}
                  >
                    {isPlayingVideo ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  <button
                    onClick={replayVideo}
                    className="p-1 text-slate-400 hover:text-white cursor-pointer"
                    title="Replay Full Broadcast"
                  >
                    <RotateCcw size={15} />
                  </button>
                  <button
                    onClick={toggleMute}
                    className="p-1 text-slate-400 hover:text-white cursor-pointer"
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {videoEnded ? "BROADCAST COMPLETE" : "BROADCAST ACTIVE"}
                  </span>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* POST-VIDEO REVELATION: DOSSIER & COMPLETION CERTIFICATE                   */}
            {/* (Revealed when the seamless broadcast concludes)                         */}
            {/* ========================================================================= */}
            {videoEnded && (
              <div className="flex flex-col gap-6 animate-fade-in pt-2">
                {/* Navigation Tabs for Post-Video Dossier */}
                <div className="flex border-b border-white/10 gap-2">
                  <button
                    onClick={() => setActiveTab("dossier")}
                    className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "dossier"
                        ? "border-white text-white bg-white/5"
                        : "border-transparent text-slate-400 hover:text-white"
                    }`}
                  >
                    <BookOpen size={14} /> Declassified Case Dossier (The Truth)
                  </button>
                  <button
                    onClick={() => setActiveTab("certificate")}
                    className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "certificate"
                        ? "border-white text-white bg-white/5"
                        : "border-transparent text-slate-400 hover:text-white"
                    }`}
                  >
                    <Award size={14} /> Official Resolution Certificate
                  </button>
                </div>

                {/* TAB 1: DECLASSIFIED CASE DOSSIER */}
                {activeTab === "dossier" && (
                  <div className="p-6 bg-black rounded-2xl border border-white/15 flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2 text-white font-bold text-xs">
                        <Layers size={14} />
                        <span>FORENSIC DOSSIER // THE 12 UNIFIED DOMAINS</span>
                      </div>
                      <span className="text-slate-400 text-[10px]">CASE CLOSED FILE #2026-MATH</span>
                    </div>

                    <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex flex-col gap-1 font-mono text-xs">
                      <span className="text-slate-400 text-[10px]">FINAL ENCRYPTED SIGN-OFF FLAG:</span>
                      <span className="text-white font-bold tracking-widest text-sm">
                        FLAG&#123;THE_BEACON_IS_AWAKE_MARROW_SAFE&#125;
                      </span>
                      <span className="text-slate-400 text-[10px] mt-1">Status: Julian Marrow confirmed safe in undisclosed neutral jurisdiction. Proof mirrored worldwide.</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex flex-col gap-1">
                        <strong className="text-white">Phase I: Optical & Acoustic Traces (L01 - L04)</strong>
                        <span className="text-slate-400 text-[11px]">
                          Raw forest gamma shifts, 2400Hz Morse subcarrier audio, shadow differential Base64 strings, and multi-channel LSB bitplanes.
                        </span>
                      </div>

                      <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex flex-col gap-1">
                        <strong className="text-white">Phase II: Algebraic & Superposition Logic (L05 - L08)</strong>
                        <span className="text-slate-400 text-[11px]">
                          Prime residue modular arithmetic on shredded notes, outlier network PCAP packets, continuous waveform superpositions, and astrometric coordinate triangulation.
                        </span>
                      </div>

                      <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex flex-col gap-1">
                        <strong className="text-white">Phase III: Signal & Spatial Manifolds (L09 - L12)</strong>
                        <span className="text-slate-400 text-[11px]">
                          2D Fourier spatial frequency resonance, Rule 30 computational lattice seeds, 180° inverted stereo phase extraction, and 3D Euclidean chromatic vectors across VIT Chennai.
                        </span>
                      </div>

                      <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex flex-col gap-1">
                        <strong className="text-white">Phase IV: The Reverse Master Bootstrap (Final Boss)</strong>
                        <span className="text-slate-400 text-[11px]">
                          Synthesizing the 12-step reverse permutation [Level 12 &rarr; Level 01] to unlock the solid-state blackbox drive and broadcast the final proof.
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: OFFICIAL INVESTIGATION RESOLUTION CERTIFICATE */}
                {activeTab === "certificate" && (
                  <div className="p-8 bg-black rounded-2xl border-2 border-white/30 flex flex-col items-center justify-center text-center gap-4 relative overflow-hidden shadow-2xl">
                    <div className="w-16 h-16 rounded-2xl bg-white text-black flex items-center justify-center shadow-lg">
                      <Trophy size={32} />
                    </div>

                    <div className="flex flex-col gap-1 max-w-lg">
                      <span className="text-slate-400 text-[10px] tracking-widest uppercase">
                        DEPARTMENT OF MATHEMATICAL SCIENCES // FORENSIC OPERATIONS
                      </span>
                      <h3 className="text-lg font-bold text-white tracking-wider">
                        OFFICIAL CERTIFICATE OF INVESTIGATION COMPLETION
                      </h3>
                    </div>

                    <div className="w-full max-w-md p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-2 font-mono text-xs text-left">
                      <div className="flex justify-between border-b border-white/5 pb-1">
                        <span className="text-slate-400">OPERATING TEAM:</span>
                        <span className="text-white font-bold">{team?.teamName || "Forensic Unit Alpha"}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-1">
                        <span className="text-slate-400">REGISTRATION:</span>
                        <span className="text-white font-bold">{team?.regNo || "23BCE1000"}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-1">
                        <span className="text-slate-400">EVIDENCE SECURED:</span>
                        <span className="text-white font-bold">12 / 12 TOKENS + MASTER BOOTSTRAP</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">FINAL MERIT SCORE:</span>
                        <span className="text-white font-bold text-sm">{finalScore} PTS</span>
                      </div>
                    </div>

                    <p className="text-slate-400 text-[11px] max-w-md font-sans leading-relaxed">
                      This certifies that the above investigative team has successfully deconstructed all 12 mathematical forensic domains, resolved Dr. Marrow's disappearance, and decrypted the blackbox terminal.
                    </p>
                  </div>
                )}

                {/* Bottom Action Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-white/10">
                  <Link
                    to="/board"
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    &larr; Revisit Case Board & Vault
                  </Link>

                  <Link
                    to="/leaderboard"
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white hover:bg-slate-200 text-black font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_25px_rgba(255,255,255,0.3)] cursor-pointer"
                  >
                    <span>View Official Final Leaderboard</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
