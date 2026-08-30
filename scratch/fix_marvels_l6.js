import { pool } from "../apps/web/db.js";

async function fixMarvelsL6() {
  const teamRes = await pool.query(`SELECT id FROM teams WHERE team_name ILIKE '%marvel%'`);
  if (teamRes.rows.length > 0) {
    const teamId = teamRes.rows[0].id;
    await pool.query(`
      UPDATE progress 
      SET solved = false 
      WHERE team_id = $1 AND level_id = 'level6'
    `, [teamId]);
    console.log("Updated Level 6 for Team Marvels to solved = false: PASS");
  }
  await pool.end();
}

fixMarvelsL6();
