// lib/mlbApi.js
import axios from 'axios';

const SCHEDULE_URL = 'https://statsapi.mlb.com/api/v1/schedule';
const PEOPLE_STATS_URL = 'https://statsapi.mlb.com/api/v1/people';

/**
 * Returns an array of today's games with teams, probable pitchers,
 * and series status (handy for other algos).
 */
export async function getTodayMLBGames() {
  const today = new Date().toISOString().split('T')[0];
  const url = `${SCHEDULE_URL}?sportId=1&hydrate=probablePitcher,seriesStatus,team&date=${today}`;
  const { data } = await axios.get(url);
  const dates = data.dates;
  if (!dates || dates.length === 0) return [];

  return dates[0].games.map((game) => ({
    gamePk:           game.gamePk,
    homeTeam:         game.teams.home.team.name,
    awayTeam:         game.teams.away.team.name,
    homeTeamId:       game.teams.home.team.id,
    awayTeamId:       game.teams.away.team.id,
    homePitcherId:    game.teams.home.probablePitcher?.id || null,
    awayPitcherId:    game.teams.away.probablePitcher?.id || null,
    seriesGameNumber: game.seriesStatus?.seriesGameNumber ?? null,
    homeSeriesWins:   game.seriesStatus?.homeWins ?? 0,
    awaySeriesWins:   game.seriesStatus?.awayWins ?? 0,
    gameTime:         game.gameDate,
  }));
}

export async function getPitcherSeasonWHIP(pitcherId) {
  if (!pitcherId) return null;
  const season = new Date().getFullYear();
  const url = `${PEOPLE_STATS_URL}/${pitcherId}/stats?stats=season&season=${season}&group=pitching`;
  const { data } = await axios.get(url);
  const splits = data.stats?.[0]?.splits;
  if (!splits || splits.length === 0) return null;
  return parseFloat(splits[0].stat.whip);
}

/**
 * (Optional) Fetches a team’s season W-L record, so we can break ties by win %.
 */
export async function getTeamSeasonRecord(teamId) {
  if (!teamId) return { wins: 0, losses: 1 };
  const season = new Date().getFullYear();
  const url = `https://statsapi.mlb.com/api/v1/teams/${teamId}/stats?stats=season&season=${season}`;
  const { data } = await axios.get(url);
  const splits = data.stats?.[0]?.splits;
  if (!splits || splits.length === 0) return { wins: 0, losses: 1 };
  const stat = splits[0].stat;
  return { wins: stat.wins, losses: stat.losses };
}

export async function getMLBGameResult(gamePk) {
  const url = `https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`;
  const { data } = await axios.get(url);

  const abstract = data?.gameData?.status?.abstractGameState;
  if (abstract !== 'Final') {
    return { final: false };
  }

  const homeTeamObj = data?.gameData?.teams?.home;
  const awayTeamObj = data?.gameData?.teams?.away;

  const homeName = homeTeamObj?.teamName || homeTeamObj?.name;
  const awayName = awayTeamObj?.teamName || awayTeamObj?.name;

  const homeRuns = data.liveData?.linescore?.teams?.home?.runs ?? null;
  const awayRuns = data.liveData?.linescore?.teams?.away?.runs ?? null;

  if (homeRuns == null || awayRuns == null) return { final: false };

  const winnerTeam = homeRuns > awayRuns ? homeName : awayName;
  const push = homeRuns === awayRuns;

  return {
    final: true,
    winnerTeam,
    homeName,
    awayName,
    homeRuns,
    awayRuns,
    push,
  };
}
