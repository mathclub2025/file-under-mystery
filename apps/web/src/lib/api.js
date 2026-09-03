export function getApiBase() {
  if (typeof window !== "undefined") {
    const custom = localStorage.getItem("mystery_custom_api_url");
    if (custom && custom.trim()) {
      return custom.trim().replace(/\/$/, "");
    }
  }
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/$/, "");
  }
  return "https://consulting-lenders-parameter-prix.trycloudflare.com";
}

export function setCustomApiUrl(url) {
  if (typeof window !== "undefined") {
    if (url && url.trim()) {
      localStorage.setItem("mystery_custom_api_url", url.trim().replace(/\/$/, ""));
    } else {
      localStorage.removeItem("mystery_custom_api_url");
    }
  }
}

export async function apiCheckHealth(customBase) {
  const base = customBase !== undefined ? customBase.replace(/\/$/, "") : getApiBase();
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const target = base ? `${base}/api/health` : "/api/health";
    const res = await fetch(target, { signal: controller.signal });
    clearTimeout(timeoutId);
    const latency = Date.now() - startTime;
    if (res.ok) {
      const data = await res.json();
      return { success: true, latency, data, url: target };
    }
    return { success: false, latency, error: `HTTP ${res.status}: ${res.statusText}`, url: target };
  } catch (err) {
    const latency = Date.now() - startTime;
    return { success: false, latency, error: err.message || "Connection refused", url: base ? `${base}/api/health` : "/api/health" };
  }
}

