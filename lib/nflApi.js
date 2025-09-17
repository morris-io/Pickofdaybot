// lib/nflApi.js
import axios from 'axios';

// The API key for API-Sports
const API_KEY = process.env.API_SPORTS_NFL_KEY;

// API-Sports endpoint constants
const BASE_URL = 'https://v1.american-football.api-sports.io';

export async function getWeeklyNFLGames(season, week) {
  try {
    const response = await axios.get(`${BASE_URL}/games`, {
      params: {
        league: 1, // League ID for NFL is 1
        season: season,
        week: week,
      },
      headers: {
        'x-apisports-key': API_KEY, // Correct header for a direct API-Sports account
      },
    });

    if (response.status !== 200) {
      throw new Error(`API-Sports error: ${response.statusText}`);
    }

    return response.data.response;
  } catch (error) {
    console.error("Error fetching NFL games:", error);
    return [];
  }
}