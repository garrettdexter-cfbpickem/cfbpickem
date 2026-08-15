"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase";
import { getIncludedGamesForWeek } from "@/lib/data";

export async function createPlayer(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const sb = supabaseAdmin();
  // Insert if new; if the name already exists just proceed to their page.
  await sb.from("players").upsert({ name }, { onConflict: "name" });

  redirect(`/picks/${encodeURIComponent(name)}`);
}

export type SubmitPicksState = { ok: boolean; error?: string };

/**
 * Picks are submit-once, no edits, hard deadline at the first kickoff of
 * the week's included slate. On success this inserts a permanent
 * weekly_submissions row — its presence is what locks the week for that
 * player everywhere else in the app.
 */
export async function submitPicks(
  playerName: string,
  week: number,
  _prevState: SubmitPicksState,
  formData: FormData
): Promise<SubmitPicksState> {
  const sb = supabaseAdmin();

  const games = await getIncludedGamesForWeek(week);
  if (games.length === 0) {
    return { ok: false, error: "No games are open for picks this week yet." };
  }

  const deadline = Math.min(
    ...games.map((g) => new Date(g.kickoff_time).getTime())
  );
  if (Date.now() >= deadline) {
    return {
      ok: false,
      error:
        "Picks are closed — the first game of the week has already kicked off.",
    };
  }

  // Create the player if this is their first time submitting picks.
  await sb.from("players").upsert({ name: playerName }, { onConflict: "name" });

  const { data: player, error: playerErr } = await sb
    .from("players")
    .select("id")
    .eq("name", playerName)
    .single();
  if (playerErr || !player) {
    return { ok: false, error: "Could not find or create that player." };
  }

  const { data: existingSubmission, error: submissionLookupErr } = await sb
    .from("weekly_submissions")
    .select("id")
    .eq("player_id", player.id)
    .eq("week", week)
    .maybeSingle();
  if (submissionLookupErr) {
    return { ok: false, error: "Something went wrong. Please try again." };
  }
  if (existingSubmission) {
    return {
      ok: false,
      error:
        "You've already submitted picks for this week — picks can't be changed once submitted.",
    };
  }

  const rows: {
    player_id: string;
    game_id: string;
    week: number;
    picked_team: string;
  }[] = [];

  for (const game of games) {
    const picked = formData.get(`pick_${game.id}`);
    if (!picked) continue;
    const pickedTeam = String(picked);
    if (pickedTeam !== game.home_team && pickedTeam !== game.away_team) {
      continue; // ignore tampered values
    }
    rows.push({
      player_id: player.id,
      game_id: game.id,
      week,
      picked_team: pickedTeam,
    });
  }

  if (rows.length > 0) {
    const { error } = await sb
      .from("picks")
      .upsert(rows, { onConflict: "player_id,game_id" });
    if (error) {
      return { ok: false, error: "Failed to save your picks. Please try again." };
    }
  }

  const { error: lockErr } = await sb
    .from("weekly_submissions")
    .insert({ player_id: player.id, week });
  if (lockErr) {
    return {
      ok: false,
      error: "Failed to lock in your submission. Please try again.",
    };
  }

  revalidatePath(`/picks/${encodeURIComponent(playerName)}`);
  revalidatePath(`/week/${week}`);
  revalidatePath("/");
  revalidatePath("/standings");

  return { ok: true };
}
