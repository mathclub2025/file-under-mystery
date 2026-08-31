// Frontend API Client for Supabase PostgreSQL Database

export const API_BASE = (
  import.meta.env.VITE_API_URL ||
  "https://consulting-lenders-parameter-prix.trycloudflare.com"
).replace(/\/$/, "");

export function getApiUrl(path) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return API_BASE ? `${API_BASE}${cleanPath}` : cleanPath;
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
    const res = await fetch(getApiUrl("/api/event-status"));
    return await res.json();
  } catch (err) {
    console.warn("apiGetEventStatus error:", err);
    return { success: false, isLive: false, introEnabled: true };
  }
}

export async function apiAdminUpdateEventStatus(data) {
  try {
    const res = await fetch(getApiUrl("/api/admin/event-status"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return await res.json();
  } catch (err) {
    console.warn("apiAdminUpdateEventStatus error:", err);
    return { success: false, error: err.message };
  }
}


