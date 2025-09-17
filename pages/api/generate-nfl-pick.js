// pages/api/generate-nfl-pick.js
import clientPromise from '../../lib/mongodb';
import axios from 'axios';
import { getWeeklyNFLGames } from '../../lib/nflApi';

// The API key for API-Sports
const API_KEY = process.env.API_SPORTS_NFL_KEY;

// ---- Team Rankings List ----
const teamRankings = {
  'Eagles': 1,
  'Packers': 2,
  'Bills': 3,
  'Ravens': 4,
  'Lions': 5,
  'Rams': 6,
  'Chargers': 7,
  'Colts': 8,
  'Chiefs': 9,
  'Buccaneers': 10,
  'Broncos': 11,
  '49ers': 12,
  'Commanders': 13,
  'Falcons': 14,
  'Vikings': 15,
  'Cardinals': 16,
  'Steelers': 17,
  'Seahawks': 18,
  'Bengals': 19,
  'Texans': 20,
  'Cowboys': 21,
  'Patriots': 22,
  'Jaguars': 23,
  'Raiders': 24,
  'Bears': 25,
  'Browns': 26,
  'Titans': 27,
  'Jets': 28,
  'Giants': 29,
  'Dolphins': 30,
  'Saints': 31,
  'Panthers': 32,
};

// --- Helpers ----

async function findOddsForPick(gameId) {
  const url = `https://v1.american-football.api-sports.io/odds`;
  try {
    const { data } = await axios.get(url, {
      params: {
        game: gameId,
      },
      headers: {
        'x-apisports-key': API_KEY, // Correct header for a direct API-Sports account
      },
    });

    if (data.response && data.response.length > 0) {
      return 'TBD';
    }

    return null;
  } catch (err) {
    console.error('NFL Odds fetch error:', err.message);
    return null;
  }
}

// --- Main Handler ---

export default async function handler(req, res) {
  try {
    const client = await clientPromise;
    const col = client.db().collection('nfl-picks');

    const today = new Date().toISOString().split('T')[0];
    const existingPick = await col.findOne({ date: today });

    if (existingPick) {
      if (existingPick.odds === 'TBD') {
        const odds = await findOddsForPick(existingPick.gameId);
        if (odds) {
          await col.updateOne({ _id: existingPick._id }, { $set: { odds } });
          existingPick.odds = odds;
        }
      }
      return res.status(200).json({ success: true, pick: existingPick });
    }

    const currentSeason = 2025;
    const currentWeek = 3;

    const games = await getWeeklyNFLGames(currentSeason, currentWeek);
    if (games.length === 0) {
      return res.status(200).json({ success: true, pick: null });
    }

    let bestDisparity = -1;
    let bestPick = null;

    for (const game of games) {
      const homeTeamName = game.teams.home.name;
      const awayTeamName = game.teams.away.name;

      const homeRank = teamRankings[homeTeamName] || 99;
      const awayRank = teamRankings[awayTeamName] || 99;

      const disparity = Math.abs(homeRank - awayRank);

      if (disparity > bestDisparity) {
        bestDisparity = disparity;
        const pickTeam = homeRank < awayRank ? homeTeamName : awayTeamName;
        
        bestPick = {
          teams: `${homeTeamName} vs ${awayTeamName}`,
          pick: pickTeam,
          disparity: disparity,
          gameId: game.id,
          sport: 'NFL',
        };
      }
    }

    if (bestPick) {
      const odds = await findOddsForPick(bestPick.gameId);
      await col.insertOne({
        ...bestPick,
        odds: odds ?? 'TBD',
        date: today,
        createdAt: new Date(),
      });
    }

    return res.status(200).json({ success: true, pick: bestPick });

  } catch (err) {
    console.error('NFL Pick Generation Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}