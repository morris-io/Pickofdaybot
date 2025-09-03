// pages/api/settle-mlb.js
import clientPromise from '../../lib/mongodb';
import { ObjectId } from 'mongodb';
import { getMLBGameResult } from '../../lib/mlbApi';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const client = await clientPromise;
    const db = client.db();

    // Find MLB picks that can be settled (need gamePk + result pending/null)
    const pending = await db.collection('picks').find({
      sport: 'MLB',
      gamePk: { $exists: true },
      $or: [{ result: { $exists: false } }, { result: 'pending' }, { result: null }],
    }).toArray();

    const updates = [];
    for (const p of pending) {
      const r = await getMLBGameResult(p.gamePk);
      if (!r.final) continue;

      // Determine if our pick won. Prefer explicit pickTeam, else parse from "Pick: X ML".
      const pickTeam = p.pickTeam || (typeof p.pick === 'string' ? p.pick.replace(/\s*ML\s*$/i, '') : null);
      let result = 'loss';
      if (r.push) result = 'push';
      else if (pickTeam && pickTeam === r.winnerTeam) result = 'win';

      updates.push({
        _id: p._id,
        update: {
          result,
          settledAt: new Date(),
          finalScore: `${r.awayName} ${r.awayRuns} — ${r.homeName} ${r.homeRuns}`,
          winnerTeam: r.winnerTeam,
        },
      });
    }

    // Apply updates
    for (const u of updates) {
      await db.collection('picks').updateOne(
        { _id: new ObjectId(u._id) },
        { $set: u.update }
      );
    }

    return res.status(200).json({
      checked: pending.length,
      settled: updates.length,
    });
  } catch (err) {
    console.error('Settle MLB error:', err);
    return res.status(500).json({ error: 'Failed to settle picks' });
  }
}
