import dotenv from "dotenv";
dotenv.config();

import pg from "pg";
const { Pool } = pg;

const SUPABASE_DB_URL =
  "postgresql://postgres.aqkdzgnqpbgapjxmkjaj:FileUnderMystery%4003@aws-0-ap-south-1.pooler.supabase.com:5432/postgres";

const connectionString = process.env.DATABASE_URL || SUPABASE_DB_URL;

export const pool = new Pool({
  connectionString,
  ssl: connectionString.includes("localhost")
    ? false
    : { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000
});

pool.on("error", (err) => {
  console.error("Unexpected Postgres client error:", err);
});

// Database Service Functions
export async function dbRegisterTeam({ teamName, captainName, captainRegNo, members }) {
  const cleanTeamName = (teamName || "").trim();
  const cleanCaptainName = (captainName || "").trim();
  const cleanCaptainRegNo = (captainRegNo || "").trim().toUpperCase();
  const membersJson = JSON.stringify(members || []);

  const query = `
    INSERT INTO teams (team_name, captain_email, captain_name, captain_reg_no, members, total_points, current_level)
    VALUES ($1, $2, $3, $4, $5::jsonb, 0, 'level1')
    ON CONFLICT (team_name) 
    DO UPDATE SET 
      captain_name = EXCLUDED.captain_name,
      captain_reg_no = EXCLUDED.captain_reg_no,
      members = EXCLUDED.members,
      updated_at = NOW()
    RETURNING id, team_name, captain_name, captain_reg_no, members, total_points, current_level, created_at;
  `;

  const res = await pool.query(query, [
    cleanTeamName,
    cleanCaptainRegNo, // captain_email fallback
    cleanCaptainName,
    cleanCaptainRegNo,
    membersJson
  ]);

  return res.rows[0];
}

export async function dbLoginTeam({ teamName, captainRegNo }) {
  const cleanTeamName = (teamName || "").trim();
  const cleanCaptainRegNo = (captainRegNo || "").trim().toUpperCase();

  const query = `
    SELECT id, team_name, captain_name, captain_reg_no, members, total_points, current_level, created_at
    FROM teams
    WHERE LOWER(team_name) = LOWER($1)
      AND (UPPER(captain_reg_no) = $2 OR UPPER(captain_email) = $2);
  `;

  const res = await pool.query(query, [cleanTeamName, cleanCaptainRegNo]);
  if (res.rows.length === 0) return null;

  const team = res.rows[0];

  // Fetch progress
  const progressRes = await pool.query(
    `SELECT level_id, solved, points_awarded, attempts FROM progress WHERE team_id = $1`,
    [team.id]
  );

  // Fetch hints
  const hintsRes = await pool.query(
    `SELECT level_id, hint_index, points_deducted FROM hint_reveals WHERE team_id = $1`,
    [team.id]
  );

  return {
    team,
    progress: progressRes.rows,
    hints: hintsRes.rows
  };
}

export async function dbRecordProgress({ teamId, levelId, solved, pointsAwarded, attempts = 1 }) {
  if (!teamId || !levelId) return null;

  const progressQuery = `
    INSERT INTO progress (team_id, level_id, solved, solved_at, points_awarded, attempts)
    VALUES ($1, $2, $3, NOW(), $4, $5)
    ON CONFLICT (team_id, level_id)
    DO UPDATE SET 
      solved = EXCLUDED.solved,
      solved_at = NOW(),
      points_awarded = EXCLUDED.points_awarded,
      attempts = progress.attempts + 1
    RETURNING *;
  `;

  const progressRes = await pool.query(progressQuery, [
    teamId,
    levelId,
    !!solved,
    pointsAwarded || 0,
    attempts
  ]);

  // Recalculate total team points: sum(progress.points_awarded) for solved levels
  const sumQuery = `
    SELECT COALESCE(SUM(points_awarded), 0) AS net_score
    FROM progress
    WHERE team_id = $1 AND solved = true;
  `;

  const scoreRes = await pool.query(sumQuery, [teamId]);
  const netScore = scoreRes.rows[0]?.net_score || 0;

  // Update teams table
  await pool.query(
    `UPDATE teams SET total_points = $1, current_level = $2, updated_at = NOW() WHERE id = $3`,
    [netScore, levelId, teamId]
  );

  return {
    progress: progressRes.rows[0],
    netScore
  };
}

export async function dbRecordHintReveal({ teamId, levelId, hintIndex, pointsDeducted }) {
  if (!teamId || !levelId) return null;

  const query = `
    INSERT INTO hint_reveals (team_id, level_id, hint_index, points_deducted, revealed_at)
    VALUES ($1, $2, $3, $4, NOW())
    ON CONFLICT (team_id, level_id, hint_index)
    DO NOTHING
    RETURNING *;
  `;

  const hintRes = await pool.query(query, [teamId, levelId, hintIndex, pointsDeducted || 0]);

  // Recalculate total team points
  const sumQuery = `
    SELECT COALESCE(SUM(points_awarded), 0) AS net_score
    FROM progress
    WHERE team_id = $1 AND solved = true;
  `;

  const scoreRes = await pool.query(sumQuery, [teamId]);
  const netScore = scoreRes.rows[0]?.net_score || 0;

  await pool.query(`UPDATE teams SET total_points = $1, updated_at = NOW() WHERE id = $2`, [
    netScore,
    teamId
  ]);

  return {
    hint: hintRes.rows[0] || null,
    netScore
  };
}

export function computeLevelWiseTimers(teamCreatedAt, levelTimers = {}, progressRows = []) {
  const result = {};
  const LEVEL_ORDER = [
    "level1", "level2", "level3", "level4",
    "level5", "level6", "level7", "level8",
    "level9", "level10", "level11", "level12",
    "final"
  ];
  const DEFAULT_DURATIONS = {
    level1: 1200, level2: 1200, level3: 1200, level4: 1200,
    level5: 1200, level6: 1200, level7: 1200, level8: 1200,
    level9: 1200, level10: 1200, level11: 1200, level12: 1200,
    final: 1200
  };

  const progMap = {};
  progressRows.forEach((p) => {
    progMap[p.level_id] = p;
  });

  let previousSolveTime = teamCreatedAt ? new Date(teamCreatedAt).getTime() : null;

  LEVEL_ORDER.forEach((lvlId) => {
    const dur = DEFAULT_DURATIONS[lvlId] || 1200;
    const explicit = levelTimers && levelTimers[lvlId];

    if (explicit && explicit.remainingSeconds !== undefined) {
      const rem = Math.max(0, parseInt(explicit.remainingSeconds, 10));
      const spent = explicit.timeSpentSeconds !== undefined ? explicit.timeSpentSeconds : Math.max(0, (explicit.duration || dur) - rem);
      result[lvlId] = {
        duration: explicit.duration || dur,
        remainingSeconds: rem,
        timeSpentSeconds: spent,
        hasStarted: explicit.hasStarted !== undefined ? explicit.hasStarted : true,
        isExpired: rem <= 0,
        remainingWhenSolved: rem
      };
      if (progMap[lvlId]?.solved_at) {
        previousSolveTime = new Date(progMap[lvlId].solved_at).getTime();
      }
      return;
    }

    const prog = progMap[lvlId];
    if (prog && prog.solved && prog.solved_at && previousSolveTime) {
      const thisSolveTime = new Date(prog.solved_at).getTime();
      const elapsedSeconds = Math.max(0, Math.round((thisSolveTime - previousSolveTime) / 1000));
      const actualSpent = Math.min(dur, Math.max(15, elapsedSeconds));
      const rem = Math.max(0, dur - actualSpent);
      result[lvlId] = {
        duration: dur,
        remainingSeconds: rem,
        timeSpentSeconds: actualSpent,
        hasStarted: true,
        isExpired: rem <= 0,
        remainingWhenSolved: rem
      };
      previousSolveTime = thisSolveTime;
    } else if (prog && prog.solved === false) {
      result[lvlId] = {
        duration: dur,
        remainingSeconds: 0,
        timeSpentSeconds: dur,
        hasStarted: true,
        isExpired: true,
        remainingWhenSolved: 0
      };
    } else {
      result[lvlId] = {
        duration: dur,
        remainingSeconds: dur,
        timeSpentSeconds: 0,
        hasStarted: false,
        isExpired: false,
        remainingWhenSolved: dur
      };
    }
  });

  return result;
}

function sumTimeSpentSeconds(timersMap) {
  if (!timersMap) return 0;
  return Object.values(timersMap).reduce((acc, t) => acc + (t.timeSpentSeconds || 0), 0);
}

export async function dbGetLeaderboard() {
  const teamsQuery = `
    SELECT 
      t.id,
      t.team_name,
      t.captain_name,
      t.captain_reg_no,
      t.captain_email,
      t.total_points,
      t.current_level,
      t.level_timers,
      t.created_at,
      t.updated_at,
      COUNT(p.id) FILTER (WHERE p.solved = true) AS solved_count
    FROM teams t
    LEFT JOIN progress p ON t.id = p.team_id
    WHERE LOWER(t.team_name) != 'admin'
    GROUP BY t.id
    ORDER BY t.total_points DESC, solved_count DESC, t.updated_at ASC;
  `;

  const allProgressRes = await pool.query(
    `SELECT team_id, level_id, solved, points_awarded, attempts, solved_at FROM progress ORDER BY solved_at ASC`
  );
  const progressByTeam = {};
  for (const row of allProgressRes.rows) {
    if (!progressByTeam[row.team_id]) progressByTeam[row.team_id] = [];
    progressByTeam[row.team_id].push(row);
  }

  const res = await pool.query(teamsQuery);
  return res.rows.map((row, idx) => {
    const computedTimers = computeLevelWiseTimers(
      row.created_at,
      row.level_timers || {},
      progressByTeam[row.id] || []
    );
    const totalTimeSec = sumTimeSpentSeconds(computedTimers);

    return {
      rank: idx + 1,
      id: row.id,
      name: row.team_name,
      regNo: row.captain_reg_no || row.captain_email || "23BCE0000",
      captainName: row.captain_name,
      currentLevel: row.current_level || "level1",
      solved: parseInt(row.solved_count || 0, 10),
      points: row.total_points || 0,
      timeSeconds: totalTimeSec,
      updatedAt: row.updated_at
    };
  });
}

export async function dbGetTeamProgress(teamId) {
  if (!teamId) return { team: null, progress: [], hints: [] };

  const teamRes = await pool.query(
    `SELECT id, team_name, captain_name, captain_reg_no, total_points, current_level, level_timers, created_at FROM teams WHERE id = $1`,
    [teamId]
  );

  const progressRes = await pool.query(
    `SELECT level_id, solved, points_awarded, attempts, solved_at FROM progress WHERE team_id = $1 ORDER BY solved_at ASC`,
    [teamId]
  );
  const hintsRes = await pool.query(
    `SELECT level_id, hint_index, points_deducted, revealed_at FROM hint_reveals WHERE team_id = $1`,
    [teamId]
  );

  const teamRow = teamRes.rows[0] || null;
  let computedTimers = {};
  if (teamRow) {
    computedTimers = computeLevelWiseTimers(
      teamRow.created_at,
      teamRow.level_timers || {},
      progressRes.rows
    );
  }

  return {
    team: teamRow
      ? {
          ...teamRow,
          level_timers: computedTimers,
          total_time_seconds: sumTimeSpentSeconds(computedTimers)
        }
      : null,
    progress: progressRes.rows,
    hints: hintsRes.rows
  };
}

// ---------------- Admin Database Management Functions ----------------

export async function dbAdminGetAllTeams() {
  const teamsQuery = `
    SELECT 
      t.id,
      t.team_name,
      t.captain_name,
      t.captain_reg_no,
      t.captain_email,
      t.members,
      t.total_points,
      t.current_level,
      t.level_timers,
      t.created_at,
      t.updated_at,
      COUNT(p.id) FILTER (WHERE p.solved = true) AS solved_count
    FROM teams t
    LEFT JOIN progress p ON t.id = p.team_id
    WHERE LOWER(t.team_name) != 'admin'
    GROUP BY t.id
    ORDER BY t.created_at DESC;
  `;

  const teamsRes = await pool.query(teamsQuery);

  // Fetch all progress and hints across teams to attach full matrix
  const allProgressRes = await pool.query(`SELECT team_id, level_id, solved, points_awarded, attempts, solved_at FROM progress ORDER BY solved_at ASC`);
  const allHintsRes = await pool.query(`SELECT team_id, level_id, hint_index, points_deducted, revealed_at FROM hint_reveals`);

  const progressByTeam = {};
  for (const row of allProgressRes.rows) {
    if (!progressByTeam[row.team_id]) progressByTeam[row.team_id] = [];
    progressByTeam[row.team_id].push(row);
  }

  const hintsByTeam = {};
  for (const row of allHintsRes.rows) {
    if (!hintsByTeam[row.team_id]) hintsByTeam[row.team_id] = [];
    hintsByTeam[row.team_id].push(row);
  }

  return teamsRes.rows.map((row) => {
    const computedTimers = computeLevelWiseTimers(
      row.created_at,
      row.level_timers || {},
      progressByTeam[row.id] || []
    );
    const totalTimeSec = sumTimeSpentSeconds(computedTimers);

    // Calculate gross and net points
    const pRows = progressByTeam[row.id] || [];
    const hRows = hintsByTeam[row.id] || [];
    const grossPoints = pRows.reduce((acc, p) => acc + (p.points_awarded || 0), 0);
    const hintDeductions = hRows.reduce((acc, h) => acc + (h.points_deducted || 0), 0);

    return {
      id: row.id,
      teamName: row.team_name,
      captainName: row.captain_name || "",
      captainRegNo: row.captain_reg_no || row.captain_email || "",
      members: row.members || [],
      totalPoints: row.total_points || 0,
      grossPoints,
      hintDeductions,
      currentLevel: row.current_level || "level1",
      levelTimers: computedTimers,
      solvedCount: parseInt(row.solved_count || 0, 10),
      totalTimeSeconds: totalTimeSec,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      progress: pRows,
      hints: hRows
    };
  });
}

export async function dbAdminUpdateTeamDetails({ teamId, teamName, captainName, captainRegNo, members }) {
  if (!teamId) throw new Error("teamId is required");
  const membersJson = JSON.stringify(members || []);

  const query = `
    UPDATE teams
    SET 
      team_name = COALESCE($1, team_name),
      captain_name = COALESCE($2, captain_name),
      captain_reg_no = COALESCE($3, captain_reg_no),
      captain_email = COALESCE($3, captain_email),
      members = $4::jsonb,
      updated_at = NOW()
    WHERE id = $5
    RETURNING *;
  `;

  const res = await pool.query(query, [
    teamName ? teamName.trim() : null,
    captainName ? captainName.trim() : null,
    captainRegNo ? captainRegNo.trim().toUpperCase() : null,
    membersJson,
    teamId
  ]);

  return res.rows[0];
}

export async function dbAdminUpdateTeamPoints(teamId, totalPoints) {
  if (!teamId) throw new Error("teamId is required");
  const pts = parseInt(totalPoints, 10) || 0;

  const query = `
    UPDATE teams
    SET total_points = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING *;
  `;

  const res = await pool.query(query, [pts, teamId]);
  return res.rows[0];
}

export async function dbAdminUpdateTeamLevel(teamId, currentLevel) {
  if (!teamId) throw new Error("teamId is required");
  const lvl = (currentLevel || "level1").trim();

  const query = `
    UPDATE teams
    SET current_level = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING *;
  `;

  const res = await pool.query(query, [lvl, teamId]);
  return res.rows[0];
}

export async function dbAdminUpdateTeamProgress({ teamId, levelId, solved, pointsAwarded }) {
  if (!teamId || !levelId) throw new Error("teamId and levelId are required");

  const query = `
    INSERT INTO progress (team_id, level_id, solved, solved_at, points_awarded, attempts)
    VALUES ($1, $2, $3, CASE WHEN $3 = true THEN NOW() ELSE NULL END, $4, 1)
    ON CONFLICT (team_id, level_id)
    DO UPDATE SET
      solved = EXCLUDED.solved,
      solved_at = CASE WHEN EXCLUDED.solved = true THEN NOW() ELSE NULL END,
      points_awarded = EXCLUDED.points_awarded
    RETURNING *;
  `;

  const res = await pool.query(query, [teamId, levelId, !!solved, parseInt(pointsAwarded, 10) || 0]);

  // Recalculate net points
  const sumQuery = `
    SELECT COALESCE(SUM(points_awarded), 0) AS net_score
    FROM progress
    WHERE team_id = $1 AND solved = true;
  `;

  const scoreRes = await pool.query(sumQuery, [teamId]);
  const netScore = scoreRes.rows[0]?.net_score || 0;

  await pool.query(`UPDATE teams SET total_points = $1, updated_at = NOW() WHERE id = $2`, [
    netScore,
    teamId
  ]);

  return {
    progress: res.rows[0],
    netScore
  };
}

export async function dbAdminUpdateTeamHint({ teamId, levelId, hintIndex, pointsDeducted, action = "add" }) {
  if (!teamId || !levelId || hintIndex === undefined) throw new Error("teamId, levelId and hintIndex are required");

  if (action === "remove") {
    await pool.query(
      `DELETE FROM hint_reveals WHERE team_id = $1 AND level_id = $2 AND hint_index = $3`,
      [teamId, levelId, hintIndex]
    );
  } else {
    await pool.query(
      `INSERT INTO hint_reveals (team_id, level_id, hint_index, points_deducted, revealed_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (team_id, level_id, hint_index)
       DO UPDATE SET points_deducted = EXCLUDED.points_deducted`,
      [teamId, levelId, hintIndex, parseInt(pointsDeducted, 10) || 0]
    );
  }

  // Recalculate net points
  const sumQuery = `
    WITH p_pts AS (
      SELECT COALESCE(SUM(points_awarded), 0) AS total_awarded
      FROM progress
      WHERE team_id = $1
    ),
    h_pts AS (
      SELECT COALESCE(SUM(points_deducted), 0) AS total_deducted
      FROM hint_reveals
      WHERE team_id = $1
    )
    SELECT GREATEST(0, p_pts.total_awarded - h_pts.total_deducted) AS net_score
    FROM p_pts, h_pts;
  `;

  const scoreRes = await pool.query(sumQuery, [teamId]);
  const netScore = scoreRes.rows[0]?.net_score || 0;

  await pool.query(`UPDATE teams SET total_points = $1, updated_at = NOW() WHERE id = $2`, [
    netScore,
    teamId
  ]);

  return { netScore };
}

export async function dbAdminResetTeam(teamId) {
  if (!teamId) throw new Error("teamId is required");

  await pool.query(`DELETE FROM progress WHERE team_id = $1`, [teamId]);
  await pool.query(`DELETE FROM hint_reveals WHERE team_id = $1`, [teamId]);
  const res = await pool.query(
    `UPDATE teams SET total_points = 0, current_level = 'level1', updated_at = NOW() WHERE id = $1 RETURNING *`,
    [teamId]
  );
  return res.rows[0];
}

export async function dbAdminDeleteTeam(teamId) {
  if (!teamId) throw new Error("teamId is required");
  await pool.query(`DELETE FROM progress WHERE team_id = $1`, [teamId]);
  await pool.query(`DELETE FROM hint_reveals WHERE team_id = $1`, [teamId]);
  await pool.query(`DELETE FROM teams WHERE id = $1`, [teamId]);
  return { success: true };
}

export async function dbAdminUpdateLevelTimer({ teamId, levelId, remainingSeconds, duration = 1200 }) {
  if (!teamId || !levelId) throw new Error("teamId and levelId are required");
  const rem = Math.max(0, parseInt(remainingSeconds, 10));
  const dur = Math.max(rem, parseInt(duration, 10) || 1200);

  const teamRes = await pool.query(`SELECT level_timers FROM teams WHERE id = $1`, [teamId]);
  const currentTimers = teamRes.rows[0]?.level_timers || {};

  currentTimers[levelId] = {
    duration: dur,
    remainingSeconds: rem,
    timeSpentSeconds: Math.max(0, dur - rem),
    hasStarted: true,
    isExpired: rem <= 0,
    remainingWhenSolved: rem,
    updatedAt: new Date().toISOString()
  };

  await pool.query(`UPDATE teams SET level_timers = $1::jsonb, updated_at = NOW() WHERE id = $2`, [
    JSON.stringify(currentTimers),
    teamId
  ]);

  return currentTimers;
}

export async function dbSaveTeamTimer({ teamId, levelId, remainingSeconds, duration = 1200 }) {
  if (!teamId || !levelId) return null;
  const rem = Math.max(0, parseInt(remainingSeconds, 10));
  const dur = Math.max(rem, parseInt(duration, 10) || 1200);

  const teamRes = await pool.query(`SELECT level_timers FROM teams WHERE id = $1`, [teamId]);
  const currentTimers = teamRes.rows[0]?.level_timers || {};

  currentTimers[levelId] = {
    duration: dur,
    remainingSeconds: rem,
    timeSpentSeconds: Math.max(0, dur - rem),
    hasStarted: true,
    isExpired: rem <= 0,
    remainingWhenSolved: rem,
    updatedAt: new Date().toISOString()
  };

  await pool.query(`UPDATE teams SET level_timers = $1::jsonb, updated_at = NOW() WHERE id = $2`, [
    JSON.stringify(currentTimers),
    teamId
  ]);

  return currentTimers;
}

export async function dbAdminClearDatabase() {
  await pool.query(`TRUNCATE TABLE hint_reveals, progress, teams CASCADE;`);
  return { success: true };
}

let inMemoryEventStatus = {
  isLive: false,
  introEnabled: true,
  updatedAt: new Date().toISOString()
};

export async function dbGetEventStatus() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS event_settings (
        key text primary key,
        value jsonb,
        updated_at timestamptz default now()
      );
    `);
    const res = await pool.query(`SELECT value FROM event_settings WHERE key = 'event_status'`);
    if (res.rows.length > 0 && res.rows[0].value) {
      inMemoryEventStatus = { ...inMemoryEventStatus, ...res.rows[0].value };
      return inMemoryEventStatus;
    }
  } catch (e) {
    // Database table or query error -> use in-memory fallback
  }
  return inMemoryEventStatus;
}

export async function dbUpdateEventStatus({ isLive, introEnabled }) {
  if (isLive !== undefined) inMemoryEventStatus.isLive = !!isLive;
  if (introEnabled !== undefined) inMemoryEventStatus.introEnabled = !!introEnabled;
  inMemoryEventStatus.updatedAt = new Date().toISOString();

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS event_settings (
        key text primary key,
        value jsonb,
        updated_at timestamptz default now()
      );
    `);
    await pool.query(`
      INSERT INTO event_settings (key, value, updated_at)
      VALUES ('event_status', $1::jsonb, NOW())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `, [JSON.stringify(inMemoryEventStatus)]);
  } catch (e) {
    // In-memory update already succeeded
  }

  return inMemoryEventStatus;
}


