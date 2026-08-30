import { pool, dbAdminGetAllTeams } from "../apps/web/db.js";

async function verifyAdminTeamsOutput() {
  const teams = await dbAdminGetAllTeams();
  console.log("=== DB ADMIN GET ALL TEAMS VERIFICATION ===");
  teams.forEach((t) => {
    console.log(`\nTeam: ${t.teamName} (${t.captainRegNo})`);
    console.log(`- Net Score: ${t.totalPoints} pts`);
    console.log(`- Gross Solve Points: ${t.grossPoints} pts`);
    console.log(`- Hint Deductions: -${t.hintDeductions} pts`);
    console.log(`- Solved: ${t.solvedCount} / 13`);
    console.log(`- Total Time Spent: ${Math.floor(t.totalTimeSeconds/60)}m ${t.totalTimeSeconds%60}s`);

    const l1 = t.levelTimers.level1;
    const l3 = t.levelTimers.level3;
    console.log(`- Level 1: Time Taken: ${Math.floor(l1.timeSpentSeconds/60)}m ${l1.timeSpentSeconds%60}s | Time Left: ${Math.floor(l1.remainingSeconds/60)}m ${l1.remainingSeconds%60}s`);
    console.log(`- Level 3: Time Taken: ${Math.floor(l3.timeSpentSeconds/60)}m ${l3.timeSpentSeconds%60}s | Time Left: ${Math.floor(l3.remainingSeconds/60)}m ${l3.remainingSeconds%60}s`);
  });

  await pool.end();
}

verifyAdminTeamsOutput();
