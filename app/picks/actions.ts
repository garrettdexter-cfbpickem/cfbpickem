"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase";
import { getIncludedGamesForWeek, getWeeklySubmission } from "@/lib/data";

export interface SubmitPicksState {
  ok: boolean;
  error?: string;
}

/**
 * Self-service "add a new player" form on the /picks landing page. Upserts
 * by name, then redirects to that player's picks page (unconfirmed - they
 * still have to go through the identity-verification step).
 */
export async function addPlayerAndGoToPicks(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    redirect("/picks");
  }

  const supabase = supabaseAdmin();
  const { error } = await supabase.from("players").upsert(
    { name },
    { onConflict: "name", ignoreDuplicates: true }
  );
  if (error) {
    throw new Error(`Failed to add player: ${error.message}`);
  }

  revalidatePath("/picks");
  redirect(`/picks/${encodeURIComponent(name)}`);
}

export async function submitPicks(
  playerName: string,
  week: number,
  prevState: SubmitPicksState,
  formData: FormData
): Promise<SubmitPicksState> {
  const supabase = supabaseAdmin();

  const games = await getIncludedGamesForWeek(week);
  if (games.length === 0) {
    return { ok: false, error: "No games are open for picks this week yet." };
  }

  const deadline = Math.min(...games.map((g) => new Date(g.kickoff_time).getTime()));
  if (Date.now() >= deadline) {
    return {
      ok: false,
      error: "Picks are closed — the first game of the week has already kicked off.",
    };
  }

  // Upsert the player by name (create if new).
  const { data: existingPlayer, error: findError } = await supabase
    .from("players")
    .select("*")
    .eq("name", playerName)
    .maybeSingle();
  if (findError) {
    return { ok: false, error: "Something went wrong looking up your player record." };
  }

  let playerId = existingPlayer?.id as string | undefined;
  if (!playerId) {
    const { data: created, error: createError } = await supabase
      .from("players")
      .insert({ name: playerName })
      .select("*")
      .single();
    if (createError || !created) {
      return { ok: false, error: "Something went wrong creating your player record." };
    }
    playerId = created.id;
  }
  const confirmedPlayerId: string = playerId as string;

  const alreadySubmitted = await getWeeklySubmission(confirmedPlayerId, week);
  if (alreadySubmitted) {
    return {
      ok: false,
      error: "You've already submitted picks for this week — picks can't be changed once submitted.",
    };
  }

  const rowsToUpsert: { player_id: string; game_id: string; week: number; picked_team: string }[] = [];

  for (const game of games) {
    const value = formData.get(`pick_${game.id}`);
    if (typeof value !== "string") continue;
    if (value !== game.home_team && value !== game.away_team) continue; // ignore tampered/invalid values
    rowsToUpsert.push({
      player_id: confirmedPlayerId,
      game_id: game.id,
      week,
      picked_team: value,
    });
  }

  if (rowsToUpsert.length > 0) {
    const { error: picksError } = await supabase
      .from("picks")
      .upsert(rowsToUpsert, { onConflict: "player_id,game_id" });
    if (picksError) {
      return { ok: false, error: "Something went wrong saving your picks." };
    }
  }

  const { error: submissionError } = await supabase
    .from("weekly_submissions")
    .insert({ player_id: confirmedPlayerId, week });
  if (submissionError) {
    return {
      ok: false,
      error: "You've already submitted picks for this week — picks can't be changed once submitted.",
    };
  }

  revalidatePath(`/picks/${encodeURIComponent(playerName)}`);
  revalidatePath(`/week/${week}`);
  revalidatePath("/");
  revalidatePath("/standings");

  return { ok: true };
}
