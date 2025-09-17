// pages/api/cron/daily-tasks.js
import { handler as generateMlbPick } from '../generate-mlb-pick';
import { handler as generateNflPick } from '../generate-nfl-pick';
import { handler as settleMlbPicks } from '../settle-mlb';

// A helper to create a mock response object for our internal function calls
const mockResponse = () => {
  let _status = 200;
  let _json = {};
  return {
    status: (code) => {
      _status = code;
      return { json: (data) => _json = data };
    },
    json: (data) => _json = data,
    get: () => ({ status: _status, json: _json }),
  };
};

export default async function handler(req, res) {
  // Optional: Add a security check to ensure this can only be run by Vercel
  if (req.headers['x-vercel-cron-secret'] !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const results = {};

  try {
    console.log('--- Running Daily Cron Jobs ---');

    // --- 1. Generate NFL Pick ---
    try {
      console.log('Task 1: Generating NFL pick...');
      const nflRes = mockResponse();
      await generateNflPick({ method: 'POST' }, nflRes); // Simulate a POST request
      results.nflPick = nflRes.get();
      console.log('NFL pick generation finished.');
    } catch (err) {
      console.error('Error generating NFL pick:', err);
      results.nflPick = { error: err.message };
    }

    // --- 2. Generate MLB Pick ---
    try {
      console.log('Task 2: Generating MLB pick...');
      const mlbRes = mockResponse();
      await generateMlbPick({}, mlbRes);
      results.mlbPick = mlbRes.get();
      console.log('MLB pick generation finished.');
    } catch (err) {
      console.error('Error generating MLB pick:', err);
      results.mlbPick = { error: err.message };
    }
    
    // --- 3. Settle Yesterday's MLB Picks ---
    try {
        console.log("Task 3: Settling yesterday's MLB picks...");
        const settleRes = mockResponse();
        await settleMlbPicks({}, settleRes);
        results.settleMlb = settleRes.get();
        console.log('MLB settlement finished.');
    } catch (err) {
        console.error('Error settling MLB picks:', err);
        results.settleMlb = { error: err.message };
    }

    console.log('--- Daily Cron Jobs Finished ---');
    res.status(200).json({ success: true, results });

  } catch (error) {
    console.error('A critical error occurred in the main cron handler:', error);
    res.status(500).json({ success: false, error: 'Cron handler failed', message: error.message });
  }
}