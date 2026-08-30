import { create } from "zustand";
import { apiRecordProgress, apiRecordHintReveal, apiGetTeamProgress } from "../lib/api.js";

const STORAGE_KEY = "mystery_game_state_v3";

export const LEVEL_ORDER = [
  "level1", "level2", "level3", "level4",
  "level5", "level6", "level7", "level8",
  "level9", "level10", "level11", "level12",
  "final"
];

export const LEVEL_FINDINGS = {
  level1: { token: "SECURED", note: "Mirrors in the dark hold what the eye misses. Pull the exposure out of the shadows." },
  level2: { token: "SECURED", note: "The acoustic carrier tone was hidden underneath the human voice all along." },
  level3: { token: "SECURED", note: "A sudden rhythm in the surveillance frames kept time when the lens glitched." },
  level4: { token: "SECURED", note: "In the quiet records, the lowest bitplane remembers what color hid." },
  level5: { token: "SECURED", note: "When numbers fold into one another, prime moduli never lose their origin." },
  level6: { token: "SECURED", note: "Two envelopes folded around the wayfarer could not conceal the road's tail." },
  level7: { token: "SECURED", note: "When five standing waves meet in balance, the phosphor draws the letters." },
  level8: { token: "SECURED", note: "In the frequency domain every speck finds equilibrium along its own radial orbit." },
  level9: { token: "SECURED", note: "The constellations never shift but five coordinates reveal astronomical beacons in the deep sky." },
  level10: { token: "SECURED", note: "Beneath the tapestry of chaos every cellular row must conform to its ancestral seed." },
  level11: { token: "SECURED", note: "Inverting the stereo channel nullifies masking noise when added in opposite phase to expose the voice." },
  level12: { token: "SECURED", note: "Traversing every corridor once without retracing steps connects each checkpoint to next perimeter gate." },
  final: { token: "SECURED", note: "The beacon is awake." }
};

const getActiveTeamId = () => {
  try {
    const saved = localStorage.getItem("mystery_team_session");
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.id;
    }
  } catch (e) {}
  return null;
};

const getStorageKey = () => {
  const teamId = getActiveTeamId();
  return teamId ? `mystery_game_state_v3_${teamId}` : "mystery_game_state_v3_guest";
};

