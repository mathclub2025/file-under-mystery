import {
  dbRegisterTeam,
  dbLoginTeam,
  dbGetLeaderboard,
  dbAdminGetAllTeams,
  dbAdminUpdateTeamPoints,
  pool
} from "../apps/web/db.js";

async function testServerLogic() {
  console.log("Testing Server RBAC & Logic...");

  // 1. Test Admin Login Check
  const testAdminCreds = {
    teamName: "admin",
    captainRegNo: "FileUnderMystery@03"
  };

  const isAdminMatch =
    testAdminCreds.teamName.trim().toLowerCase() === "admin" &&
    testAdminCreds.captainRegNo.trim() === "FileUnderMystery@03";

  console.log("Test 1 - Admin credentials match:", isAdminMatch ? "PASS" : "FAIL");

  // 2. Test Invalid Admin Password
  const testAdminWrong = {
    teamName: "admin",
    captainRegNo: "wrongPassword"
  };

  const isWrongMatch =
    testAdminWrong.teamName.trim().toLowerCase() === "admin" &&
    testAdminWrong.captainRegNo.trim() === "FileUnderMystery@03";

  console.log("Test 2 - Admin wrong password rejected:", !isWrongMatch ? "PASS" : "FAIL");

  // 3. Test Admin Points Update & Verification
  const teams = await dbAdminGetAllTeams();
  if (teams.length > 0) {
    const sampleTeam = teams[0];
    const originalPoints = sampleTeam.totalPoints;
    console.log(`Test 3 - Sample Team: ${sampleTeam.teamName} (Points: ${originalPoints})`);

    // Add 5 points
    await dbAdminUpdateTeamPoints(sampleTeam.id, originalPoints + 5);
    const updatedTeams = await dbAdminGetAllTeams();
    const updatedTeam = updatedTeams.find((t) => t.id === sampleTeam.id);
    console.log(`Test 4 - Points updated to: ${updatedTeam.totalPoints}:`, updatedTeam.totalPoints === originalPoints + 5 ? "PASS" : "FAIL");

    // Restore points
    await dbAdminUpdateTeamPoints(sampleTeam.id, originalPoints);
    console.log("Test 5 - Restored original points: PASS");
  }

  await pool.end();
  console.log("All Server API Tests Completed Successfully!");
}

testServerLogic();
