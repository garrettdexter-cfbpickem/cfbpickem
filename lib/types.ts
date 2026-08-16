export type GameStatus = "scheduled" | "in_progress" | "final";
export type AtsResult = "home" | "away" | "push";

export interface Player {
  id: string;
  name: string;
  created_at: string;
}

export interface Game {
  id: string;
  cfbd_game_id: number;
  season: number;
  week: number;
  home_team: string;
  away_team: string;
  spread: number | null;
  kickoff_time: string;
  home_score: number | null;
  away_score: number | null;
  status: GameStatus;
  ats_result: AtsResult | null;
  included_in_pickem: boolean;
  spread_locked: boolean;
  updated_at: string;
}

export interface Pick {
  id: string;
  player_id: string;
  game_id: string;
  week: number;
  picked_team: string;
  created_at: string;
  updated_at: string;
}

export interface WeeklySubmission {
  id: string;
  player_id: string;
  week: number;
  submitted_at: string;
}

export interface PreseasonSubmission {
  id: string;
  player_id: string;
  submitted_at: string;
}

export interface PlayoffTeam {
  id: string;
  team_name: string;
  made_field: boolean;
  had_bye: boolean;
  rounds_won: number;
  updated_at: string;
}

export interface PlayoffPick {
  id: string;
  player_id: string;
  team_name: string;
  created_at: string;
}

export interface HeismanCandidate {
  id: string;
  candidate_name: string;
  is_finalist: boolean;
  is_winner: boolean;
  updated_at: string;
}

export interface HeismanPick {
  id: string;
  player_id: string;
  candidate_name: string;
  created_at: string;
}
