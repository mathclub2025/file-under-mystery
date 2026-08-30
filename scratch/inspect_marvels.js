import { pool } from "../apps/web/db.js";

async function inspectMarvels() {
  const teamRes = await pool.query(`SELECT * FROM teams WHERE team_name ILIKE '%marvel%'`);
  console.log("Team:", teamRes.rows);

  if (teamRes.rows.length > 0) {
    const teamId = teamRes.rows[0].id;
    const progRes = await pool.query(`SELECT * FROM progress WHERE team_id = $1 ORDER BY solved_at ASC`, [teamId]);
    console.log("Progress rows:", progRes.rows);

    const hintsRes = await pool.query(`SELECT * FROM hint_reveals WHERE team_id = $1`, [teamId]);
    console.log("Hints rows:", hintsRes.rows);

    const sumProg = progRes.rows.reduce((acc, r) => acc + (r.points_awarded || 0), 0);
    const sumHints = hintsRes.rows.reduce((acc, r) => acc + (r.points_deducted || 0), 0);
    console.log("Sum progress points awarded:", sumProg);
    console.log("Sum hint deductions:", sumHints);
    console.log("Calculated net score:", sumProg - sumHints);
  }

  await pool.end();
}

inspectMarvels();
