// pages/api/register.js
import clientPromise from '../../lib/mongodb';
import { hash } from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end(); // Method not allowed
  }

  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const users = db.collection('users');

    const existingUser = await users.findOne({ email });

    if (existingUser) {
      return res.status(409).json({ message: 'User already exists.' });
    }

    const hashedPassword = await hash(password, 12);

    await users.insertOne({
      name,
      email,
      password: hashedPassword,
      role: 'user', // ✅ ADD THIS LINE
      createdAt: new Date(),
    });

    return res.status(201).json({ message: 'User created successfully!' });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}
