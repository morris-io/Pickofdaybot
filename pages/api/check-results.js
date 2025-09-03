// pages/api/check-results.js
import clientPromise from '../../lib/mongodb';
import { ObjectId } from 'mongodb';
import { getMLBGameResult } from '../../lib/mlbApi';

// Normalize a team label for fuzzy matching
function normTeam(s) {
  if (!s) return '';
  return String(s)
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/\b(fc|mlb)\b/g, '')
    .replace(/angels of anaheim/g, 'angels')
    .replace(/dbacks|d-backs/g, 'diamondbacks')
    .replace(/nyy|ny yankees/g, 'yankees')
    .replace(/nym|ny mets/g, 'mets')
    .replace(/la dodgers|lad/g, 'dodgers')
    .replace(/la angels|anaheim angels|laa/g, 'angels')
    .replace(/st\.?\s*louis/g, 'st louis')
    .replace(/\s+/g, ' ')
    .trim();
}
function matchesAny(pickTeam, candidates) {
  const p = normTeam(pickTeam);
  return candidates.some((c) => {
    const n = normTeam(c);
    return n === p || n.includes(p) || p.includes(n);
  });
}

export default async function handler(req, res) {
  try {
    const client = await clientPromise;
    const col = client.db().collection('picks');

    // Find picks that still need grading
    const unresolved = await col
      .find({
        gamePk: { $ne: null },
        result: { $in: [null, 'pending', 'PENDING'] },
      })
      .toArray();

    if (!unresolved.length) {
      return res
        .status(200)
        .json({ updated: 0, updates: [], note: 'No unresolved picks.' });
    }

    const updates = [];

    for (const p of unresolved) {
      try {
        const gamePk =
          typeof p.gamePk === 'string' ? Number(p.gamePk) : p.gamePk;
        if (!Number.isFinite(gamePk)) continue;

        const r = await getMLBGameResult(gamePk);
        if (!r?.final) continue; // not final yet

        // Decide pick side by ID (future) or fuzzy name match (now)
        let pickWon = false;
        let isPush = !!r.push;

        if (!isPush) {
          // If we stored explicit pickTeam, compare against winnerTeam with a fuzzy check too
          let picked = p.pickTeam || p.pick || '';
          const homeCandidates = [r.homeName].filter(Boolean);
          const awayCandidates = [r.awayName].filter(Boolean);

          let pickSide = null;
          if (picked) {
            if (matchesAny(picked, homeCandidates)) pickSide = 'home';
            else if (matchesAny(picked, awayCandidates)) pickSide = 'away';
          }

          const winnerSide =
            r.homeRuns > r.awayRuns ? 'home' : r.awayRuns > r.homeRuns ? 'away' : 'push';

          if (winnerSide === 'push') isPush = true;
          else pickWon = pickSide && pickSide === winnerSide;
        }

        const result = isPush ? 'push' : pickWon ? 'win' : 'loss';

        await col.updateOne(
          { _id: new ObjectId(p._id) },
          {
            $set: {
              result,
              settledAt: new Date(),
              finalScore: `${r.awayName} ${r.awayRuns} — ${r.homeName} ${r.homeRuns}`,
              winnerTeam: r.winnerTeam,
            },
          }
        );

        updates.push({
          id: p._id.toString(),
          result,
          winnerTeam: r.winnerTeam,
        });
      } catch {
        // keep going
      }
    }

    return res.status(200).json({ updated: updates.length, updates });
  } catch (err) {
    console.error('Check Results Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
