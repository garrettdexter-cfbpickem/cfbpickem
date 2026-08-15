import type { Game, HeismanCandidate, HeismanPick, PlayoffPick, PlayoffTeam } from "./types";

/**
 * Determine which side covered the spread for a finished game.
 * Spread convention: `spread` is the HOME team's spread.
 *   spread = -6.5  -> home favored by 6.5
 *   spread = +3     -> home is a 3 point underdog
 *
 * ATS margin = (home_score - away_score) + spread
 *   > 0  -> home covered
 *   < 0  -> away covered
 *   == 0 -> push
 */
export function computeAtsResult(
  homeScore: number,
  awayScore: number,
  spread: number
): "home" | "away" | "push" {
  const margin = homeScore - awayScore + spread;
  if (margin > 0) return "home";
  if (margin < 0) return "away";
  return "push";
}

export type StandingRow = {
  playerId: string;
  playerName: string;
  wins: number;
  losses: number;
  pushes: number;
  winPct: number;
};

/**
 * Weekly (ATS pick'em) standings. `wins` is simply a count of correct
 * picks — 1 point each — and is the number that feeds into the combined
 * season total below. `winPct` is kept around as extra detail but is not
 * itself part of anyone's score.
 */
export function buildStandings(
  players: { id: string; name: string }[],
  games: Game[],
  picks: { player_id: string; game_id: string; picked_team: string }[]
): StandingRow[] {
  const gameById = new Map(games.map((g) => [g.id, g]));

  const tally = new Map<
    string,
    { wins: number; losses: number; pushes: number }
  >();
  for (const p of players) {
    tally.set(p.id, { wins: 0, losses: 0, pushes: 0 });
  }

  for (const pick of picks) {
    const game = gameById.get(pick.game_id);
    if (!game || game.status !== "final" || !game.ats_result) continue;

    const row = tally.get(pick.player_id);
    if (!row) continue;

    if (game.ats_result === "push") {
      row.pushes += 1;
      continue;
    }

    const coveringTeam =
      game.ats_result === "home" ? game.home_team : game.away_team;

    if (pick.picked_team === coveringTeam) {
      row.wins += 1;
    } else {
      row.losses += 1;
    }
  }

  return players
    .map((p) => {
      const t = tally.get(p.id)!;
      const decided = t.wins + t.losses;
      return {
        playerId: p.id,
        playerName: p.name,
        wins: t.wins,
        losses: t.losses,
        pushes: t.pushes,
        winPct: decided === 0 ? 0 : t.wins / decided,
      };
    })
    .sort((a, b) => b.wins - a.wins || b.winPct - a.winPct);
}

/** Point value of a single Playoff Pool team pick. */
export function playoffTeamPoints(team: {
  made_field: boolean;
  had_bye: boolean;
  rounds_won: number;
}): number {
  if (!team.made_field) return 0;
  return 1 + (team.had_bye ? 1 : 0) + team.rounds_won;
}

/**
 * Sum Playoff Pool points per player: 1 point for each picked team that
 * made the 12-team field, plus 1 point per round it's won, plus teams with
 * a first-round bye are automatically credited 1 round (2 points total)
 * the moment the bracket is set, even before they've played a game.
 */
export function computePlayoffPoints(
  teams: PlayoffTeam[],
  picks: PlayoffPick[]
): Map<string, number> {
  const pointsByTeam = new Map(
    teams.map((t) => [t.team_name, playoffTeamPoints(t)])
  );

  const totals = new Map<string, number>();
  for (const pick of picks) {
    const pts = pointsByTeam.get(pick.team_name) ?? 0;
    totals.set(pick.player_id, (totals.get(pick.player_id) ?? 0) + pts);
  }
  return totals;
}

/** Point value of a single Heisman Pool candidate pick. */
export function heismanCandidatePoints(candidate: {
  is_finalist: boolean;
  is_winner: boolean;
}): number {
  return (candidate.is_finalist ? 1 : 0) + (candidate.is_winner ? 1 : 0);
}

/**
 * Sum Heisman Pool points per player: 1 point per pick who ends up a
 * finalist, plus 1 more if that pick is the actual winner (2 total for a
 * correctly-picked winner).
 */
export function computeHeismanPoints(
  candidates: HeismanCandidate[],
  picks: HeismanPick[]
): Map<string, number> {
  const pointsByCandidate = new Map(
    candidates.map((c) => [c.candidate_name, heismanCandidatePoints(c)])
  );

  const totals = new Map<string, number>();
  for (const pick of picks) {
    const pts = pointsByCandidate.get(pick.candidate_name) ?? 0;
    totals.set(pick.player_id, (totals.get(pick.player_id) ?? 0) + pts);
  }
  return totals;
}

export type CombinedStandingRow = {
  playerId: string;
  playerName: string;
  weeklyPoints: number;
  weeklyWins: number;
  weeklyLosses: number;
  weeklyPushes: number;
  playoffPoints: number;
  heismanPoints: number;
  total: number;
};

/**
 * The one combined leaderboard: weekly ATS points (1 per correct pick,
 * across all weeks) + Playoff Pool points + Heisman Pool points, sorted
 * descending by total, with each component broken out per row.
 */
export function buildCombinedStandings(
  players: { id: string; name: string }[],
  weeklyStandings: StandingRow[],
  playoffPointsByPlayer: Map<string, number>,
  heismanPointsByPlayer: Map<string, number>
): CombinedStandingRow[] {
  const weeklyByPlayerId = new Map(weeklyStandings.map((r) => [r.playerId, r]));

  return players
    .map((p) => {
      const weekly = weeklyByPlayerId.get(p.id);
      const weeklyPoints = weekly?.wins ?? 0;
      const playoffPoints = playoffPointsByPlayer.get(p.id) ?? 0;
      const heismanPoints = heismanPointsByPlayer.get(p.id) ?? 0;

      return {
        playerId: p.id,
        playerName: p.name,
        weeklyPoints,
        weeklyWins: weekly?.wins ?? 0,
        weeklyLosses: weekly?.losses ?? 0,
        weeklyPushes: weekly?.pushes ?? 0,
        playoffPoints,
        heismanPoints,
        total: weeklyPoints + playoffPoints + heismanPoints,
      };
    })
    .sort((a, b) => b.total - a.total);
}
