import { pool } from "../apps/web/db.js";

async function fixAllTeamScores() {
  console.log("Fixing all team scores in DB to match SUM(progress.points_awarded)...");

  const teams = await pool.query(`SELECT id, team_name, total_points FROM teams`);
  for (const t of teams.rows) {
    const sumRes = await pool.query(`
      SELECT COALESCE(SUM(points_awarded), 0) AS total_pts
      FROM progress
      WHERE team_id = $1 AND solved = true
    `, [t.id]);

    const correctPts = parseInt(sumRes.rows[0]?.total_pts || 0, 10);
    await pool.query(`UPDATE teams SET total_points = $1 WHERE id = $2`, [correctPts, t.id]);
    console.log(`Team "${t.team_name}": ${t.total_points} -> ${correctPts} pts`);
  }

  await pool.end();
  console.log("All team scores updated successfully!");
}

fixAllTeamScores();
