// pages/api/picks/index.js
import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const client = await clientPromise;
      const db = client.db();
      const {
        sport,
        teams,
        pick,
        odds,
        confidence,
        rationale,
        gameTime,
        algorithm,
        starRating,
        gamePk,
        pickTeam,
      } = req.body;

      if (!sport || !teams || !pick) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const result = await db.collection('picks').insertOne({
        sport,
        teams,
        pick,
        odds: odds ?? 'TBD',
        confidence: confidence ?? null,
        rationale: rationale ?? null,
        gameTime: gameTime ? new Date(gameTime) : null,
        algorithm: algorithm ?? null,
        starRating: starRating ?? null,
        gamePk: gamePk ?? null,
        pickTeam: pickTeam ?? null,
        result: null, // <-- Add this field to track win/loss
        createdAt: new Date(),
      });

      res.status(201).json({ message: 'Pick created', id: result.insertedId });
    } catch (error) {
      console.error('Create Pick Error:', error);
      res.status(500).json({ message: 'Something went wrong' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
