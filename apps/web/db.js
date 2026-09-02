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

  // 1. Check if team exists by name or by captain registration number / email
  const existingRes = await pool.query(
    `SELECT id, team_name, captain_name, captain_reg_no, members, total_points, current_level, created_at
     FROM teams
     WHERE LOWER(team_name) = LOWER($1) 
        OR UPPER(captain_reg_no) = UPPER($2) 
        OR UPPER(captain_email) = UPPER($2)
     LIMIT 1;`,
    [cleanTeamName, cleanCaptainRegNo]
  );

  if (existingRes.rows.length > 0) {
    const existingTeam = existingRes.rows[0];
    const updateRes = await pool.query(
      `UPDATE teams 
       SET team_name = $1,
           captain_name = $2,
           captain_reg_no = $3,
           captain_email = $3,
           members = $4::jsonb,
           updated_at = NOW()
       WHERE id = $5
       RETURNING id, team_name, captain_name, captain_reg_no, members, total_points, current_level, created_at;`,
      [cleanTeamName, cleanCaptainName, cleanCaptainRegNo, membersJson, existingTeam.id]
    );
    return updateRes.rows[0];
  }

  // 2. Otherwise insert new team
  const insertQuery = `
    INSERT INTO teams (team_name, captain_email, captain_name, captain_reg_no, members, total_points, current_level)
    VALUES ($1, $2, $3, $4, $5::jsonb, 0, 'level1')
    RETURNING id, team_name, captain_name, captain_reg_no, members, total_points, current_level, created_at;
  `;

  const res = await pool.query(insertQuery, [
    cleanTeamName,
    cleanCaptainRegNo,
    cleanCaptainName,
    cleanCaptainRegNo,
    membersJson
  ]);

  return res.rows[0];
}

