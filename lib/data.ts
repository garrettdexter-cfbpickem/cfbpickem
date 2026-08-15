import { supabaseAdmin } from "./supabase";
import type {
  Game,
  Player,
  Pick,
  WeeklySubmission,
  PreseasonSubmission,
  PlayoffTeam,
  PlayoffPick,
  HeismanCandidate,
  HeismanPick,
} from "./types";

export async function getPlayers(): Promise<Player[]> {
  const sb = supabaseAdmin();
  const { data, error } = await sb.from("players").select("*").order("name");
  if (error) throw error;
  return data as Player[];
}

export async function getAllGames(): Promise<Game[]> {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("games")
    .select("*")
    .order("week", { ascending: true })
    .order("kickoff_time", { ascending: true });
  if (error) throw error;
  return data as Game[];
}

/**
 * Every game synced for a week, regardless of `included_in_pickem`.
 * Admin-only use (the admin week page needs to see everything CFBD synced
 * so it can choose which ones to include).
 */
export async function getGamesForWeek(week: number): Promise<Game[]> {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("games")
    .select("*")
    .eq("week", week)
    .order("kickoff_time", { ascending: true });
  if (error) throw error;
  return data as Game[];
}

/**
 * Player-facing equivalent of getGamesForWeek — only games the admin has
 * curated into the pick'em slate. Use this (not getGamesForWeek) for any
 * page a player sees.
 */
export async function getIncludedGamesForWeek(week: number): Promise<Game[]> {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("games")
    .select("*")
    .eq("week", week)
    .eq("included_in_pickem", true)
    .order("kickoff_time", { ascending: true });
  if (error) throw error;
  return data as Game[];
}

export async function getAllPicks(): Promise<Pick[]> {
  const sb = supabaseAdmin();
  const { data, error } = await sb.from("picks").select("*");
  if (error) throw error;
  return data as Pick[];
}

export async function getPicksForWeek(week: number): Promise<Pick[]> {
  const sb = supabaseAdmin();
  const { data, error } = await sb.from("picks").select("*").eq("week", week);
  if (error) throw error;
  return data as Pick[];
}

export async function getWeeklySubmission(
  playerId: string,
  week: number
): Promise<WeeklySubmission | null> {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("weekly_submissions")
    .select("*")
    .eq("player_id", playerId)
    .eq("week", week)
    .maybeSingle();
  if (error) throw error;
  return (data as WeeklySubmission | null) ?? null;
}

export async function getWeeklySubmissionsForWeek(
  week: number
): Promise<WeeklySubmission[]> {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("weekly_submissions")
    .select("*")
    .eq("week", week);
  if (error) throw error;
  return (data as WeeklySubmission[]) ?? [];
}

export async function getPreseasonSubmission(
  playerId: string
): Promise<PreseasonSubmission | null> {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("preseason_submissions")
    .select("*")
    .eq("player_id", playerId)
    .maybeSingle();
  if (error) throw error;
  return (data as PreseasonSubmission | null) ?? null;
}

export async function getPlayoffTeams(): Promise<PlayoffTeam[]> {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("playoff_teams")
    .select("*")
    .order("team_name");
  if (error) throw error;
  return (data as PlayoffTeam[]) ?? [];
}

export async function getPlayoffPicks(): Promise<PlayoffPick[]> {
  const sb = supabaseAdmin();
  const { data, error } = await sb.from("playoff_picks").select("*");
  if (error) throw error;
  return (data as PlayoffPick[]) ?? [];
}

export async function getPlayoffPicksForPlayer(
  playerId: string
): Promise<PlayoffPick[]> {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("playoff_picks")
    .select("*")
    .eq("player_id", playerId);
  if (error) throw error;
  return (data as PlayoffPick[]) ?? [];
}

export async function getHeismanCandidates(): Promise<HeismanCandidate[]> {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("heisman_candidates")
    .select("*")
    .order("candidate_name");
  if (error) throw error;
  return (data as HeismanCandidate[]) ?? [];
}

export async function getHeismanPicks(): Promise<HeismanPick[]> {
  const sb = supabaseAdmin();
  const { data, error } = await sb.from("heisman_picks").select("*");
  if (error) throw error;
  return (data as HeismanPick[]) ?? [];
}

export async function getHeismanPicksForPlayer(
  playerId: string
): Promise<HeismanPick[]> {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("heisman_picks")
    .select("*")
    .eq("player_id", playerId);
  if (error) throw error;
  return (data as HeismanPick[]) ?? [];
}

/**
 * "Current" week = the highest week number that has a game kicking off
 * within the last 4 days or the next 14 days. Falls back to the most
 * recent week with any games, or week 1 if the season hasn't been
 * synced yet.
 */
export async function getCurrentWeek(): Promise<number> {
  const games = await getAllGames();
  if (games.length === 0) return 1;

  const now = Date.now();
  const fourDaysMs = 4 * 24 * 60 * 60 * 1000;
  const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;

  const inWindow = games.filter((g) => {
    const t = new Date(g.kickoff_time).getTime();
    return t > now - fourDaysMs && t < now + fourteenDaysMs;
  });

  if (inWindow.length > 0) {
    return Math.max(...inWindow.map((g) => g.week));
  }

  return Math.max(...games.map((g) => g.week));
}
