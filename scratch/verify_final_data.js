import { pool, dbAdminGetAllTeams, dbGetLeaderboard } from "../apps/web/db.js";

async function verifyFinalData() {
  console.log("=== FINAL VERIFICATION OF TEAMS & LEADERBOARD ===");

  const teams = await dbAdminGetAllTeams();
  teams.forEach((t) => {
    console.log(`\nTeam: "${t.teamName}" (${t.captainRegNo})`);
    console.log(`- Net Score: ${t.totalPoints} pts`);
    console.log(`- Solved Count: ${t.solvedCount} / 13`);
    console.log(`- Total Time Spent: ${Math.floor(t.totalTimeSeconds/60)}m ${t.totalTimeSeconds%60}s`);

    const l6 = t.progress.find(p => p.level_id === "level6");
    console.log(`- Level 6 progress row: solved = ${l6?.solved}, points = ${l6?.points_awarded}`);
  });

  const lb = await dbGetLeaderboard();
  console.log("\n=== PUBLIC LEADERBOARD ===");
  lb.forEach((entry) => {
    console.log(`Rank #${entry.rank}: "${entry.name}" - ${entry.points} pts - Solved: ${entry.solved}/13 - Time: ${Math.floor(entry.timeSeconds/60)}m ${entry.timeSeconds%60}s`);
  });

  await pool.end();
}

verifyFinalData();