export async function dbLoginTeam({ teamName, captainRegNo }) {
  const cleanTeamName = (teamName || "").trim();
  const cleanCaptainRegNo = (captainRegNo || "").trim();

  const query = `
    SELECT id, team_name, captain_name, captain_reg_no, members, total_points, current_level, created_at
    FROM teams
    WHERE (team_name = $1 OR LOWER(team_name) = LOWER($1))
      AND (captain_reg_no = $2 OR captain_email = $2 OR UPPER(captain_reg_no) = UPPER($2));
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

export async function resolveTeamId(teamId) {
  if (!teamId) return null;
  const strId = String(teamId).trim();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(strId);
  if (isUuid) {
    try {
      const check = await pool.query(`SELECT id FROM teams WHERE id = $1`, [strId]);
      if (check.rows.length > 0) return check.rows[0].id;
    } catch (e) {}
  }

  // Look up by team name, registration number, or captain email
  const cleanName = strId.replace(/^local_|^team_/, "").replace(/_/g, " ").trim();
  try {
    const search = await pool.query(
      `SELECT id FROM teams 
       WHERE LOWER(team_name) = LOWER($1) 
          OR UPPER(captain_reg_no) = UPPER($1) 
          OR UPPER(captain_email) = UPPER($1)
          OR LOWER(team_name) = LOWER($2)
       LIMIT 1`,
      [cleanName, strId]
    );
    if (search.rows.length > 0) return search.rows[0].id;

    // Auto-create team row if not found with unique reg/email to prevent unique collision
    const uniqueSuffix = Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
    const autoReg = `LOCAL_${uniqueSuffix}`;
    const autoName = cleanName || `Team_${uniqueSuffix}`;

    const inserted = await pool.query(
      `INSERT INTO teams (team_name, captain_name, captain_reg_no, captain_email, members, total_points, current_level)
       VALUES ($1, 'Lead Investigator', $2, $2, '[]'::jsonb, 0, 'level1')
       RETURNING id;`,
      [autoName, autoReg]
    );
    return inserted.rows[0]?.id || null;
  } catch (e) {
    console.warn("resolveTeamId fallback warning:", e.message);
    return null;
  }
}

export async function dbRecordProgress({
  teamId,
  levelId,
  solved,
  pointsAwarded,
  remainingSeconds,
  timeSpentSeconds,
  attempts = 1
}) {
  const realTeamId = await resolveTeamId(teamId);
  if (!realTeamId || !levelId) return null;

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
    realTeamId,
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

  const scoreRes = await pool.query(sumQuery, [realTeamId]);
  const netScore = scoreRes.rows[0]?.net_score || 0;

  // Advance to next active level in sequence
  const LEVEL_ORDER = [
    "level1", "level2", "level3", "level4",
    "level5", "level6", "level7", "level8",
    "level9", "level10", "level11", "level12",
    "final"
  ];
  const idx = LEVEL_ORDER.indexOf(levelId);
  const nextActiveLevel = (idx !== -1 && idx < LEVEL_ORDER.length - 1) ? LEVEL_ORDER[idx + 1] : "final";

  // Retrieve current level_timers JSON from teams table
  const teamRowRes = await pool.query(`SELECT level_timers, current_level FROM teams WHERE id = $1`, [realTeamId]);
  const currentTimers = teamRowRes.rows[0]?.level_timers || {};

  const dur = 1500;
  const rem = remainingSeconds !== undefined
    ? Math.max(0, parseInt(remainingSeconds, 10))
    : (solved ? 1020 : 0);
  const spent = timeSpentSeconds !== undefined
    ? Math.max(0, parseInt(timeSpentSeconds, 10))
    : Math.max(0, dur - rem);

  const updatedTimers = {
    ...currentTimers,
    [levelId]: {
      duration: dur,
      remainingSeconds: rem,
      timeSpentSeconds: spent,
      hasStarted: true,
      isExpired: !solved && rem <= 0,
      remainingWhenSolved: solved ? rem : 0
    }
  };

  // Update teams table
  await pool.query(
    `UPDATE teams 
     SET total_points = $1, current_level = $2, level_timers = $3::jsonb, updated_at = NOW() 
     WHERE id = $4`,
    [netScore, nextActiveLevel, JSON.stringify(updatedTimers), realTeamId]
  );

  return {
    progress: progressRes.rows[0],
    netScore,
    currentLevel: nextActiveLevel
  };
}

export async function dbRecordHintReveal({ teamId, levelId, hintIndex, pointsDeducted }) {
  const realTeamId = await resolveTeamId(teamId);
  if (!realTeamId || !levelId) return null;

  const query = `
    INSERT INTO hint_reveals (team_id, level_id, hint_index, points_deducted, revealed_at)
    VALUES ($1, $2, $3, $4, NOW())
    ON CONFLICT (team_id, level_id, hint_index)
    DO NOTHING
    RETURNING *;
  `;

  const hintRes = await pool.query(query, [realTeamId, levelId, hintIndex, pointsDeducted || 0]);

  // Recalculate total team points
  const sumQuery = `
    SELECT COALESCE(SUM(points_awarded), 0) AS net_score
    FROM progress
    WHERE team_id = $1 AND solved = true;
  `;

  const scoreRes = await pool.query(sumQuery, [realTeamId]);
  const netScore = scoreRes.rows[0]?.net_score || 0;

  await pool.query(`UPDATE teams SET total_points = $1, updated_at = NOW() WHERE id = $2`, [
    netScore,
    realTeamId
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
    level1: 1500, level2: 1500, level3: 1500, level4: 1500,
    level5: 1500, level6: 1500, level7: 1500, level8: 1500,
    level9: 1500, level10: 1500, level11: 1500, level12: 1500,
    final: 1500
  };

  const progMap = {};
  progressRows.forEach((p) => {
    progMap[p.level_id] = p;
  });

  LEVEL_ORDER.forEach((lvlId) => {
    const dur = DEFAULT_DURATIONS[lvlId] || 1500;
    const explicit = levelTimers && levelTimers[lvlId];
    const prog = progMap[lvlId];

    // Priority 1: If explicit level timer exists from client or admin
    if (explicit && explicit.remainingSeconds !== undefined) {
      const rem = Math.max(0, parseInt(explicit.remainingSeconds, 10));
      const spent = explicit.timeSpentSeconds !== undefined
        ? parseInt(explicit.timeSpentSeconds, 10)
        : Math.max(0, (explicit.duration || dur) - rem);
      result[lvlId] = {
        duration: explicit.duration || dur,
        remainingSeconds: rem,
        timeSpentSeconds: spent,
        hasStarted: explicit.hasStarted !== undefined ? explicit.hasStarted : true,
        isExpired: rem <= 0,
        remainingWhenSolved: rem
      };
      return;
    }

    // Priority 2: If progress row exists
    if (prog) {
      if (prog.solved) {
        // Solved level without explicit timer
        const spent = 180; // 3 mins default
        const rem = Math.max(0, dur - spent);
        result[lvlId] = {
          duration: dur,
          remainingSeconds: rem,
          timeSpentSeconds: spent,
          hasStarted: true,
          isExpired: false,
          remainingWhenSolved: rem
        };
      } else {
        // Timed out / failed level
        result[lvlId] = {
          duration: dur,
          remainingSeconds: 0,
          timeSpentSeconds: dur,
          hasStarted: true,
          isExpired: true,
          remainingWhenSolved: 0
        };
      }
      return;
    }

    // Priority 3: Not started yet
    result[lvlId] = {
      duration: dur,
      remainingSeconds: dur,
      timeSpentSeconds: 0,
      hasStarted: false,
      isExpired: false,
      remainingWhenSolved: dur
    };
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

  const realTeamId = await resolveTeamId(teamId);
  if (!realTeamId) return { team: null, progress: [], hints: [] };

  const teamRes = await pool.query(
    `SELECT id, team_name, captain_name, captain_reg_no, total_points, current_level, level_timers, created_at FROM teams WHERE id = $1`,
    [realTeamId]
  );

  const progressRes = await pool.query(
    `SELECT level_id, solved, points_awarded, attempts, solved_at FROM progress WHERE team_id = $1 ORDER BY solved_at ASC`,
    [realTeamId]
  );
  const hintsRes = await pool.query(
    `SELECT level_id, hint_index, points_deducted, revealed_at FROM hint_reveals WHERE team_id = $1`,
    [realTeamId]
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

export async function dbAdminUpdateLevelTimer({ teamId, levelId, remainingSeconds, duration = 1500 }) {
  if (!teamId || !levelId) throw new Error("teamId and levelId are required");
  const realTeamId = await resolveTeamId(teamId);
  if (!realTeamId) throw new Error("Team not found");

  const rem = Math.max(0, parseInt(remainingSeconds, 10));
  const dur = Math.max(rem, parseInt(duration, 10) || 1500);

  const teamRes = await pool.query(`SELECT level_timers FROM teams WHERE id = $1`, [realTeamId]);
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
    realTeamId
  ]);

  return currentTimers;
}

export async function dbSaveTeamTimer({ teamId, levelId, remainingSeconds, duration = 1500 }) {
  if (!teamId || !levelId) return null;
  const realTeamId = await resolveTeamId(teamId);
  if (!realTeamId) return null;

  const rem = Math.max(0, parseInt(remainingSeconds, 10));
  const dur = Math.max(rem, parseInt(duration, 10) || 1500);

  const teamRes = await pool.query(`SELECT level_timers FROM teams WHERE id = $1`, [realTeamId]);
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
    realTeamId
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
  phase2Unlocked: true,
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

export async function dbUpdateEventStatus({ isLive, introEnabled, phase2Unlocked }) {
  if (isLive !== undefined) inMemoryEventStatus.isLive = !!isLive;
  if (introEnabled !== undefined) inMemoryEventStatus.introEnabled = !!introEnabled;
  if (phase2Unlocked !== undefined) inMemoryEventStatus.phase2Unlocked = !!phase2Unlocked;
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


