import { pool } from "../apps/web/db.js";

async function checkSchema() {
  const tRes = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'teams'
  `);
  console.log("Teams columns:", tRes.rows);

  const pRes = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'progress'
  `);
  console.log("Progress columns:", pRes.rows);

  // Check Team Marvels progress rows
  const marvels = await pool.query(`
    SELECT id, team_name, total_points, current_level, created_at 
    FROM teams 
    WHERE team_name ILIKE '%marvel%'
  `);
  console.log("Marvels Team:", marvels.rows);

  if (marvels.rows.length > 0) {
    const marvelsProg = await pool.query(`
      SELECT * FROM progress WHERE team_id = $1
    `, [marvels.rows[0].id]);
    console.log("Marvels Progress Rows:", marvelsProg.rows);
  }

  await pool.end();
}

checkSchema();