export function getApiUrl(path) {
  const base = getApiBase();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${cleanPath}` : cleanPath;
}

export async function apiRegisterTeam(data) {
  try {
    const res = await fetch(getApiUrl("/api/register"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (json.success && json.team) {
      return json.team;
    }
  } catch (err) {
    console.warn("apiRegisterTeam network error:", err);
  }

  // Fallback structure
  return {
    id: "local_" + Date.now(),
    team_name: data.teamName,
    captain_name: data.captainName,
    captain_reg_no: data.captainRegNo,
    members: data.members || [],
    total_points: 0,
    current_level: "level1"
  };
}

export async function apiLoginTeam(data) {
  try {
    const res = await fetch(getApiUrl("/api/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (json.success) {
      return json;
    }
  } catch (err) {
    console.warn("apiLoginTeam network error:", err);
  }
  return null;
}

export async function apiSyncIdentity(data) {
  try {
    const res = await fetch(getApiUrl("/api/team/sync-identity"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (json.success && json.team) {
      return json.team;
    }
  } catch (err) {
    console.warn("apiSyncIdentity error:", err);
  }
  return null;
}

export async function apiRecordProgress({ teamId, levelId, solved, pointsAwarded, remainingSeconds, timeSpentSeconds, attempts = 1 }) {
  if (!teamId) return null;
  try {
    const res = await fetch(getApiUrl("/api/progress"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId, levelId, solved, pointsAwarded, remainingSeconds, timeSpentSeconds, attempts })
    });
    return await res.json();
  } catch (err) {
    console.warn("apiRecordProgress error:", err);
    return null;
  }
}

export async function apiUpdateActiveLevel(teamId, levelId) {
  if (!teamId || !levelId) return null;
  try {
    const res = await fetch(getApiUrl("/api/active-level"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId, levelId })
    });
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function apiRecordHintReveal({ teamId, levelId, hintIndex, pointsDeducted }) {
  if (!teamId) return null;
  try {
    const res = await fetch(getApiUrl("/api/hints"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId, levelId, hintIndex, pointsDeducted })
    });
    return await res.json();
  } catch (err) {
    console.warn("apiRecordHintReveal error:", err);
    return null;
  }
}

export async function apiGetLeaderboard() {
  try {
    const res = await fetch(getApiUrl("/api/leaderboard"));
    const json = await res.json();
    if (json.success && Array.isArray(json.leaderboard)) {
      return json.leaderboard;
    }
  } catch (err) {
    console.warn("apiGetLeaderboard network error:", err);
  }
  return null;
}

export async function apiGetTeamProgress(teamId) {
  if (!teamId) return null;
  try {
    const res = await fetch(getApiUrl(`/api/team-progress?teamId=${encodeURIComponent(teamId)}`));
    const json = await res.json();
    if (json.success) {
      return json;
    }
  } catch (err) {
    console.warn("apiGetTeamProgress error:", err);
  }
  return null;
}

// Secure Server-Side Token Verification
export async function apiVerifyToken({ teamId, levelId, guess, pointsAwarded, remainingSeconds, timeSpentSeconds }) {
  try {
    const res = await fetch(getApiUrl("/api/verify-token"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId, levelId, guess, pointsAwarded, remainingSeconds, timeSpentSeconds })
    });
    return await res.json();
  } catch (err) {
    console.warn("apiVerifyToken error:", err);
    return { success: false, error: err.message };
  }
}

// Secure Server-Side Single Hint Request
export async function apiGetHint({ teamId, levelId, hintIndex }) {
  try {
    const res = await fetch(getApiUrl("/api/get-hint"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId, levelId, hintIndex })
    });
    return await res.json();
  } catch (err) {
    console.warn("apiGetHint error:", err);
    return { success: false, error: err.message };
  }
}

// Retrieve solution explanation and notebook fragment after solving
export async function apiGetSolutionMemo(levelId) {
  try {
    const res = await fetch(getApiUrl(`/api/solution-memo?levelId=${encodeURIComponent(levelId)}`));
    return await res.json();
  } catch (err) {
    console.warn("apiGetSolutionMemo error:", err);
    return { success: false };
  }
}

// ---------------- Admin Frontend API Client ----------------

export async function apiAdminGetTeams() {
  let dbList = [];
  try {
    const res = await fetch(getApiUrl("/api/admin/teams"));
    const json = await res.json();
    if (json.success && Array.isArray(json.teams)) {
      dbList = json.teams;
    }
  } catch (err) {
    console.warn("apiAdminGetTeams error:", err);
  }

  // Load registered teams from local storage and merge if missing in DB
  try {
    const localTeams = [];
    const stored = localStorage.getItem("mystery_registered_teams");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) localTeams.push(...parsed);
    }

    // Also inspect current session
    const currentSession = localStorage.getItem("mystery_team_session");
    if (currentSession) {
      const parsedSession = JSON.parse(currentSession);
      if (parsedSession && parsedSession.teamName) {
        if (!localTeams.some((t) => (t.teamName || "").toLowerCase() === parsedSession.teamName.toLowerCase())) {
          localTeams.push(parsedSession);
        }
      }
    }

    localTeams.forEach((lt) => {
      const tName = (lt.teamName || lt.name || "").trim();
      if (!tName || tName.toLowerCase() === "admin") return;

      const exists = dbList.some(
        (dt) =>
          (dt.id && dt.id === lt.id) ||
          (dt.teamName || "").toLowerCase().trim() === tName.toLowerCase()
      );

      if (!exists) {
        const newTeamObj = {
          id: lt.id || "team_" + tName.toLowerCase().replace(/\s+/g, "_"),
          teamName: tName,
          captainName: lt.captainName || lt.captain_name || "Lead Investigator",
          captainRegNo: lt.captainRegNo || lt.captain_reg_no || lt.regNo || "23BCE0000",
          members: lt.members || [],
          totalPoints: lt.totalPoints || lt.total_points || 0,
          currentLevel: lt.currentLevel || lt.current_level || "level1",
          solvedCount: lt.solvedCount || 0,
          totalTimeSeconds: lt.totalTimeSeconds || 0,
          createdAt: lt.createdAt || lt.registeredAt || new Date().toISOString(),
          updatedAt: lt.updatedAt || lt.registeredAt || new Date().toISOString(),
          progress: lt.progress || [],
          hints: lt.hints || []
        };
        dbList.push(newTeamObj);

        // Background sync to database
        apiRegisterTeam({
          teamName: newTeamObj.teamName,
          captainName: newTeamObj.captainName,
          captainRegNo: newTeamObj.captainRegNo,
          members: newTeamObj.members
        }).catch(() => {});
      }
    });
  } catch (e) {
    console.warn("Local teams recovery error:", e);
  }

  return dbList;
}

export async function apiAdminUpdateTeamDetails(data) {
  try {
    const res = await fetch(getApiUrl("/api/admin/team/update-details"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return await res.json();
  } catch (err) {
    console.warn("apiAdminUpdateTeamDetails error:", err);
    return { success: false, error: err.message };
  }
}

export async function apiAdminUpdateTeamPoints(teamId, totalPoints) {
  try {
    const res = await fetch(getApiUrl("/api/admin/team/update-points"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId, totalPoints })
    });
    return await res.json();
  } catch (err) {
    console.warn("apiAdminUpdateTeamPoints error:", err);
    return { success: false, error: err.message };
  }
}

export async function apiAdminUpdateTeamLevel(teamId, currentLevel) {
  try {
    const res = await fetch(getApiUrl("/api/admin/team/update-level"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId, currentLevel })
    });
    return await res.json();
  } catch (err) {
    console.warn("apiAdminUpdateTeamLevel error:", err);
    return { success: false, error: err.message };
  }
}

export async function apiAdminUpdateTeamProgress(data) {
  try {
    const res = await fetch(getApiUrl("/api/admin/team/update-progress"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return await res.json();
  } catch (err) {
    console.warn("apiAdminUpdateTeamProgress error:", err);
    return { success: false, error: err.message };
  }
}

export async function apiAdminUpdateTeamHint(data) {
  try {
    const res = await fetch(getApiUrl("/api/admin/team/update-hint"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return await res.json();
  } catch (err) {
    console.warn("apiAdminUpdateTeamHint error:", err);
    return { success: false, error: err.message };
  }
}

export async function apiAdminResetTeam(teamId) {
  try {
    const res = await fetch(getApiUrl("/api/admin/team/reset"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId })
    });
    return await res.json();
  } catch (err) {
    console.warn("apiAdminResetTeam error:", err);
    return { success: false, error: err.message };
  }
}

export async function apiAdminDeleteTeam(teamId) {
  try {
    const res = await fetch(getApiUrl("/api/admin/team/delete"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId })
    });
    return await res.json();
  } catch (err) {
    console.warn("apiAdminDeleteTeam error:", err);
    return { success: false, error: err.message };
  }
}

export async function apiAdminClearDatabase() {
  try {
    const res = await fetch(getApiUrl("/api/admin/clear-database"), {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    return await res.json();
  } catch (err) {
    console.warn("apiAdminClearDatabase error:", err);
    return { success: false, error: err.message };
  }
}

export async function apiAdminAutoFixScores() {
  try {
    const res = await fetch(getApiUrl("/api/admin/auto-fix-scores"), {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    return await res.json();
  } catch (err) {
    console.warn("apiAdminAutoFixScores error:", err);
    return { success: false, error: err.message };
  }
}

export async function apiAdminPurgeEmptyGhosts() {
  try {
    const res = await fetch(getApiUrl("/api/admin/purge-empty-ghosts"), {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    return await res.json();
  } catch (err) {
    console.warn("apiAdminPurgeEmptyGhosts error:", err);
    return { success: false, error: err.message };
  }
}

export async function apiAdminMergeTeams(sourceTeamId, targetTeamId) {
  try {
    const res = await fetch(getApiUrl("/api/admin/merge-teams"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceTeamId, targetTeamId })
    });
    return await res.json();
  } catch (err) {
    console.warn("apiAdminMergeTeams error:", err);
    return { success: false, error: err.message };
  }
}

export async function apiAdminUpdateLevelTimer(data) {
  try {
    const res = await fetch(getApiUrl("/api/admin/team/update-timer"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return await res.json();
  } catch (err) {
    console.warn("apiAdminUpdateLevelTimer error:", err);
    return { success: false, error: err.message };
  }
}

export async function apiSaveTeamTimer(data) {
  try {
    const res = await fetch(getApiUrl("/api/team/timer"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return await res.json();
  } catch (err) {
    console.warn("apiSaveTeamTimer error:", err);
    return { success: false, error: err.message };
  }
}

export async function apiAdminBroadcast(data) {
  try {
    const res = await fetch(getApiUrl("/api/admin/broadcast"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return await res.json();
  } catch (err) {
    console.warn("apiAdminBroadcast error:", err);
    return { success: false, error: err.message };
  }
}

export async function apiAdminGetBroadcasts(teamId) {
  try {
    const url = teamId ? `/api/admin/broadcast?teamId=${encodeURIComponent(teamId)}` : "/api/admin/broadcast";
    const res = await fetch(getApiUrl(url));
    return await res.json();
  } catch (err) {
    console.warn("apiAdminGetBroadcasts error:", err);
    return { success: false, broadcasts: [] };
  }
}

export async function apiGetEventStatus() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(getApiUrl("/api/event-status"), { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data && data.success) {
        if (typeof window !== "undefined") {
          localStorage.setItem("mystery_event_status_cache", JSON.stringify(data));
        }
        return data;
      }
    }
  } catch (err) {
    // Fallback quietly to local cache
  }

  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem("mystery_event_status_cache");
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {}
  }

  return { success: true, isLive: true, introEnabled: true, phase2Unlocked: true };
}

export async function apiAdminUpdateEventStatus(data) {
  let cachedStatus = { success: true, isLive: true, introEnabled: true, phase2Unlocked: true };
  if (typeof window !== "undefined") {
    try {
      const prev = JSON.parse(localStorage.getItem("mystery_event_status_cache") || "{}");
      cachedStatus = { ...prev, ...data, success: true, updatedAt: new Date().toISOString() };
      localStorage.setItem("mystery_event_status_cache", JSON.stringify(cachedStatus));
    } catch (e) {}
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(getApiUrl("/api/admin/event-status"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const json = await res.json();
      if (typeof window !== "undefined" && json && json.success) {
        localStorage.setItem("mystery_event_status_cache", JSON.stringify(json));
      }
      return json;
    }
  } catch (err) {
    // Network failed or timed out -> local storage updated
  }

  return cachedStatus;
}


