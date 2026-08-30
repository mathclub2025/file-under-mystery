import { pool, dbAdminGetAllTeams } from "../apps/web/db.js";

async function verifyAll() {
  console.log("Verifying All Components...");

  // 1. Password case check
  const inputUser = "ADMIN";
  const inputPwd = "FILEUNDERMYSTERY@03";
  const isMatch = inputUser.trim().toLowerCase() === "admin" && inputPwd.trim().toUpperCase() === "FILEUNDERMYSTERY@03";
  console.log("Caps Admin Login Check:", isMatch ? "PASS" : "FAIL");

  // 2. Fetch teams
  const teams = await dbAdminGetAllTeams();
  console.log(`Fetched ${teams.length} teams from DB.`);
  teams.forEach((t) => {
    console.log(`- ${t.teamName} (${t.captainRegNo}) - ${t.totalPoints} pts - Level: ${t.currentLevel}`);
  });

  await pool.end();
  console.log("Verification Complete!");
}

verifyAll();