const loadPersistedState = () => {
  try {
    const key = getStorageKey();
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return {
    solvedLevels: {},
    timedOutLevels: {},
    levelScores: {},
    revealedHints: {},
    revealedHintCosts: {},
    revealedHintTexts: {},
    levelTimers: {},
    solvedTokens: {},
    levelMemos: {}
  };
};

const savePersistedState = (state) => {
  try {
    const key = getStorageKey();
    const dataToSave = {
      solvedLevels: state.solvedLevels,
      timedOutLevels: state.timedOutLevels,
      levelScores: state.levelScores,
      revealedHints: state.revealedHints,
      revealedHintCosts: state.revealedHintCosts,
      revealedHintTexts: state.revealedHintTexts,
      levelTimers: state.levelTimers,
      solvedTokens: state.solvedTokens,
      levelMemos: state.levelMemos
    };
    localStorage.setItem(key, JSON.stringify(dataToSave));
  } catch (e) {}
};

const initial = loadPersistedState();

export const useGameStore = create((set, get) => ({
  solvedLevels: initial.solvedLevels || {},
  timedOutLevels: initial.timedOutLevels || {},
  levelScores: initial.levelScores || {},
  revealedHints: initial.revealedHints || {},
  revealedHintCosts: initial.revealedHintCosts || {},
  revealedHintTexts: initial.revealedHintTexts || {},
  levelTimers: initial.levelTimers || {},
  solvedTokens: initial.solvedTokens || {},
  levelMemos: initial.levelMemos || {},

  // Reset entire game state for a new team
  resetGameState: () => {
    const fresh = {
      solvedLevels: {},
      timedOutLevels: {},
      levelScores: {},
      revealedHints: {},
      revealedHintCosts: {},
      revealedHintTexts: {},
      levelTimers: {},
      solvedTokens: {},
      levelMemos: {}
    };
    set(fresh);
    savePersistedState(fresh);
  },

  // Get current active (first neither-solved-nor-timed-out) level
  getActiveLevelId: () => {
    const solved = get().solvedLevels || {};
    const timedOut = get().timedOutLevels || {};
    for (const lvl of LEVEL_ORDER) {
      if (!solved[lvl] && !timedOut[lvl]) {
        return lvl;
      }
    }
    return "final"; // All levels are completed / ended -> stay on final
  },

  isAllLevelsEnded: () => {
    const solved = get().solvedLevels || {};
    const timedOut = get().timedOutLevels || {};
    return LEVEL_ORDER.every((lvl) => !!solved[lvl] || !!timedOut[lvl]);
  },

  // Check if timer has started for a level
  hasTimerStarted: (levelId) => {
    return !!get().levelTimers[levelId]?.hasStarted;
  },

  // Start timer when workbench is officially entered
  startLevelTimer: (levelId, durationSeconds = 1200) => {
    const current = get().levelTimers[levelId];
    if (current && current.hasStarted) {
      return;
    }

    const updatedTimers = {
      ...get().levelTimers,
      [levelId]: {
        duration: durationSeconds,
        remainingSeconds: current?.remainingSeconds !== undefined ? current.remainingSeconds : durationSeconds,
        hasStarted: true,
        isExpired: false
      }
    };
    set({ levelTimers: updatedTimers });
    savePersistedState(get());
  },

  // Tick timer down by 1 second (runs only while user is actively in workbench)
  tickLevelTimer: (levelId) => {
    const timer = get().levelTimers[levelId];
    if (!timer || !timer.hasStarted || timer.isExpired || get().solvedLevels[levelId]) {
      return;
    }

    const currentRem = timer.remainingSeconds !== undefined ? timer.remainingSeconds : timer.duration || 1200;
    const nextRem = Math.max(0, currentRem - 1);
    const isNowExpired = nextRem <= 0;

    const updatedTimers = {
      ...get().levelTimers,
      [levelId]: {
        ...timer,
        remainingSeconds: nextRem,
        isExpired: isNowExpired
      }
    };

    set({ levelTimers: updatedTimers });
    savePersistedState(get());
  },

  // Get remaining seconds for a level
  getRemainingSeconds: (levelId, durationSeconds = 1200) => {
    const timer = get().levelTimers[levelId];
    if (!timer || !timer.hasStarted) {
      return durationSeconds;
    }
    if (timer.isExpired || get().timedOutLevels[levelId]) return 0;
    if (get().solvedLevels[levelId]) {
      return timer.remainingWhenSolved !== undefined ? timer.remainingWhenSolved : 0;
    }
    return timer.remainingSeconds !== undefined ? timer.remainingSeconds : durationSeconds;
  },

  // Calculate sum of hint deductions unlocked for a specific level
  getLevelHintDeductions: (levelId) => {
    const costs = get().revealedHintCosts || {};
    let total = 0;
    Object.keys(costs).forEach((key) => {
      if (key.startsWith(`${levelId}_`)) {
        total += costs[key] || 0;
      }
    });
    return total;
  },

  // Calculate dynamic live earnable points for a level (Time Decay + Hint Deductions)
  getEarnablePoints: (levelId, basePoints = 20, durationSeconds = 1200) => {
    if (get().timedOutLevels[levelId]) {
      const hintCost = get().getLevelHintDeductions(levelId);
      return Math.max(0, 10 - hintCost);
    }
    if (get().solvedLevels[levelId]) {
      const recorded = get().levelScores[levelId];
      if (recorded !== undefined && recorded !== null && recorded >= 0) {
        return recorded;
      }
      return basePoints;
    }

    let decayedBase = basePoints;
    const timer = get().levelTimers[levelId];
    const minFloor = levelId === "final" ? 20 : 10;

    if (timer && timer.hasStarted) {
      const rem = timer.remainingSeconds !== undefined ? timer.remainingSeconds : durationSeconds;
      if (rem <= 0) {
        decayedBase = minFloor;
      } else {
        const halfDuration = durationSeconds / 2;
        if (rem < halfDuration) {
          const decayRatio = rem / halfDuration;
          decayedBase = Math.max(minFloor, Math.round(minFloor + (basePoints - minFloor) * decayRatio));
        }
      }
    }

    const levelHintCost = get().getLevelHintDeductions(levelId);
    const earnable = Math.max(0, decayedBase - levelHintCost);
    return earnable;
  },

  // Mark level solved and record awarded points + verified token + solution memo
  markLevelSolved: (levelId, pointsAwarded, verifiedToken = "VERIFIED", solutionMemo = null) => {
    const timer = get().levelTimers[levelId];
    const remaining = timer ? (timer.remainingSeconds !== undefined ? timer.remainingSeconds : 0) : 0;

    const finalPoints = (pointsAwarded !== undefined && pointsAwarded !== null) ? pointsAwarded : (get().levelScores[levelId] || 40);

    const updatedSolved = { ...get().solvedLevels, [levelId]: true };
    const updatedScores = { ...get().levelScores, [levelId]: finalPoints };
    const updatedSolvedTokens = { ...get().solvedTokens, [levelId]: verifiedToken };
    const updatedMemos = solutionMemo
      ? { ...get().levelMemos, [levelId]: solutionMemo }
      : get().levelMemos;

    const updatedTimers = {
      ...get().levelTimers,
      [levelId]: {
        ...(timer || { duration: 1200, hasStarted: true }),
        remainingWhenSolved: remaining
      }
    };

    set({
      solvedLevels: updatedSolved,
      levelScores: updatedScores,
      levelTimers: updatedTimers,
      solvedTokens: updatedSolvedTokens,
      levelMemos: updatedMemos
    });
    savePersistedState(get());

    // Sync to Supabase Database
    const teamId = getActiveTeamId();
    if (teamId) {
      apiRecordProgress({
        teamId,
        levelId,
        solved: true,
        pointsAwarded: finalPoints || 0
      }).catch((err) => console.warn("Supabase progress sync warning:", err));
    }
  },

  // Handle timeout at 00:00 (Marks case as timed out / unsolved)
  handleLevelTimeout: (levelId) => {
    const hintCost = get().getLevelHintDeductions(levelId);
    const timeoutPoints = Math.max(0, 10 - hintCost);
    const finding = LEVEL_FINDINGS[levelId] || { token: "RECOVERED", note: "Case logged under emergency override." };

    const updatedTimedOut = { ...get().timedOutLevels, [levelId]: true };
    const updatedSolved = { ...get().solvedLevels };
    delete updatedSolved[levelId]; // Timed out level is UNSOLVED

    const updatedScores = { ...get().levelScores, [levelId]: timeoutPoints };
    const updatedSolvedTokens = { ...get().solvedTokens, [levelId]: finding.token };
    const updatedMemos = { ...get().levelMemos, [levelId]: { notebookFragment: finding.note } };
    const timer = get().levelTimers[levelId];
    const updatedTimers = {
      ...get().levelTimers,
      [levelId]: {
        ...(timer || { duration: 1200, hasStarted: true }),
        remainingSeconds: 0,
        isExpired: true,
        remainingWhenSolved: 0
      }
    };

    set({
      timedOutLevels: updatedTimedOut,
      solvedLevels: updatedSolved,
      levelScores: updatedScores,
      levelTimers: updatedTimers,
      solvedTokens: updatedSolvedTokens,
      levelMemos: updatedMemos
    });
    savePersistedState(get());

    const teamId = getActiveTeamId();
    if (teamId) {
      apiRecordProgress({
        teamId,
        levelId,
        solved: false,
        pointsAwarded: timeoutPoints
      }).catch((err) => console.warn("Supabase timeout sync warning:", err));
    }
  },

  // Record revealed single hint with text fetched from server
  saveRevealedHint: (levelId, hintIndex, cost, hintText) => {
    const key = `${levelId}_${hintIndex}`;
    const updatedHints = { ...get().revealedHints, [key]: true };
    const updatedCosts = { ...get().revealedHintCosts, [key]: cost };
    const updatedTexts = { ...get().revealedHintTexts, [key]: hintText };

    set({
      revealedHints: updatedHints,
      revealedHintCosts: updatedCosts,
      revealedHintTexts: updatedTexts
    });
    savePersistedState(get());
  },

  // Update level timer from external source (e.g. Admin or Server sync)
  setLevelRemainingTime: (levelId, remainingSeconds, duration = 1200) => {
    const rem = Math.max(0, parseInt(remainingSeconds, 10));
    const current = get().levelTimers[levelId] || { duration, hasStarted: true };

    const updatedTimers = {
      ...get().levelTimers,
      [levelId]: {
        ...current,
        duration: Math.max(rem, duration),
        remainingSeconds: rem,
        hasStarted: true,
        isExpired: rem <= 0,
        remainingWhenSolved: rem
      }
    };

    set({ levelTimers: updatedTimers });
    savePersistedState(get());
  },

  // Pull existing progress and timers from Supabase
  loadRemoteTeamProgress: async (teamId) => {
    if (!teamId) return;
    try {
      const remote = await apiGetTeamProgress(teamId);
      if (remote) {
        const solved = {};
        const timedOut = {};
        const scores = {};
        const hints = {};
        const costs = {};

        (remote.progress || []).forEach((p) => {
          if (p.solved) {
            solved[p.level_id] = true;
            scores[p.level_id] = p.points_awarded !== undefined ? p.points_awarded : 0;
          } else {
            timedOut[p.level_id] = true;
            scores[p.level_id] = p.points_awarded !== undefined ? p.points_awarded : 0;
          }
        });

        (remote.hints || []).forEach((h) => {
          const key = `${h.level_id}_${h.hint_index}`;
          hints[key] = true;
          costs[key] = h.points_deducted || 2;
        });

        // Sync level timers safely (do NOT clobber an actively ticking local timer)
        let updatedTimers = { ...get().levelTimers };
        if (remote.team && remote.team.level_timers && typeof remote.team.level_timers === "object") {
          Object.keys(remote.team.level_timers).forEach((lvl) => {
            const serverT = remote.team.level_timers[lvl];
            if (serverT) {
              const localT = get().levelTimers[lvl];
              const isLocalActive = localT && localT.hasStarted && !localT.isExpired && !solved[lvl] && !timedOut[lvl];

              if (isLocalActive) {
                // Keep local active ticking timer
                updatedTimers[lvl] = {
                  ...localT,
                  duration: serverT.duration || localT.duration || 1200,
                  remainingSeconds: localT.remainingSeconds,
                  hasStarted: true,
                  isExpired: localT.remainingSeconds <= 0
                };
              } else if (timedOut[lvl]) {
                updatedTimers[lvl] = {
                  duration: serverT.duration || 1200,
                  remainingSeconds: 0,
                  hasStarted: true,
                  isExpired: true,
                  remainingWhenSolved: 0
                };
              } else {
                updatedTimers[lvl] = {
                  ...updatedTimers[lvl],
                  duration: serverT.duration || 1200,
                  remainingSeconds: serverT.remainingSeconds !== undefined ? serverT.remainingSeconds : 1200,
                  hasStarted: serverT.hasStarted !== undefined ? serverT.hasStarted : false,
                  isExpired: serverT.isExpired !== undefined ? serverT.isExpired : false,
                  remainingWhenSolved: serverT.remainingWhenSolved
                };
              }
            }
          });
        }

        // Also ensure any timed out level has timer set to expired
        Object.keys(timedOut).forEach((lvl) => {
          if (timedOut[lvl]) {
            updatedTimers[lvl] = {
              duration: updatedTimers[lvl]?.duration || 1200,
              remainingSeconds: 0,
              hasStarted: true,
              isExpired: true,
              remainingWhenSolved: 0
            };
          }
        });

        const serverTotalPts = remote.team?.total_points;

        set({
          solvedLevels: solved,
          timedOutLevels: timedOut,
          levelScores: scores,
          revealedHints: hints,
          revealedHintCosts: costs,
          levelTimers: updatedTimers,
          serverTotalPoints: serverTotalPts !== undefined && serverTotalPts !== null ? serverTotalPts : null
        });
        savePersistedState(get());
      }
    } catch (err) {
      console.warn("loadRemoteTeamProgress error:", err);
    }
  },

  isLevelSolved: (levelId) => !!get().solvedLevels[levelId],
  isLevelTimedOut: (levelId) => !!get().timedOutLevels[levelId],
  isHintRevealed: (levelId, hintIndex) => !!get().revealedHints[`${levelId}_${hintIndex}`],
  getRevealedHintText: (levelId, hintIndex) => get().revealedHintTexts[`${levelId}_${hintIndex}`] || "",

  // Total net investigation score (strictly matching server and database calculations)
  getScore: () => {
    if (get().serverTotalPoints !== undefined && get().serverTotalPoints !== null) {
      return get().serverTotalPoints;
    }

    const solved = get().solvedLevels;
    const scores = get().levelScores;
    const costs = get().revealedHintCosts;

    let solvedTotal = 0;
    Object.keys(scores).forEach((lvl) => {
      if (solved[lvl]) {
        solvedTotal += scores[lvl] || 0;
      }
    });

    let totalHintCost = 0;
    Object.keys(costs).forEach((key) => {
      totalHintCost += costs[key] || 0;
    });

    const net = Math.max(0, solvedTotal - totalHintCost);
    return net;
  },

  // Get total cases solved
  getSolvedCount: () => {
    return Object.keys(get().solvedLevels).length;
  },

  // Get total investigation time spent in seconds across all cases
  getTotalTimeSpentSeconds: () => {
    const timers = get().levelTimers;
    const solved = get().solvedLevels;
    let totalSeconds = 0;
    Object.keys(timers).forEach((lvl) => {
      const t = timers[lvl];
      if (t && t.hasStarted) {
        const dur = t.duration || 1200;
        if (solved[lvl]) {
          const rem = t.remainingWhenSolved !== undefined ? t.remainingWhenSolved : 0;
          totalSeconds += Math.max(0, dur - rem);
        } else {
          const rem = t.remainingSeconds !== undefined ? t.remainingSeconds : dur;
          totalSeconds += Math.max(0, dur - rem);
        }
      }
    });
    return totalSeconds;
  },

  // Format seconds into clean MM:SS or HH:MM:SS
  getFormattedTotalTime: (customSec = null) => {
    const totalSec = customSec !== null ? customSec : get().getTotalTimeSpentSeconds();
    if (!totalSec || totalSec <= 0) return "00m 00s";
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) {
      const remMins = mins % 60;
      return `${hrs}h ${remMins < 10 ? '0' : ''}${remMins}m ${secs < 10 ? '0' : ''}${secs}s`;
    }
    return `${mins < 10 ? '0' : ''}${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  }
}));
