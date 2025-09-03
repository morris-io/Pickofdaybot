// pages/api/generate-pick.js
import clientPromise from '../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests allowed' });
  }

  try {
    const client = await clientPromise;
    const db = client.db();

    //
    const generatedPick = {
      sport: 'NBA',
      teams: 'Lakers vs Celtics',
      odds: '+150',
      confidence: 'High',
      gameTime: '2025-07-22T19:30:00Z',
      createdAt: new Date(),
      source: 'algorithm' // optional for filtering later
    };

    await db.collection('picks').insertOne(generatedPick);

    res.status(200).json({ message: 'Pick generated successfully', pick: generatedPick });
  } catch (error) {
    console.error('Error generating pick:', error);
    res.status(500).json({ error: 'Failed to generate pick' });
  }
}
