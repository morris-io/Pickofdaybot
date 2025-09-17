// pages/api/generate-nfl-pick.js
import clientPromise from '../../lib/mongodb';
import { getUpcomingNFLGames } from '../../lib/nflApi';
import { simulateNFLGame, calculateNFLOutperformValue } from '../../lib/probability';

// Team rankings list
const teamRankings = {
  'Philadelphia Eagles': 1, 'Green Bay Packers': 2, 'Buffalo Bills': 3, 'Baltimore Ravens': 4,
  'Detroit Lions': 5, 'Los Angeles Rams': 6, 'Los Angeles Chargers': 7, 'Indianapolis Colts': 8,
  'Kansas City Chiefs': 9, 'Tampa Bay Buccaneers': 10, 'Denver Broncos': 11, 'San Francisco 49ers': 12,
  'Washington Commanders': 13, 'Atlanta Falcons': 14, 'Minnesota Vikings': 15, 'Arizona Cardinals': 16,
  'Pittsburgh Steelers': 17, 'Seattle Seahawks': 18, 'Cincinnati Bengals': 19, 'Houston Texans': 20,
  'Dallas Cowboys': 21, 'New England Patriots': 22, 'Jacksonville Jaguars': 23, 'Las Vegas Raiders': 24,
  'Chicago Bears': 25, 'Cleveland Browns': 26, 'Tennessee Titans': 27, 'New York Jets': 28,
  'New York Giants': 29, 'Miami Dolphins': 30, 'New Orleans Saints': 31, 'Carolina Panthers': 32,
};

// Helper function to calculate the star rating based on disparity
function getNFLRating(disparity) {
  if (disparity >= 24) return 5;
  if (disparity >= 13) return 4;
  if (disparity >= 8) return 3;
  if (disparity >= 5) return 2;
  if (disparity >= 1) return 1;
  return 0;
}

// --- Main API Handler ---
export default async function handler(req, res) {
  try {
    const client = await clientPromise;
    const col = client.db().collection('nfl-picks');
    const today = new Date().toISOString().split('T')[0];

    let existingPick = await col.findOne({ date: today });

    // --- Data Backfilling Logic ---
    // If a pick exists but is missing the new data, update it.
    if (existingPick && (typeof existingPick.rating === 'undefined' || typeof existingPick.outperformValue === 'undefined')) {
      console.log(`Backfilling missing data for existing pick: ${existingPick._id}`);
      
      const [homeTeamName, awayTeamName] = existingPick.teams.split(' vs ');
      const homeTeam = { name: homeTeamName, rank: teamRankings[homeTeamName] || 99 };
      const awayTeam = { name: awayTeamName, rank: teamRankings[awayTeamName] || 99 };
      
      const disparity = Math.abs(homeTeam.rank - awayTeam.rank);
      
      const rating = getNFLRating(disparity);
      const simulation = simulateNFLGame(homeTeam, awayTeam);
      const outperformValue = calculateNFLOutperformValue(disparity);

      // Update the object in memory and in the database
      existingPick.rating = rating;
      existingPick.simulation = simulation;
      existingPick.outperformValue = outperformValue;
      
      await col.updateOne(
        { _id: existingPick._id },
        { $set: { 
            rating: rating, 
            simulation: simulation,
            outperformValue: outperformValue 
        }}
      );
    }
    
    if (existingPick) {
      return res.status(200).json({ success: true, pick: existingPick });
    }

    // --- Generate a New Pick ---
    const allUpcomingGames = await getUpcomingNFLGames();

    if (!allUpcomingGames || allUpcomingGames.length === 0) {
        return res.status(200).json({ success: true, pick: null, message: "No upcoming games found." });
    }

    const sortedGames = allUpcomingGames
      .map(game => ({ ...game, commence_time: new Date(game.commence_time) }))
      .sort((a, b) => a.commence_time - b.commence_time);

    const nextGameDate = sortedGames[0].commence_time.toISOString().split('T')[0];
    const gamesOnNextDate = sortedGames.filter(game => game.commence_time.toISOString().split('T')[0] === nextGameDate);

    if (gamesOnNextDate.length === 0) {
        return res.status(200).json({ success: true, pick: null, message: `No games found for ${nextGameDate}` });
    }
    
    let bestDisparity = -1;
    let gameForPick = null;

    for (const game of gamesOnNextDate) {
      const homeRank = teamRankings[game.home_team] || 99;
      const awayRank = teamRankings[game.away_team] || 99;
      const disparity = Math.abs(homeRank - awayRank);

      if (disparity > bestDisparity) {
        bestDisparity = disparity;
        gameForPick = game;
      }
    }

    let bestPick = null;
    if (gameForPick) {
      const homeTeam = { name: gameForPick.home_team, rank: teamRankings[gameForPick.home_team] || 99 };
      const awayTeam = { name: gameForPick.away_team, rank: teamRankings[gameForPick.away_team] || 99 };
      const disparity = Math.abs(homeTeam.rank - awayTeam.rank);
      const pickTeam = homeTeam.rank < awayTeam.rank ? homeTeam.name : awayTeam.name;
      
      const simulation = simulateNFLGame(homeTeam, awayTeam);
      const gameTime = new Date(gameForPick.commence_time).toLocaleString('en-US', {
          timeZone: 'America/New_York',
          dateStyle: 'short',
          timeStyle: 'short',
      });
      
      bestPick = {
        teams: `${homeTeam.name} vs ${awayTeam.name}`,
        pick: pickTeam,
        disparity: disparity,
        rating: getNFLRating(disparity),
        simulation: simulation,
        gameId: gameForPick.id,
        sport: 'NFL',
        gameTime: gameTime,
        outperformValue: calculateNFLOutperformValue(disparity),
      };

      await col.insertOne({ ...bestPick, odds: 'TBD', date: today, createdAt: new Date() });
    }

    return res.status(200).json({ success: true, pick: bestPick });

  } catch (err) {
    console.error('NFL Pick Generation Error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}