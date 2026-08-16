import { supabaseAdmin } from "./supabase";
import type {
  Player,
  Game,
  Pick,
  WeeklySubmission,
  PreseasonSubmission,
  PlayoffTeam,
  PlayoffPick,
  HeismanCandidate,
  HeismanPick,
} from "./types";

export async function getPlayers(): Promise<Player[]> {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase.from("players").select("*").order("name");
  if (error) throw new Error(`getPlayers failed: ${error.message}`);
  return data ?? [];
}

export async function getAllGames(): Promise<Game[]> {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .order("week", { ascending: true })
    .order("kickoff_time", { ascending: true });
  if (error) throw new Error(`getAllGames failed: ${error.message}`);
  return data ?? [];
}

export async function getGamesForWeek(week: number): Promise<Game[]> {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("week", week)
    .order("kickoff_time", { ascending: true });
  if (error) throw new Error(`getGamesForWeek failed: ${error.message}`);
  return data ?? [];
}

export async function getIncludedGamesForWeek(week: number): Promise<Game[]> {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("week", week)
    .eq("included_in_pickem", true)
    .order("kickoff_time", { ascending: true });
  if (error) throw new Error(`getIncludedGamesForWeek failed: ${error.message}`);
  return data ?? [];
}

export async function getAllPicks(): Promise<Pick[]> {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase.from("picks").select("*");
  if (error) throw new Error(`getAllPicks failed: ${error.message}`);
  return data ?? [];
}

export async function getPicksForWeek(week: number): Promise<Pick[]> {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase.from("picks").select("*").eq("week", week);
  if (error) throw new Error(`getPicksForWeek failed: ${error.message}`);
  return data ?? [];
}

/**
 * The highest week number with a game kicking off within the last 4 days or
 * the next 14 days (based on ALL games, not just included ones). Falls back
 * to the max week with any games, and falls back to 1 if no games exist.
 */
export async function getCurrentWeek(): Promise<number> {
  const games = await getAllGames();
  if (games.length === 0) return 1;

  const now = Date.now();
  const fourDaysAgo = now - 4 * 24 * 60 * 60 * 1000;
  const fourteenDaysAhead = now + 14 * 24 * 60 * 60 * 1000;

  const candidateWeeks = games
    .filter((g) => {
      const kickoff = new Date(g.kickoff_time).getTime();
      return kickoff >= fourDaysAgo && kickoff <= fourteenDaysAhead;
    })
    .map((g) => g.week);

  if (candidateWeeks.length > 0) {
    return Math.max(...candidateWeeks);
  }

  const allWeeks = games.map((g) => g.week);
  return Math.max(...allWeeks);
}

export async function getWeeklySubmission(
  playerId: string,
  week: number
): Promise<WeeklySubmission | null> {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("weekly_submissions")
    .select("*")
    .eq("player_id", playerId)
    .eq("week", week)
    .maybeSingle();
  if (error) throw new Error(`getWeeklySubmission failed: ${error.message}`);
  return data;
}

export async function getWeeklySubmissionsForWeek(week: number): Promise<WeeklySubmission[]> {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("weekly_submissions")
    .select("*")
    .eq("week", week);
  if (error) throw new Error(`getWeeklySubmissionsForWeek failed: ${error.message}`);
  return data ?? [];
}

export async function getPreseasonSubmission(
  playerId: string
): Promise<PreseasonSubmission | null> {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("preseason_submissions")
    .select("*")
    .eq("player_id", playerId)
    .maybeSingle();
  if (error) throw new Error(`getPreseasonSubmission failed: ${error.message}`);
  return data;
}

export async function getAllPreseasonSubmissions(): Promise<PreseasonSubmission[]> {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase.from("preseason_submissions").select("*");
  if (error) throw new Error(`getAllPreseasonSubmissions failed: ${error.message}`);
  return data ?? [];
}

export async function getPlayoffTeams(): Promise<PlayoffTeam[]> {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("playoff_teams")
    .select("*")
    .order("team_name");
  if (error) throw new Error(`getPlayoffTeams failed: ${error.message}`);
  return data ?? [];
}

export async function getPlayoffPicks(): Promise<PlayoffPick[]> {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase.from("playoff_picks").select("*");
  if (error) throw new Error(`getPlayoffPicks failed: ${error.message}`);
  return data ?? [];
}

export async function getPlayoffPicksForPlayer(playerId: string): Promise<PlayoffPick[]> {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("playoff_picks")
    .select("*")
    .eq("player_id", playerId);
  if (error) throw new Error(`getPlayoffPicksForPlayer failed: ${error.message}`);
  return data ?? [];
}

export async function getHeismanCandidates(): Promise<HeismanCandidate[]> {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("heisman_candidates")
    .select("*")
    .order("candidate_name");
  if (error) throw new Error(`getHeismanCandidates failed: ${error.message}`);
  return data ?? [];
}

export async function getHeismanPicks(): Promise<HeismanPick[]> {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase.from("heisman_picks").select("*");
  if (error) throw new Error(`getHeismanPicks failed: ${error.message}`);
  return data ?? [];
}

export async function getHeismanPicksForPlayer(playerId: string): Promise<HeismanPick[]> {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("heisman_picks")
    .select("*")
    .eq("player_id", playerId);
  if (error) throw new Error(`getHeismanPicksForPlayer failed: ${error.message}`);
  return data ?? [];
}
