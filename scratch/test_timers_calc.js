import { pool } from "../apps/web/db.js";

async function testTimerCalc() {
  const teamRes = await pool.query(`SELECT * FROM teams WHERE team_name ILIKE '%marvel%'`);
  const team = teamRes.rows[0];

  const progRes = await pool.query(`SELECT * FROM progress WHERE team_id = $1 ORDER BY solved_at ASC`, [team.id]);
  const progressRows = progRes.rows;

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

  let previousSolveTime = team.created_at ? new Date(team.created_at).getTime() : null;
  let totalTimeSpent = 0;

  console.log("=== LEVEL BY LEVEL TIME TAKEN FOR TEAM MARVELS ===");
  LEVEL_ORDER.forEach((lvlId) => {
    const dur = DEFAULT_DURATIONS[lvlId] || 1200;
    const prog = progMap[lvlId];
    if (prog && prog.solved && prog.solved_at && previousSolveTime) {
      const thisSolveTime = new Date(prog.solved_at).getTime();
      const elapsedSeconds = Math.max(0, Math.round((thisSolveTime - previousSolveTime) / 1000));
      const actualSpent = Math.min(dur, Math.max(15, elapsedSeconds));
      const rem = Math.max(0, dur - actualSpent);
      totalTimeSpent += actualSpent;
      console.log(`${lvlId.toUpperCase()}: Solved! Time Taken: ${Math.floor(actualSpent/60)}m ${actualSpent%60}s | Time Left: ${Math.floor(rem/60)}m ${rem%60}s / 20m 00s (Pts: ${prog.points_awarded})`);
      previousSolveTime = thisSolveTime;
    }
  });

  console.log(`\nTotal Active Time Spent across 13 cases: ${Math.floor(totalTimeSpent/60)}m ${totalTimeSpent%60}s`);

  await pool.end();
}

testTimerCalc();
