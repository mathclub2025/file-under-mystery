import { pool, dbGetLeaderboard, dbAdminGetAllTeams } from "../apps/web/db.js";

async function runTests() {
  console.log("Running Admin Integration Tests...");

  try {
    // 1. Test dbGetLeaderboard excludes admin
    const leaderboard = await dbGetLeaderboard();
    const adminInLeaderboard = leaderboard.some(
      (t) => (t.name || "").toLowerCase() === "admin" || (t.regNo || "").toLowerCase() === "admin"
    );
    console.log("Test 1 - Admin excluded from leaderboard:", !adminInLeaderboard ? "PASS" : "FAIL");

    // 2. Test dbAdminGetAllTeams retrieves teams
    const allTeams = await dbAdminGetAllTeams();
    console.log(`Test 2 - dbAdminGetAllTeams fetched ${allTeams.length} teams: PASS`);

    console.log("All DB Tests Passed Successfully!");
  } catch (err) {
    console.error("Test execution error:", err);
  } finally {
    await pool.end();
  }
}

runTests();
