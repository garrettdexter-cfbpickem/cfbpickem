import type {
  Game,
  Player,
  Pick,
  PlayoffTeam,
  PlayoffPick,
  HeismanCandidate,
  HeismanPick,
  AtsResult,
} from "./types";

/**
 * spread is the HOME team's spread (negative = home favored).
 * margin = homeScore - awayScore + spread
 *   margin > 0  -> home covered
 *   margin < 0  -> away covered
 *   margin === 0 -> push
 */
export function computeAtsResult(
  homeScore: number,
  awayScore: number,
  spread: number
): AtsResult {
  const margin = homeScore - awayScore + spread;
  if (margin > 0) return "home";
  if (margin < 0) return "away";
  return "push";
}

/**
 * Returns a Map<playerId, number> of correct ATS picks across all given
 * games. Only games that are 'final' with a non-null ats_result count, and
 * only picks matching the covering team score a point. Pushes and incorrect
 * picks score 0.
 */
export function computeWeeklyPoints(
  players: Player[],
  games: Game[],
  picks: Pick[]
): Map<string, number> {
  const pointsByPlayer = new Map<string, number>();
  for (const player of players) {
    pointsByPlayer.set(player.id, 0);
  }

  const gamesById = new Map<string, Game>();
  for (const game of games) {
    gamesById.set(game.id, game);
  }

  for (const pick of picks) {
    const game = gamesById.get(pick.game_id);
    if (!game) continue;
    if (game.status !== "final") continue;
    if (!game.ats_result || game.ats_result === "push") continue;

    const coveringTeam =
      game.ats_result === "home" ? game.home_team : game.away_team;

    if (pick.picked_team === coveringTeam) {
      const current = pointsByPlayer.get(pick.player_id) ?? 0;
      pointsByPlayer.set(pick.player_id, current + 1);
    }
  }

  return pointsByPlayer;
}

/**
 * Point value per playoff team = made_field ? (1 + (had_bye ? 1 : 0) +
 * rounds_won) : 0. Returns a Map<playerId, number> summing the point value
 * of each team a player picked (matched by team_name, case-sensitive).
 */
export function computePlayoffPoints(
  playoffTeams: PlayoffTeam[],
  playoffPicks: PlayoffPick[]
): Map<string, number> {
  const valueByTeamName = new Map<string, number>();
  for (const team of playoffTeams) {
    const value = team.made_field
      ? 1 + (team.had_bye ? 1 : 0) + team.rounds_won
      : 0;
    valueByTeamName.set(team.team_name, value);
  }

  const pointsByPlayer = new Map<string, number>();
  for (const pick of playoffPicks) {
    const value = valueByTeamName.get(pick.team_name) ?? 0;
    const current = pointsByPlayer.get(pick.player_id) ?? 0;
    pointsByPlayer.set(pick.player_id, current + value);
  }

  return pointsByPlayer;
}

/**
 * Point value per Heisman pick = (is_finalist ? 1 : 0) + (is_winner ? 1 : 0).
 * Returns a Map<playerId, number>.
 */
export function computeHeismanPoints(
  heismanCandidates: HeismanCandidate[],
  heismanPicks: HeismanPick[]
): Map<string, number> {
  const valueByCandidateName = new Map<string, number>();
  for (const candidate of heismanCandidates) {
    const value =
      (candidate.is_finalist ? 1 : 0) + (candidate.is_winner ? 1 : 0);
    valueByCandidateName.set(candidate.candidate_name, value);
  }

  const pointsByPlayer = new Map<string, number>();
  for (const pick of heismanPicks) {
    const value = valueByCandidateName.get(pick.candidate_name) ?? 0;
    const current = pointsByPlayer.get(pick.player_id) ?? 0;
    pointsByPlayer.set(pick.player_id, current + value);
  }

  return pointsByPlayer;
}

export interface CombinedStandingRow {
  playerId: string;
  playerName: string;
  weeklyPoints: number;
  playoffPoints: number;
  heismanPoints: number;
  totalPoints: number;
}

/**
 * Combines the three point maps into a single sorted standings array.
 * Sorted by totalPoints descending, ties broken by playerName alphabetically.
 */
export function buildCombinedStandings(
  players: Player[],
  weeklyPointsMap: Map<string, number>,
  playoffPointsMap: Map<string, number>,
  heismanPointsMap: Map<string, number>
): CombinedStandingRow[] {
  const rows: CombinedStandingRow[] = players.map((player) => {
    const weeklyPoints = weeklyPointsMap.get(player.id) ?? 0;
    const playoffPoints = playoffPointsMap.get(player.id) ?? 0;
    const heismanPoints = heismanPointsMap.get(player.id) ?? 0;
    return {
      playerId: player.id,
      playerName: player.name,
      weeklyPoints,
      playoffPoints,
      heismanPoints,
      totalPoints: weeklyPoints + playoffPoints + heismanPoints,
    };
  });

  rows.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    return a.playerName.localeCompare(b.playerName);
  });

  return rows;
}
