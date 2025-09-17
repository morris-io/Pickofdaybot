// lib/probability.js

/**
 * Simulates an MLB game score based on team ratings.
 * Higher rating increases the chance of scoring more runs.
 */
export function simulateMLBGame(team1, team2) {
  const betterTeam = team1.rating > team2.rating ? team1 : team2;
  const worseTeam = team1.rating > team2.rating ? team2 : team1;

  const innings = [];
  let betterTeamTotalScore = 0;
  let worseTeamTotalScore = 0;

  for (let i = 1; i <= 9; i++) {
    let betterTeamInningScore = Math.floor(Math.random() * 3 * (betterTeam.rating / worseTeam.rating));
    let worseTeamInningScore = Math.floor(Math.random() * 2);

    innings.push({
      inning: i,
      [betterTeam.name]: betterTeamInningScore,
      [worseTeam.name]: worseTeamInningScore,
    });

    betterTeamTotalScore += betterTeamInningScore;
    worseTeamTotalScore += worseTeamInningScore;
  }

  if (betterTeamTotalScore === worseTeamTotalScore) {
    betterTeamTotalScore += 1;
    innings[8][betterTeam.name] += 1;
  }

  const winner = betterTeamTotalScore > worseTeamTotalScore ? betterTeam.name : worseTeam.name;

  return {
    winner: winner,
    finalScore: {
      [betterTeam.name]: betterTeamTotalScore,
      [worseTeam.name]: worseTeamTotalScore,
    },
    innings: innings,
  };
}

/**
 * Simulates a 4-quarter NFL game, with scores based on 3s and 7s.
 * @param {object} team1 - { name: string, rank: number }
 * @param {object} team2 - { name: string, rank: number }
 * @returns {object} - An object containing the final score and quarter-by-quarter breakdown.
 */
export function simulateNFLGame(team1, team2) {
  const betterTeam = team1.rank < team2.rank ? team1 : team2;
  const worseTeam = team1.rank < team2.rank ? team2 : team1;

  const quarters = [];
  let betterTeamTotalScore = 0;
  let worseTeamTotalScore = 0;

  const advantage = 1 - (betterTeam.rank / 33); // Advantage for the better-ranked team

  for (let i = 1; i <= 4; i++) {
    let betterTeamQuarterScore = 0;
    let worseTeamQuarterScore = 0;

    // Simulate 2-3 scoring opportunities per team per quarter
    for (let j = 0; j < 3; j++) {
      // Better team scoring chance
      if (Math.random() < 0.25 * (1 + advantage)) {
        betterTeamQuarterScore += Math.random() < 0.7 ? 7 : 3; // 70% chance of TD
      }
      // Worse team scoring chance
      if (Math.random() < 0.20 / (1 + advantage)) {
        worseTeamQuarterScore += Math.random() < 0.6 ? 7 : 3;
      }
    }
    
    quarters.push({
      quarter: i,
      [betterTeam.name]: betterTeamQuarterScore,
      [worseTeam.name]: worseTeamQuarterScore,
    });

    betterTeamTotalScore += betterTeamQuarterScore;
    worseTeamTotalScore += worseTeamQuarterScore;
  }

  // Ensure no ties
  if (betterTeamTotalScore === worseTeamTotalScore) {
    betterTeamTotalScore += 3;
    quarters[3][betterTeam.name] += 3; // Add a field goal to the 4th quarter
  }

  const winner = betterTeamTotalScore > worseTeamTotalScore ? betterTeam.name : worseTeam.name;

  return {
    winner: winner,
    finalScore: {
      [betterTeam.name]: betterTeamTotalScore,
      [worseTeam.name]: worseTeamTotalScore,
    },
    quarters: quarters,
  };
}

/**
 * Calculates the probability of the favorite winning based on disparity.
 */
export function calculateWinProbability(disparity) {
  const baseProb = 0.5;
  const advantage = disparity * 0.015;
  return Math.min(baseProb + advantage, 0.95);
}

/**
 * Calculates a value for how much a team is expected to outperform
 * based on the disparity in team rankings for the NFL.
 * @param {number} disparity The difference in rank between the two teams.
 * @returns {string} A formatted string representing the outperform value.
 */
export function calculateNFLOutperformValue(disparity) {
    const value = 0.25 + (disparity / 31) * 1.5;
    return value.toFixed(3);
}