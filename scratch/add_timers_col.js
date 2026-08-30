import { pool } from "../apps/web/db.js";

async function addTimersColumn() {
  try {
    await pool.query(`
      ALTER TABLE teams ADD COLUMN IF NOT EXISTS level_timers jsonb DEFAULT '{}'::jsonb;
    `);
    console.log("Column level_timers ensured on teams table: PASS");
  } catch (err) {
    console.error("Alter table error:", err);
  } finally {
    await pool.end();
  }
}

addTimersColumn();
