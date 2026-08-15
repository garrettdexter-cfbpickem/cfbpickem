export type Game = {
  id: string; // uuid, our own row id
  cfbd_game_id: number;
  season: number;
  week: number;
  home_team: string;
  away_team: string;
  // Spread expressed relative to the HOME team.
  // Negative = home team favored by that many points.
  // Positive = home team is the underdog by that many points.
  spread: number | null;
  kickoff_time: string; // ISO timestamp
  home_score: number | null;
  away_score: number | null;
  status: "scheduled" | "in_progress" | "final";
  ats_result: "home" | "away" | "push" | null;
  // Whether the admin has selected this game as part of the group's
  // pick'em slate for the week.
  included_in_pickem: boolean;
  // Once true, `spread` was locked in from DraftKings and must never be
  // overwritten by a routine sync again.
  spread_locked: boolean;
};

export type Player = {
  id: string;
  name: string;
};

export type Pick = {
  id: string;
  player_id: string;
  game_id: string;
  week: number;
  picked_team: string; // must equal games.home_team or games.away_team
  created_at: string;
  updated_at: string;
};

// One row per player per week — its existence means that player's picks for
// that week are submitted and locked (no edits allowed after this exists).
export type WeeklySubmission = {
  id: string;
  player_id: string;
  week: number;
  submitted_at: string;
};

// One row per player, ever — its existence means that player's preseason
// Playoff Pool + Heisman Pool picks are submitted and locked.
export type PreseasonSubmission = {
  id: string;
  player_id: string;
  submitted_at: string;
};

export type PlayoffTeam = {
  id: string;
  team_name: string;
  made_field: boolean;
  had_bye: boolean;
  rounds_won: number;
};

export type PlayoffPick = {
  id: string;
  player_id: string;
  team_name: string;
};

export type HeismanCandidate = {
  id: string;
  candidate_name: string;
  is_finalist: boolean;
  is_winner: boolean;
};

export type HeismanPick = {
  id: string;
  player_id: string;
  candidate_name: string;
};
