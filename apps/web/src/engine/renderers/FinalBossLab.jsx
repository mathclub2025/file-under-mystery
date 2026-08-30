import React, { useState, useRef, useEffect } from "react";
import { Terminal, ShieldAlert, KeyRound, CheckCircle2, Lock, Radio, Trophy, ArrowRight, ShieldCheck, BookOpen, Layers, Award, Play, Pause, Volume2, VolumeX, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import { useGameStore } from "../../store/useGameStore.js";
import { useAuthStore } from "../../store/useAuthStore.js";

// The 12 levels in reverse assembly order
// The 12 levels in reverse assembly order
const LEVEL_TOKENS_ODD = [
  { id: "level1",  title: "L01: The Photograph" },
  { id: "level3",  title: "L03: Corridor Video" },
  { id: "level5",  title: "L05: Shredded Notes" },
  { id: "level7",  title: "L07: Harmonic Waves" },
  { id: "level9",  title: "L09: Celestial Astrometry" },
  { id: "level11", title: "L11: Dual Transmission" },
];

const LEVEL_TOKENS_EVEN = [
  { id: "level2",  title: "L02: The Voicemail" },
  { id: "level4",  title: "L04: Holiday Photo" },
  { id: "level6",  title: "L06: Network PCAP" },
  { id: "level8",  title: "L08: 2D Fourier Dispersion" },
  { id: "level10", title: "L10: Rule 30 Lattice" },
  { id: "level12", title: "L12: Chromatic Distance Vector" },
];

const PROFESSOR_FRAGMENTS = [
  { id: "level1",  num: "01", wordIndex: 1,  title: "The Photograph", note: "Mirrors in the dark hold what the eye misses. Pull the exposure out of the shadows." },
  { id: "level2",  num: "02", wordIndex: 2,  title: "The Voicemail", note: "The acoustic carrier tone was hidden underneath the human voice all along." },
  { id: "level3",  num: "03", wordIndex: 3,  title: "Corridor Video", note: "A sudden rhythm in the surveillance frames kept time when the lens glitched." },
  { id: "level4",  num: "04", wordIndex: 4,  title: "Holiday Photo", note: "In the quiet records, the lowest bitplane remembers what color hid." },
  { id: "level5",  num: "05", wordIndex: 5,  title: "Shredded Notes", note: "When numbers fold into one another, prime moduli never lose their origin." },
  { id: "level6",  num: "06", wordIndex: 6,  title: "Network PCAP", note: "Two envelopes folded around the wayfarer could not conceal the road's tail." },
  { id: "level7",  num: "07", wordIndex: 7,  title: "Harmonic Waves", note: "When five standing waves meet in balance, the phosphor draws the letters." },
  { id: "level8",  num: "08", wordIndex: 8,  title: "2D Fourier", note: "In the frequency domain every speck finds equilibrium along its own radial orbit." },
  { id: "level9",  num: "09", wordIndex: 9,  title: "Astrometry", note: "The constellations never shift but five coordinates reveal astronomical beacons in the deep sky." },
  { id: "level10", num: "10", wordIndex: 10, title: "Rule 30 Lattice", note: "Beneath the tapestry of chaos every cellular row must conform to its ancestral seed." },
  { id: "level11", num: "11", wordIndex: 11, title: "Dual Audio Phase", note: "Inverting the stereo channel nullifies masking noise when added in opposite phase to expose the voice." },
  { id: "level12", num: "12", wordIndex: 12, title: "Campus Topology", note: "Traversing every corridor once without retracing steps connects each checkpoint to next perimeter gate." },
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
  const { solvedLevels, markLevelSolved, getScore, getEarnablePoints, isLevelSolved, levelScores } = useGameStore();
  const { team } = useAuthStore();
  const [protocol1Key, setProtocol1Key] = useState("");
  const [protocol2Key, setProtocol2Key] = useState("");
  const [protocol1Verified, setProtocol1Verified] = useState(false);
  const [protocol2Verified, setProtocol2Verified] = useState(false);
  
  const solved = isLevelSolved("final");
  const [isDecrypted, setIsDecrypted] = useState(solved);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [activeLedgerTab, setActiveLedgerTab] = useState("all"); // 'all' | 'tokens' | 'ledger'
  
  // Single Unified Video Playback & Subtitle State
  const [videoEnded, setVideoEnded] = useState(false);
  const [currentSubtitle, setCurrentSubtitle] = useState(MARROW_SUBTITLE_CUES[0].text);
  const [isPlayingVideo, setIsPlayingVideo] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [activeTab, setActiveTab] = useState("dossier"); // 'dossier' | 'certificate'
  
  const videoRef = useRef(null);
  const finalScore = getScore();

  // If already marked solved but score wasn't recorded properly, fix it
  useEffect(() => {
    if (solved && (levelScores["final"] === undefined || levelScores["final"] === 0)) {
      markLevelSolved("final", config?.basePoints || 40, "VERIFIED", {
        solutionExplanation: "Master bootstrap uplink unlocked Dr. Marrow's final broadcast.",
        notebookFragment: "The beacon is awake."
      });
    }
  }, [solved, levelScores, config]);

  const handleVerifyP1 = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const clean = (protocol1Key || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    if (!clean) return;

    try {
      const res = await fetch("/api/verify-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: team?.id,
          levelId: "final",
          guess: clean
        })
      });
      const data = await res.json();
      if (data && data.success) {
        setProtocol1Verified(true);
        setSuccessMsg("PROTOCOL I AUTHENTICATED: Dual-Stream tensor key accepted and locked.");
      } else if (data && data.honeypot) {
        setErrorMsg(data.message || "SECURITY ADVISORY: Decoy subcarrier trigger intercepted.");
      } else {
        setErrorMsg("PROTOCOL I REJECTED: Dual-Stream tensor sequence is misaligned. Review evidence vault.");
      }
    } catch (err) {
      setErrorMsg("PROTOCOL I REJECTED: Network verification failed.");
    }
  };

  const handleVerifyP2 = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const clean = (protocol2Key || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    if (!clean) return;

    try {
      const res = await fetch("/api/verify-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: team?.id,
          levelId: "final",
          guess: clean
        })
      });
      const data = await res.json();
      if (data && data.success) {
        setProtocol2Verified(true);
        setSuccessMsg("PROTOCOL II AUTHENTICATED: Marrow staircase passphrase accepted and locked.");
      } else if (data && data.honeypot) {
        setErrorMsg(data.message || "SECURITY ADVISORY: Decoy subcarrier trigger intercepted.");
      } else {
        setErrorMsg("PROTOCOL II REJECTED: Marrow staircase word runes are misaligned. Review evidence vault.");
      }
    } catch (err) {
      setErrorMsg("PROTOCOL II REJECTED: Network verification failed.");
    }
  };

  const handleMasterUplink = (e) => {
    if (e) e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (protocol1Verified && protocol2Verified) {
      const earnable = getEarnablePoints("final", config?.basePoints || 40, config?.durationSeconds || 1200);

      markLevelSolved("final", earnable, "VERIFIED", {
        solutionExplanation: "Both Protocol I (Dual-Stream Tensor) and Protocol II (Marrow Staircase) authenticated.",
        notebookFragment: "The beacon is awake."
      });
      setIsDecrypted(true);
      setVideoEnded(false);
    } else if (!protocol1Verified && !protocol2Verified) {
      setErrorMsg("DUAL AUTHENTICATION INCOMPLETE: You must authenticate both Protocol I and Protocol II before initiating the broadcast.");
    } else if (!protocol1Verified) {
      setErrorMsg("DUAL AUTHENTICATION INCOMPLETE: Protocol I (Dual-Stream Tensor) has not been verified yet.");
    } else {
      setErrorMsg("DUAL AUTHENTICATION INCOMPLETE: Protocol II (Marrow Staircase) has not been verified yet.");
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
            {/* Header & Status Indicator */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 flex-wrap gap-3">
              <div className="flex items-center gap-2.5 text-white font-bold text-sm">
                <Terminal size={18} />
                <span>BLACKBOX DUAL-PROTOCOL UPLINK AUTHENTICATION</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border flex items-center gap-1 ${
                  protocol1Verified
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                    : "bg-white/5 border-white/10 text-slate-400"
                }`}>
                  {protocol1Verified ? "✓ PROTOCOL I AUTHENTICATED" : "PROTOCOL I PENDING"}
                </span>

                <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border flex items-center gap-1 ${
                  protocol2Verified
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                    : "bg-white/5 border-white/10 text-slate-400"
                }`}>
                  {protocol2Verified ? "✓ PROTOCOL II AUTHENTICATED" : "PROTOCOL II PENDING"}
                </span>
              </div>
            </div>

            {/* PROTOCOL I CARD */}
            <div className="p-5 bg-white/[0.02] rounded-2xl border border-white/10 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <Radio size={15} className="text-white" />
                  <span>PROTOCOL I: DUAL-STREAM TENSOR MANIFOLD</span>
                </div>
                {protocol1Verified && (
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
                    VERIFIED &bull; LOCKED
                  </span>
                )}
              </div>

              <p className="text-slate-300 text-xs italic leading-relaxed">
                "The drive's firmware is locked between two alternating currents across your recovered Evidence Vault. First gather the odd harmonic pulses rising from the beginning, then join them with the even carrier waves rising in kind. Fuse both streams into one unbroken sequence to ignite the bootstrap."
              </p>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <input
                  type="text"
                  disabled={protocol1Verified}
                  value={protocol1Key}
                  onChange={(e) => setProtocol1Key(e.target.value)}
                  placeholder="ENTER DUAL-STREAM TOKEN SEQUENCE..."
                  className="flex-1 bg-black border border-white/20 focus:border-white rounded-xl px-4 py-2.5 text-white uppercase focus:outline-none transition-all font-bold tracking-widest text-xs disabled:opacity-60 disabled:border-emerald-500/30"
                />
                {!protocol1Verified ? (
                  <button
                    type="button"
                    onClick={handleVerifyP1}
                    className="px-5 py-2.5 bg-white hover:bg-slate-200 text-black font-bold rounded-xl transition-all cursor-pointer text-xs whitespace-nowrap shadow"
                  >
                    Verify Protocol I
                  </button>
                ) : (
                  <span className="px-4 py-2.5 bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-bold rounded-xl text-xs flex items-center gap-1 justify-center">
                    <CheckCircle2 size={14} /> Locked
                  </span>
                )}
              </div>
            </div>

            {/* PROTOCOL II CARD */}
            <div className="p-5 bg-white/[0.02] rounded-2xl border border-white/10 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <BookOpen size={15} className="text-white" />
                  <span>PROTOCOL II: MARROW STAIRCASE PASSPHRASE</span>
                </div>
                {protocol2Verified && (
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
                    VERIFIED &bull; LOCKED
                  </span>
                )}
              </div>

              <p className="text-slate-300 text-xs italic leading-relaxed">
                "For those who study the twelve recovered journal notes in the vault: each revelation descends like a staircase. On the first step take the first word, on the second step take the second word... down to the twelfth step. The initial runes of this descent spell the true name of what was awakened."
              </p>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <input
                  type="text"
                  disabled={protocol2Verified}
                  value={protocol2Key}
                  onChange={(e) => setProtocol2Key(e.target.value)}
                  placeholder="ENTER 12-LETTER MARROW PASSPHRASE..."
                  className="flex-1 bg-black border border-white/20 focus:border-white rounded-xl px-4 py-2.5 text-white uppercase focus:outline-none transition-all font-bold tracking-widest text-xs disabled:opacity-60 disabled:border-emerald-500/30"
                />
                {!protocol2Verified ? (
                  <button
                    type="button"
                    onClick={handleVerifyP2}
                    className="px-5 py-2.5 bg-white hover:bg-slate-200 text-black font-bold rounded-xl transition-all cursor-pointer text-xs whitespace-nowrap shadow"
                  >
                    Verify Protocol II
                  </button>
                ) : (
                  <span className="px-4 py-2.5 bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-bold rounded-xl text-xs flex items-center gap-1 justify-center">
                    <CheckCircle2 size={14} /> Locked
                  </span>
                )}
              </div>
            </div>

            {/* Error or Success Banner */}
            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl text-xs flex items-center gap-2">
                <ShieldAlert size={16} /> {errorMsg}
              </div>
            )}
            {successMsg && !errorMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 size={16} /> {successMsg}
              </div>
            )}

            {/* Master Uplink Initiation Action */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleMasterUplink}
                className={`w-full py-4 font-bold rounded-xl transition-all text-xs flex items-center justify-center gap-2 cursor-pointer ${
                  protocol1Verified && protocol2Verified
                    ? "bg-white hover:bg-slate-200 text-black shadow-[0_0_30px_rgba(255,255,255,0.4)] animate-pulse"
                    : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                }`}
              >
                <KeyRound size={16} />
                <span>
                  {protocol1Verified && protocol2Verified
                    ? "BOTH PROTOCOLS AUTHENTICATED // INITIATE MASTER BROADCAST UPLINK →"
                    : "AUTHENTICATE BOTH PROTOCOLS & INITIATE BROADCAST →"}
                </span>
              </button>
            </div>
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

              {/* Bottom-Right Watermark: Mathematics Club VIT Chennai Logo (Cleanly covering gemini spark icon) */}
              <div
                className="absolute z-30 pointer-events-none drop-shadow-[0_8px_30px_rgba(0,0,0,0.98)] flex items-center justify-center"
                style={{
                  bottom: "1.2rem",
                  right: "2.8rem"
                }}
              >
                <img
                  src="/maths_club_logo.png"
                  alt="Mathematics Club VIT Chennai"
                  className="w-18 h-18 sm:w-22 sm:h-22 md:w-24 md:h-24 object-contain filter drop-shadow-[0_0_20px_rgba(0,0,0,1)]"
                />
              </div>

              {/* Dynamic Bottom Subtitle Bar (Anchored at the Bottom) */}
              <div className="absolute bottom-14 left-4 right-4 sm:left-12 sm:right-12 flex justify-center pointer-events-none z-20">
                <div className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-black/90 border border-white/30 text-white font-sans text-xs md:text-sm text-center shadow-2xl backdrop-blur max-w-xl leading-relaxed animate-fade-in font-medium">
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
                    <Award size={14} /> Case Forensics Summary
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

                {/* TAB 2: CASE FORENSICS SUMMARY */}
                {activeTab === "certificate" && (
                  <div className="p-8 bg-black rounded-2xl border-2 border-white/30 flex flex-col items-center justify-center text-center gap-4 relative overflow-hidden shadow-2xl">
                    <div className="w-16 h-16 rounded-2xl bg-white text-black flex items-center justify-center shadow-lg">
                      <Trophy size={32} />
                    </div>

                    <div className="flex flex-col gap-1 max-w-lg">
                      <span className="text-slate-400 text-[10px] tracking-widest uppercase">
                        DEPARTMENT OF MATHEMATICAL SCIENCES // FORENSIC OPERATIONS
                      </span>
                      <h3 className="text-lg font-bold text-white tracking-wider uppercase">
                        CASE FORENSICS & INVESTIGATION SUMMARY
                      </h3>
                    </div>

                    <div className="w-full max-w-lg p-5 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-2.5 font-mono text-xs text-left">
                      <div className="flex justify-between border-b border-white/10 pb-1.5">
                        <span className="text-slate-400 font-semibold">OPERATING TEAM:</span>
                        <span className="text-white font-bold">{team?.teamName || "Forensic Unit Alpha"}</span>
                      </div>
                      
                      <div className="flex justify-between border-b border-white/10 pb-1.5">
                        <span className="text-slate-400 font-semibold">CAPTAIN / LEAD:</span>
                        <span className="text-white font-bold">
                          {team?.captainName || "Lead Operative"} ({team?.captainRegNo || team?.regNo || "N/A"})
                        </span>
                      </div>

                      {/* Team Members List */}
                      {team?.members && team.members.length > 0 ? (
                        team.members.map((m, i) => (
                          <div key={i} className="flex justify-between border-b border-white/5 pb-1">
                            <span className="text-slate-400">OPERATIVE #{i + 1}:</span>
                            <span className="text-slate-200 font-bold">{m.name} ({m.regNo})</span>
                          </div>
                        ))
                      ) : (
                        <div className="flex justify-between border-b border-white/5 pb-1">
                          <span className="text-slate-400">FIELD OPERATIVES:</span>
                          <span className="text-slate-300">Sole Field Operative</span>
                        </div>
                      )}

                      <div className="flex justify-between border-b border-white/10 pb-1.5 pt-1">
                        <span className="text-slate-400 font-semibold">EVIDENCE SECURED:</span>
                        <span className="text-white font-bold">12 / 12 TOKENS + MASTER BOOTSTRAP</span>
                      </div>

                      <div className="flex justify-between pt-1">
                        <span className="text-slate-400 font-semibold">FINAL MERIT SCORE:</span>
                        <span className="text-white font-extrabold text-sm">{finalScore} PTS</span>
                      </div>
                    </div>

                    <p className="text-slate-400 text-[11px] max-w-md font-sans leading-relaxed">
                      This confirms that the above investigative unit has successfully deconstructed all mathematical forensic tiers, resolved Dr. Marrow's disappearance, and decrypted the blackbox terminal.
                    </p>
                  </div>
                )}

                {/* Bottom Action Controls */}
                <div className="flex justify-end pt-2 border-t border-white/10">
                  <Link
                    to="/leaderboard"
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white hover:bg-slate-200 text-black font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_25px_rgba(255,255,255,0.3)] cursor-pointer"
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
