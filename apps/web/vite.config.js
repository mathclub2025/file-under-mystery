import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
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

let adminBroadcasts = [];

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

function apiPlugin() {
  const handler = async (req, res, next) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    if (!pathname.startsWith("/api/")) {
      return next();
    }

    try {
      // 0. GET /api/health
      if (req.method === "GET" && pathname === "/api/health") {
        return sendJson(res, 200, { status: "online", timestamp: new Date().toISOString(), event: "FILE UNDER MYSTERY" });
      }

      // 1. POST /api/register
      if (req.method === "POST" && pathname === "/api/register") {
        const body = await parseJsonBody(req);
        const team = await dbRegisterTeam(body);
        return sendJson(res, 200, { success: true, team });
      }

      // 2. POST /api/login
      if (req.method === "POST" && pathname === "/api/login") {
        const body = await parseJsonBody(req);
        const { teamName, captainRegNo } = body;

        // RBAC Admin Login Check (support uppercase FILEUNDERMYSTERY@03)
        if (
          teamName &&
          teamName.trim().toLowerCase() === "admin" &&
          captainRegNo &&
          captainRegNo.trim().toUpperCase() === "FILEUNDERMYSTERY@03"
        ) {
          return sendJson(res, 200, {
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

        const result = await dbLoginTeam(body);
        if (!result) {
          return sendJson(res, 404, { success: false, error: "Team credentials not found" });
        }
        return sendJson(res, 200, { success: true, ...result });
      }

      // 3. GET /api/leaderboard
      if (req.method === "GET" && pathname === "/api/leaderboard") {
        const leaderboard = await dbGetLeaderboard();
        return sendJson(res, 200, { success: true, leaderboard });
      }

      // 4. POST /api/progress
      if (req.method === "POST" && pathname === "/api/progress") {
        const body = await parseJsonBody(req);
        const result = await dbRecordProgress(body);
        return sendJson(res, 200, { success: true, ...result });
      }

      // 5. POST /api/hints
      if (req.method === "POST" && pathname === "/api/hints") {
        const body = await parseJsonBody(req);
        const result = await dbRecordHintReveal(body);
        return sendJson(res, 200, { success: true, ...result });
      }

      // 6. GET /api/team-progress
      if (req.method === "GET" && pathname === "/api/team-progress") {
        const teamId = url.searchParams.get("teamId");
        const result = await dbGetTeamProgress(teamId);
        return sendJson(res, 200, { success: true, ...result });
      }

      // 7. POST /api/verify-token (Server-side answer checking)
      if (req.method === "POST" && pathname === "/api/verify-token") {
        const body = await parseJsonBody(req);
        const { verifyServerToken } = await import("./serverSecrets.js");
        const verification = verifyServerToken(body.levelId, body.guess);

        // 1. Honeypot check
        if (verification.honeypot) {
          adminBroadcasts.unshift({
            id: "ai_flag_" + Date.now(),
            targetTeamId: "admin",
            message: `[AI ALERT] Team ${body.teamId || 'Unknown'} submitted honeypot decoy token '${body.guess}' on ${body.levelId}.`,
            type: "security_alert",
            levelId: body.levelId,
            timestamp: new Date().toISOString()
          });

          return sendJson(res, 200, {
            success: false,
            honeypot: true,
            message: verification.message || "⚠️ AI DETECTED // Nice try with ChatGPT/Gemini, but this is a tracked decoy code! We see you — solve the forensics yourself on the workbench."
          });
        }
        if (verification.success) {
          const maxPts = 20;
          const sanitizedPoints = Math.max(0, Math.min(maxPts, Number(body.pointsAwarded) || maxPts));

          if (body.teamId) {
            try {
              await dbRecordProgress({
                teamId: body.teamId,
                levelId: body.levelId,
                solved: true,
                pointsAwarded: sanitizedPoints,
                remainingSeconds: body.remainingSeconds,
                timeSpentSeconds: body.timeSpentSeconds
              });
            } catch (dbErr) {
              console.warn("DB progress record warning:", dbErr.message);
            }
          }
          return sendJson(res, 200, {
            success: true,
            verifiedToken: verification.verifiedToken,
            solutionExplanation: verification.solutionExplanation,
            notebookFragment: verification.notebookFragment,
            pointsAwarded: sanitizedPoints
          });
        }
        return sendJson(res, 200, { success: false });
      }

      // POST /api/active-level (Sync currently open level)
      if (req.method === "POST" && pathname === "/api/active-level") {
        const body = await parseJsonBody(req);
        if (body.teamId && body.levelId) {
          try {
            const { resolveTeamId, pool } = await import("./db.js");
            const realId = await resolveTeamId(body.teamId);
            if (realId) {
              await pool.query(`UPDATE teams SET current_level = $1, updated_at = NOW() WHERE id = $2`, [body.levelId, realId]);
            }
          } catch (e) {}
        }
        return sendJson(res, 200, { success: true });
      }

      // 8. POST /api/get-hint (On-demand single hint delivery)
      if (req.method === "POST" && pathname === "/api/get-hint") {
        const body = await parseJsonBody(req);
        const { getServerHint } = await import("./serverSecrets.js");
        const hint = getServerHint(body.levelId, body.hintIndex);

        if (!hint) {
          return sendJson(res, 404, { success: false, error: "Hint not found" });
        }

        if (body.teamId) {
          try {
            await dbRecordHintReveal({
              teamId: body.teamId,
              levelId: body.levelId,
              hintIndex: body.hintIndex,
              pointsDeducted: hint.cost || 2
            });
          } catch (dbErr) {
            console.warn("DB hint record warning:", dbErr.message);
          }
        }

        return sendJson(res, 200, { success: true, hint });
      }

      // 9. GET /api/solution-memo
      if (req.method === "GET" && pathname === "/api/solution-memo") {
        const levelId = url.searchParams.get("levelId");
        const { getServerSolutionMemo } = await import("./serverSecrets.js");
        const memo = getServerSolutionMemo(levelId);
        return sendJson(res, 200, { success: true, memo });
      }

      // 10. GET /api/admin/teams
      if (req.method === "GET" && pathname === "/api/admin/teams") {
        const teams = await dbAdminGetAllTeams();
        return sendJson(res, 200, { success: true, teams });
      }

      // 11. POST /api/admin/team/update-details
      if (req.method === "POST" && pathname === "/api/admin/team/update-details") {
        const body = await parseJsonBody(req);
        const team = await dbAdminUpdateTeamDetails(body);
        return sendJson(res, 200, { success: true, team });
      }

      // 12. POST /api/admin/team/update-points
      if (req.method === "POST" && pathname === "/api/admin/team/update-points") {
        const body = await parseJsonBody(req);
        const team = await dbAdminUpdateTeamPoints(body.teamId, body.totalPoints);
        return sendJson(res, 200, { success: true, team });
      }

      // 13. POST /api/admin/team/update-level
      if (req.method === "POST" && pathname === "/api/admin/team/update-level") {
        const body = await parseJsonBody(req);
        const team = await dbAdminUpdateTeamLevel(body.teamId, body.currentLevel);
        return sendJson(res, 200, { success: true, team });
      }

      // 14. POST /api/admin/team/update-progress
      if (req.method === "POST" && pathname === "/api/admin/team/update-progress") {
        const body = await parseJsonBody(req);
        const result = await dbAdminUpdateTeamProgress(body);
        return sendJson(res, 200, { success: true, ...result });
      }

      // 15. POST /api/admin/team/update-hint
      if (req.method === "POST" && pathname === "/api/admin/team/update-hint") {
        const body = await parseJsonBody(req);
        const result = await dbAdminUpdateTeamHint(body);
        return sendJson(res, 200, { success: true, ...result });
      }

      // 16. POST /api/admin/team/delete
      if (req.method === "POST" && pathname === "/api/admin/team/delete") {
        const body = await parseJsonBody(req);
        const result = await dbAdminDeleteTeam(body.teamId);
        return sendJson(res, 200, { success: true, ...result });
      }

      // 17. POST /api/admin/team/reset
      if (req.method === "POST" && pathname === "/api/admin/team/reset") {
        const body = await parseJsonBody(req);
        const result = await dbAdminResetTeam(body.teamId);
        return sendJson(res, 200, { success: true, team: result });
      }

      // POST /api/admin/clear-database
      if (req.method === "POST" && pathname === "/api/admin/clear-database") {
        const result = await dbAdminClearDatabase();
        return sendJson(res, 200, { success: true, ...result });
      }

      // 18. POST /api/admin/team/update-timer
      if (req.method === "POST" && pathname === "/api/admin/team/update-timer") {
        const body = await parseJsonBody(req);
        const result = await dbAdminUpdateLevelTimer(body);
        return sendJson(res, 200, { success: true, levelTimers: result });
      }

      // 19. POST /api/team/timer
      if (req.method === "POST" && pathname === "/api/team/timer") {
        const body = await parseJsonBody(req);
        const result = await dbSaveTeamTimer(body);
        return sendJson(res, 200, { success: true, levelTimers: result });
      }

      // 18. POST /api/admin/broadcast
      if (req.method === "POST" && pathname === "/api/admin/broadcast") {
        const body = await parseJsonBody(req);
        const broadcastEntry = {
          id: "bc_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
          targetTeamId: body.targetTeamId || "all",
          message: body.message || "",
          type: body.type || "announcement",
          levelId: body.levelId || null,
          hintText: body.hintText || null,
          timestamp: new Date().toISOString()
        };
        adminBroadcasts.unshift(broadcastEntry);
        if (adminBroadcasts.length > 50) adminBroadcasts.pop();
        return sendJson(res, 200, { success: true, broadcast: broadcastEntry });
      }

      // 19. GET /api/admin/broadcast
      if (req.method === "GET" && pathname === "/api/admin/broadcast") {
        const teamId = url.searchParams.get("teamId");
        const relevant = adminBroadcasts.filter(
          (b) => b.targetTeamId === "all" || (teamId && b.targetTeamId === teamId)
        );
        return sendJson(res, 200, { success: true, broadcasts: relevant });
      }

      // 20. GET /api/event-status
      if (req.method === "GET" && pathname === "/api/event-status") {
        const status = await dbGetEventStatus();
        return sendJson(res, 200, { success: true, ...status });
      }

      // 21. POST /api/admin/event-status
      if (req.method === "POST" && pathname === "/api/admin/event-status") {
        const body = await parseJsonBody(req);
        const status = await dbUpdateEventStatus(body);
        return sendJson(res, 200, { success: true, ...status });
      }

      // Route not found
      return sendJson(res, 404, { success: false, error: "API endpoint not found" });
    } catch (err) {
      console.error("API Route Error:", err);
      return sendJson(res, 500, { success: false, error: err.message || "Internal Database Error" });
    }
  };

  return {
    name: "mystery-database-api",
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    }
  };
}

export default defineConfig({
  base: process.env.VITE_BASE_PATH || "./",
  plugins: [react(), apiPlugin()],
});

