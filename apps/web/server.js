import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import {
  dbRegisterTeam,
  dbLoginTeam,
  dbRecordProgress,
  dbRecordHintReveal,
  dbGetLeaderboard,
  dbGetTeamProgress,
  dbAdminGetAllTeams,
  dbAdminUpdateTeamDetails,
  dbAdminUpdateTeamPoints,
  dbAdminUpdateTeamLevel,
  dbAdminUpdateTeamProgress,
  dbAdminUpdateTeamHint,
  dbAdminResetTeam,
  dbAdminDeleteTeam,
  dbAdminUpdateLevelTimer,
  dbSaveTeamTimer,
  dbAdminClearDatabase,
  dbGetEventStatus,
  dbUpdateEventStatus
} from "./db.js";
import {
  verifyServerToken,
  getServerHint,
  getServerSolutionMemo
} from "./serverSecrets.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// In-memory store for admin broadcast announcements and custom hints
let adminBroadcasts = [];

// API Endpoints connecting directly to Supabase PostgreSQL database
app.post("/api/register", async (req, res) => {
  try {
    const team = await dbRegisterTeam(req.body);
    res.json({ success: true, team });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { teamName, captainRegNo } = req.body;

    // RBAC: Hidden Admin Authentication (supports all-caps FILEUNDERMYSTERY@03)
    if (
      teamName &&
      teamName.trim().toLowerCase() === "admin" &&
      captainRegNo &&
      captainRegNo.trim().toUpperCase() === "FILEUNDERMYSTERY@03"
    ) {
      return res.json({
        success: true,
        isAdmin: true,
        team: {
          id: "admin",
          team_name: "admin",
          captain_name: "Administrator",
          captain_reg_no: "ADMIN",
          role: "admin",
          isAdmin: true,
          total_points: 0,
          current_level: "level1"
        },
        progress: [],
        hints: []
      });
    }

    const result = await dbLoginTeam(req.body);
    if (!result) {
      return res.status(404).json({ success: false, error: "Team not found" });
    }
    res.json({ success: true, ...result });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/leaderboard", async (req, res) => {
  try {
    const leaderboard = await dbGetLeaderboard();
    res.json({ success: true, leaderboard });
  } catch (err) {
    console.error("Leaderboard Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/progress", async (req, res) => {
  try {
    const result = await dbRecordProgress(req.body);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error("Progress Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/hints", async (req, res) => {
  try {
    const result = await dbRecordHintReveal(req.body);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error("Hint Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/team-progress", async (req, res) => {
  try {
    const teamId = req.query.teamId;
    const result = await dbGetTeamProgress(teamId);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error("Team Progress Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// In-memory rate limiting for verification attempts (Sliding Window per team/IP)
const verificationAttempts = new Map();

function checkRateLimit(key, maxAttempts = 6, windowMs = 30000) {
  const now = Date.now();
  const history = verificationAttempts.get(key) || [];
  const recent = history.filter((ts) => now - ts < windowMs);

  if (recent.length >= maxAttempts) {
    return false; // Rate limit exceeded
  }

  recent.push(now);
  verificationAttempts.set(key, recent);
  return true;
}

const LEVEL_BASE_POINTS = {
  level1: 10,
  level2: 12,
  level3: 14,
  level4: 16,
  level5: 18,
  level6: 15,
  level7: 18,
  level8: 20,
  level9: 22,
  level10: 22,
  level11: 24,
  level12: 25,
  final: 40
};

// Secure server-side token verification
app.post("/api/verify-token", async (req, res) => {
  try {
    const { teamId, levelId, guess, pointsAwarded } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress || "anonymous";
    const rateLimitKey = `${teamId || clientIp}_${levelId}`;

    // 1. Anti-Brute-Force Rate Limiting (Max 6 guesses per 30s)
    if (!checkRateLimit(rateLimitKey, 6, 30000)) {
      return res.status(429).json({
        success: false,
        error: "RATE LIMIT EXCEEDED: Too many verification attempts. Please wait 30 seconds."
      });
    }

    const verification = verifyServerToken(levelId, guess);

    // 2. AI Honeypot Bait Interception
    if (verification.honeypot) {
      console.warn(`[AI HONEYPOT TRIGGERED] Team: ${teamId || clientIp} on ${levelId} with token '${guess}'`);
      
      // Auto-log to admin audit trail
      adminBroadcasts.unshift({
        id: "ai_flag_" + Date.now(),
        targetTeamId: "admin",
        message: `[AI ALERT] Team ${teamId || 'Unknown'} submitted honeypot decoy token '${guess}' on ${levelId}.`,
        type: "security_alert",
        levelId,
        timestamp: new Date().toISOString()
      });

      return res.json({
        success: false,
        honeypot: true,
        message: verification.message || "SECURITY ADVISORY: Decoy subcarrier trigger intercepted."
      });
    }

    // 3. Valid Token Accepted & Server Clamped Scoring
    if (verification.success) {
      const maxPts = LEVEL_BASE_POINTS[levelId] || 10;
      const claimedPts = Number(pointsAwarded) || maxPts;
      // Server ensures points cannot exceed maximum allowable floor
      const sanitizedPoints = Math.max(0, Math.min(maxPts, claimedPts));

      if (teamId) {
        try {
          await dbRecordProgress({
            teamId,
            levelId,
            solved: true,
            pointsAwarded: sanitizedPoints
          });
        } catch (dbErr) {
          console.warn("DB progress record warning:", dbErr.message);
        }
      }
      return res.json({
        success: true,
        verifiedToken: verification.verifiedToken,
        solutionExplanation: verification.solutionExplanation,
        notebookFragment: verification.notebookFragment,
        pointsAwarded: sanitizedPoints
      });
    }

    return res.json({ success: false });
  } catch (err) {
    console.error("Verify Token Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Secure server-side on-demand hint retrieval
app.post("/api/get-hint", async (req, res) => {
  try {
    const { teamId, levelId, hintIndex } = req.body;
    const hint = getServerHint(levelId, hintIndex);
    if (!hint) {
      return res.status(404).json({ success: false, error: "Hint not found" });
    }
    if (teamId) {
      try {
        await dbRecordHintReveal({
          teamId,
          levelId,
          hintIndex,
          pointsDeducted: hint.cost || 2
        });
      } catch (dbErr) {
        console.warn("DB hint record warning:", dbErr.message);
      }
    }
    res.json({ success: true, hint });
  } catch (err) {
    console.error("Get Hint Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/solution-memo", (req, res) => {
  try {
    const levelId = req.query.levelId;
    const memo = getServerSolutionMemo(levelId);
    res.json({ success: true, memo });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------- Admin Control Endpoints ----------------

app.get("/api/admin/teams", async (req, res) => {
  try {
    const teams = await dbAdminGetAllTeams();
    res.json({ success: true, teams });
  } catch (err) {
    console.error("Admin Get Teams Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/admin/team/update-details", async (req, res) => {
  try {
    const updated = await dbAdminUpdateTeamDetails(req.body);
    res.json({ success: true, team: updated });
  } catch (err) {
    console.error("Admin Update Team Details Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/admin/team/update-points", async (req, res) => {
  try {
    const { teamId, totalPoints } = req.body;
    const updated = await dbAdminUpdateTeamPoints(teamId, totalPoints);
    res.json({ success: true, team: updated });
  } catch (err) {
    console.error("Admin Update Team Points Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/admin/team/update-level", async (req, res) => {
  try {
    const { teamId, currentLevel } = req.body;
    const updated = await dbAdminUpdateTeamLevel(teamId, currentLevel);
    res.json({ success: true, team: updated });
  } catch (err) {
    console.error("Admin Update Team Level Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/admin/team/update-progress", async (req, res) => {
  try {
    const result = await dbAdminUpdateTeamProgress(req.body);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error("Admin Update Team Progress Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/admin/team/update-hint", async (req, res) => {
  try {
    const result = await dbAdminUpdateTeamHint(req.body);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error("Admin Update Team Hint Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/admin/team/delete", async (req, res) => {
  try {
    const { teamId } = req.body;
    const result = await dbAdminDeleteTeam(teamId);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error("Admin Delete Team Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/admin/clear-database", async (req, res) => {
  try {
    const result = await dbAdminClearDatabase();
    res.json({ success: true, ...result });
  } catch (err) {
    console.error("Admin Clear Database Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/admin/team/reset", async (req, res) => {
  try {
    const { teamId } = req.body;
    const result = await dbAdminResetTeam(teamId);
    res.json({ success: true, team: result });
  } catch (err) {
    console.error("Admin Reset Team Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/admin/team/update-timer", async (req, res) => {
  try {
    const result = await dbAdminUpdateLevelTimer(req.body);
    res.json({ success: true, levelTimers: result });
  } catch (err) {
    console.error("Admin Update Level Timer Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/team/timer", async (req, res) => {
  try {
    const result = await dbSaveTeamTimer(req.body);
    res.json({ success: true, levelTimers: result });
  } catch (err) {
    console.error("Save Team Timer Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/admin/broadcast", (req, res) => {
  try {
    const { targetTeamId, message, type = "announcement", levelId, hintText } = req.body;
    const broadcastEntry = {
      id: "bc_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      targetTeamId: targetTeamId || "all",
      message: message || "",
      type,
      levelId: levelId || null,
      hintText: hintText || null,
      timestamp: new Date().toISOString()
    };
    adminBroadcasts.unshift(broadcastEntry);
    if (adminBroadcasts.length > 50) adminBroadcasts.pop();
    res.json({ success: true, broadcast: broadcastEntry });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/admin/broadcast", (req, res) => {
  try {
    const teamId = req.query.teamId;
    const relevant = adminBroadcasts.filter(
      (b) => b.targetTeamId === "all" || (teamId && b.targetTeamId === teamId)
    );
    res.json({ success: true, broadcasts: relevant });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Event Status Endpoints (Go Live & Intro Control)
app.get("/api/event-status", async (req, res) => {
  try {
    const status = await dbGetEventStatus();
    res.json({ success: true, ...status });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/admin/event-status", async (req, res) => {
  try {
    const { isLive, introEnabled } = req.body;
    const status = await dbUpdateEventStatus({ isLive, introEnabled });
    res.json({ success: true, ...status });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Serve static frontend assets from dist
app.use(express.static(path.join(__dirname, "dist")));

// Universal SPA fallback for client-side routing
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`FILE UNDER MYSTERY Server running on port ${PORT}`);
  console.log(`Connected to Supabase PostgreSQL Database.`);
});
