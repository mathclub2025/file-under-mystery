import {
  pool,
  dbAdminGetAllTeams,
  dbGetLeaderboard,
  dbAdminUpdateLevelTimer,
  dbGetTeamProgress
} from "../apps/web/db.js";

async function testTimerAndPoints() {
  console.log("=== Testing Timer and Point Synchronizations ===");

  // 1. Fetch all teams
  const teams = await dbAdminGetAllTeams();
  console.log("Teams count:", teams.length);
  teams.forEach((t) => {
    console.log(`Team: ${t.teamName} | Pts: ${t.totalPoints} | Solved: ${t.solvedCount} | Time: ${t.totalTimeSeconds}s`);
  });

  // 2. Test Leaderboard Time
  const lb = await dbGetLeaderboard();
  console.log("\nLeaderboard Standings:");
  lb.forEach((entry) => {
    console.log(`Rank #${entry.rank}: ${entry.name} - ${entry.points} pts - Solved: ${entry.solved} - Time: ${entry.timeSeconds}s`);
  });

  // 3. Test Admin Timer Update on first team
  if (teams.length > 0) {
    const targetTeam = teams[0];
    console.log(`\nTesting Timer Update for ${targetTeam.teamName}...`);
    const newTimers = await dbAdminUpdateLevelTimer({
      teamId: targetTeam.id,
      levelId: "level1",
      remainingSeconds: 650,
      duration: 1200
    });
    console.log("Updated Level 1 Timer:", newTimers.level1);

    const checkTeam = await dbGetTeamProgress(targetTeam.id);
    console.log("Team Progress Fetched Team Level 1 Timer:", checkTeam.team?.level_timers?.level1);
  }

  await pool.end();
  console.log("\n=== Test Completed Successfully ===");
}

testTimerAndPoints();
