// pages/api/picks/[id].js
import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  const {
    query: { id },
    method,
  } = req;

  const client = await clientPromise;
  const db = client.db();

  switch (method) {
    case 'GET':
      try {
        const pick = await db.collection('picks').findOne({ _id: new ObjectId(id) });

        if (!pick) {
          return res.status(404).json({ message: 'Pick not found' });
        }

        return res.status(200).json(pick);
      } catch (error) {
        return res.status(500).json({ message: 'Error retrieving pick', error });
      }

    default:
      res.setHeader('Allow', ['GET']);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}
