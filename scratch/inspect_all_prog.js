import { pool } from "../apps/web/db.js";

async function inspectAllProgress() {
  const progRes = await pool.query(`
    SELECT p.*, t.team_name, t.created_at as team_created_at
    FROM progress p
    JOIN teams t ON p.team_id = t.id
    ORDER BY t.team_name, p.solved_at ASC
  `);
  console.log("=== ALL PROGRESS ROWS IN DATABASE ===");
  progRes.rows.forEach(r => {
    console.log(`Team: ${r.team_name} | Level: ${r.level_id} | Solved: ${r.solved} | Pts: ${r.points_awarded} | SolvedAt: ${r.solved_at} | Attempts: ${r.attempts}`);
  });

  const hintsRes = await pool.query(`
    SELECT h.*, t.team_name 
    FROM hint_reveals h
    JOIN teams t ON h.team_id = t.id
    ORDER BY t.team_name, h.revealed_at ASC
  `);
  console.log("\n=== ALL HINT REVEALS IN DATABASE ===");
  hintsRes.rows.forEach(h => {
    console.log(`Team: ${h.team_name} | Level: ${h.level_id} | Hint #${h.hint_index} | Deducted: ${h.points_deducted} | RevealedAt: ${h.revealed_at}`);
  });

  await pool.end();
}

inspectAllProgress();
