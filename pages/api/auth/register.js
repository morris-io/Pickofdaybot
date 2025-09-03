// pages/api/auth/register.js

import clientPromise from '../../../lib/mongodb'
import { hash } from 'bcryptjs'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { name, email, password } = req.body
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Missing fields' })
  }

  try {
    const client = await clientPromise
    const users = client.db().collection('users')

    const existing = await users.findOne({ email })
    if (existing) {
      return res.status(409).json({ error: 'User already exists' })
    }

    const hashed = await hash(password, 12)

    const result = await users.insertOne({
      name,
      email,
      password: hashed,
      role: 'user',
      isSubscribed: false, // ✅ Ensure this is included
      createdAt: new Date(),
    })

    return res.status(201).json({ userId: result.insertedId })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
