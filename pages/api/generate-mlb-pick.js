// pages/api/generate-mlb-pick.js

const API_KEY = '4b15649945da8a6371b2cebc7d203049';

import clientPromise from '../../lib/mongodb';
import {
  getTodayMLBGames,
  getPitcherSeasonWHIP,
} from '../../lib/mlbApi';
import axios from 'axios';

// ---- Odds API constants
const SPORT_KEY = 'baseball_mlb';
const BASE_URL  = 'https://api.the-odds-api.com/v4/sports';
const REGION    = 'us';
const MARKET    = 'h2h';

// --- Helpers ----

function startOfTodayEST() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(now);
  const y = parts.find(p => p.type === 'year').value;
  const m = parts.find(p => p.type === 'month').value;
  const d = parts.find(p => p.type === 'day').value;
  const midnightStr = `${y}-${m}-${d} 00:00:00`;
  return new Date(
    new Date(midnightStr).toLocaleString('en-US', { timeZone: 'America/New_York' })
  );
}

async function fetchOddsForPick(eventId, pickTeam) {
  const url = `${BASE_URL}/${SPORT_KEY}/odds`;
  try {
    const { data: events } = await axios.get(url, {
      params: {
        apiKey:     API_KEY,
        regions:    REGION,
        markets:    MARKET,
        eventIds:   eventId,
        oddsFormat: 'american',
      },
    });
    const evt = events?.[0];
    if (!evt?.bookmakers?.length) return null;

    for (const bm of evt.bookmakers) {
      const mkt = (bm.markets || []).find(m => m.key === MARKET);
      const outcome = mkt?.outcomes?.find(o => o.name === pickTeam);
      if (outcome?.price != null) return outcome.price;
    }
    return null;
  } catch (err) {
    if (err.response?.status === 422) {
      console.warn(`Odds API 422 for eventId ${eventId}`);
      return null;
    }
    console.warn(`Odds fetch error for eventId ${eventId}:`, err.message);
    return null;
  }
}

function starsFromGap(diff) {
  if (diff >= 0.71) return 5;
  if (diff >= 0.47) return 4;
  if (diff >= 0.36) return 3;
  if (diff >= 0.25) return 2;
  return 1;
}

