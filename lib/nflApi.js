// lib/nflApi.js
import axios from 'axios';

// IMPORTANT: Make sure to add ODDS_API_KEY to your .env.local file
const API_KEY = process.env.ODDS_API_KEY;
const BASE_URL = 'https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds/';

/**
 * Fetches upcoming NFL games from The Odds API.
 */
export async function getUpcomingNFLGames() {
  if (!API_KEY) {
    throw new Error("The Odds API key is missing. Please add ODDS_API_KEY to your .env.local file.");
  }

  try {
    const response = await axios.get(BASE_URL, {
      params: {
        apiKey: API_KEY,
        regions: 'us', // or 'eu', 'uk', 'au'
        markets: 'h2h', // Head-to-head market for winner
        oddsFormat: 'decimal',
      },
    });

    if (response.status !== 200) {
      throw new Error(`The Odds API request failed with status: ${response.statusText}`);
    }

    // The API returns the data directly, no 'response' property needed
    return response.data;
  } catch (error) {
    // Handle specific Axios error messages
    if (error.response) {
      console.error("Error fetching NFL games:", error.response.data.message);
      throw new Error(`The Odds API Error: ${error.response.data.message}`);
    } else {
      console.error("Error fetching NFL games:", error.message);
      throw error;
    }
  }
}