export default async function handler(req, res) {
  try {
    const client = await clientPromise;
    const col    = client.db().collection('picks');
    const todayStart = startOfTodayEST();

    // 1) WHIP pick (one per day)
    let whipPick = await col.findOne({
      algorithm: 'whip',
      createdAt: { $gte: todayStart },
    });

    // If today's WHIP pick exists but still lacks odds, try to refresh them.
    if (whipPick && (!whipPick.odds || whipPick.odds === 'TBD') && whipPick.gamePk && whipPick.pickTeam) {
      const refreshed = await fetchOddsForPick(whipPick.gamePk, whipPick.pickTeam);
      const price     = refreshed ?? 'TBD';
      await col.updateOne({ _id: whipPick._id }, { $set: { odds: price } });
      whipPick.odds = price;
    }

    if (!whipPick) {
      const games = await getTodayMLBGames();
      const candidates = [];

      for (const g of games) {
        const [homeWHIP, awayWHIP] = await Promise.all([
          getPitcherSeasonWHIP(g.homePitcherId),
          getPitcherSeasonWHIP(g.awayPitcherId),
        ]);
        if (homeWHIP == null || awayWHIP == null) continue;

        const diff = Math.abs(homeWHIP - awayWHIP);
        const pickTeam = homeWHIP < awayWHIP ? g.homeTeam : g.awayTeam;

        candidates.push({ game: g, diff, pickTeam, lowerWHIP: Math.min(homeWHIP, awayWHIP) });
      }

      if (candidates.length === 0) {
        return res.status(200).json({ success: true, picks: [] });
      }

      const bigDiffs = candidates.filter(c => c.diff >= 0.25);
      const winner = bigDiffs.length
        ? bigDiffs.reduce((max, c) => (c.diff > max.diff ? c : max))
        : candidates.reduce((min, c) => (c.lowerWHIP < min.lowerWHIP ? c : min));

      const price = (await fetchOddsForPick(winner.game.gamePk, winner.pickTeam)) ?? 'TBD';

      whipPick = {
        algorithm:  'whip',
        sport:      'MLB',
        teams:      `${winner.game.awayTeam} vs ${winner.game.homeTeam}`,
        pickTeam:   winner.pickTeam,
        pick:       `${winner.pickTeam} ML`,
        gamePk:     Number(winner.game.gamePk), // ensure numeric for grading endpoint
        diff:       winner.diff,
        starRating: starsFromGap(winner.diff),
        odds:       price,
        rationale:  winner.diff >= 0.25
          ? `${winner.pickTeam} simulates to outperform their odds by ${winner.diff.toFixed(3)} (≥ 0.25).`
          : `${winner.pickTeam} backed by lower WHIP (${winner.lowerWHIP.toFixed(3)}).`,
        gameTime:   winner.game.gameTime ? new Date(winner.game.gameTime) : null,
        createdAt:  new Date(),
        result:     'pending', // set pending so graders can find it
      };

      await col.insertOne(whipPick);
    }

    // 2) Series pick (optional, one per day)
    let seriesPick = await col.findOne({
      algorithm: 'series',
      createdAt: { $gte: todayStart },
    });

    const canDoSeriesLogic = true;

    if (!seriesPick && canDoSeriesLogic) {
      const games = await getTodayMLBGames();
      const candidates = [];

      for (const g of games) {
        // Your getTodayMLBGames() returns:
        // { gamePk, homeTeam, awayTeam, seriesGameNumber, homeSeriesWins, awaySeriesWins, ... }
        const hasSeriesFields = (
          g.seriesGameNumber != null &&
          g.homeSeriesWins != null &&
          g.awaySeriesWins != null
        );
        if (!hasSeriesFields) continue;

        // Look for Game 3 sweeps (0–2 down angle)
        if (g.seriesGameNumber === 3) {
          if (g.homeSeriesWins === 0 && g.awaySeriesWins === 2) {
            candidates.push({ team: g.homeTeam, game: g });
          }
          if (g.awaySeriesWins === 0 && g.homeSeriesWins === 2) {
            candidates.push({ team: g.awayTeam, game: g });
          }
        }
      }

      if (candidates.length) {
        const best = candidates[0];
        const price = (await fetchOddsForPick(best.game.gamePk, best.team)) ?? 'TBD';

        seriesPick = {
          algorithm:  'series',
          sport:      'MLB',
          teams:      `${best.game.awayTeam} vs ${best.game.homeTeam}`,
          pickTeam:   best.team,
          pick:       `${best.team} Game 3 ML`,
          gamePk:     Number(best.game.gamePk), // ensure numeric
          diff:       null,
          starRating: null,
          odds:       price,
          rationale:  `Down 0–2 angle`,
          gameTime:   best.game.gameTime ? new Date(best.game.gameTime) : null,
          createdAt:  new Date(),
          result:     'pending', // set pending for grading
        };

        await col.insertOne(seriesPick);
      }
    } else if (seriesPick && (!seriesPick.odds || seriesPick.odds === 'TBD') && seriesPick.gamePk && seriesPick.pickTeam) {
      const price = (await fetchOddsForPick(seriesPick.gamePk, seriesPick.pickTeam)) ?? 'TBD';
      await col.updateOne({ _id: seriesPick._id }, { $set: { odds: price } });
      seriesPick.odds = price;
    }

    // Return final picks
    const picks = [whipPick].filter(Boolean);
    if (seriesPick) picks.push(seriesPick);

    return res.status(200).json({ success: true, picks });
  } catch (err) {
    console.error('MLB Pick Generation Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
