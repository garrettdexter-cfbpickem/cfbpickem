"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase";

export type PreseasonActionState = { ok: boolean; error?: string };

/**
 * One-time preseason submission: 12 Playoff Pool teams + 5 Heisman
 * candidates, all free text (the actual 12-team field doesn't exist yet
 * preseason, so there's nothing to pick from a dropdown). Whatever names
 * players type get upserted into playoff_teams / heisman_candidates (with
 * default false/0 values) so the admin has rows to mark results against
 * later, without ever clobbering existing admin-entered data for a team
 * someone else already typed.
 */
export async function submitPreseasonPicks(
  playerName: string,
  _prevState: PreseasonActionState,
  formData: FormData
): Promise<PreseasonActionState> {
  const sb = supabaseAdmin();

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
    .from("preseason_submissions")
    .select("id")
    .eq("player_id", player.id)
    .maybeSingle();
  if (submissionLookupErr) {
    return { ok: false, error: "Something went wrong. Please try again." };
  }
  if (existingSubmission) {
    return {
      ok: false,
      error:
        "You've already submitted your preseason picks — they can't be changed once submitted.",
    };
  }

  const playoffTeams = Array.from({ length: 12 }, (_, i) =>
    String(formData.get(`playoff_team_${i}`) ?? "").trim()
  ).filter(Boolean);
  const uniquePlayoffTeams = Array.from(new Set(playoffTeams));
  if (uniquePlayoffTeams.length !== 12) {
    return {
      ok: false,
      error: `Enter exactly 12 distinct teams for your Playoff Pool picks (you entered ${uniquePlayoffTeams.length}).`,
    };
  }

  const heismanCandidates = Array.from({ length: 5 }, (_, i) =>
    String(formData.get(`heisman_${i}`) ?? "").trim()
  ).filter(Boolean);
  const uniqueHeisman = Array.from(new Set(heismanCandidates));
  if (uniqueHeisman.length !== 5) {
    return {
      ok: false,
      error: `Enter exactly 5 distinct Heisman candidates (you entered ${uniqueHeisman.length}).`,
    };
  }

  const { error: teamsUpsertErr } = await sb
    .from("playoff_teams")
    .upsert(
      uniquePlayoffTeams.map((team_name) => ({ team_name })),
      { onConflict: "team_name", ignoreDuplicates: true }
    );
  if (teamsUpsertErr) {
    return { ok: false, error: "Failed to save playoff teams. Please try again." };
  }

  const { error: candidatesUpsertErr } = await sb
    .from("heisman_candidates")
    .upsert(
      uniqueHeisman.map((candidate_name) => ({ candidate_name })),
      { onConflict: "candidate_name", ignoreDuplicates: true }
    );
  if (candidatesUpsertErr) {
    return { ok: false, error: "Failed to save Heisman candidates. Please try again." };
  }

  const { error: playoffPickErr } = await sb.from("playoff_picks").upsert(
    uniquePlayoffTeams.map((team_name) => ({ player_id: player.id, team_name })),
    { onConflict: "player_id,team_name" }
  );
  if (playoffPickErr) {
    return { ok: false, error: "Failed to save your playoff picks. Please try again." };
  }

  const { error: heismanPickErr } = await sb.from("heisman_picks").upsert(
    uniqueHeisman.map((candidate_name) => ({
      player_id: player.id,
      candidate_name,
    })),
    { onConflict: "player_id,candidate_name" }
  );
  if (heismanPickErr) {
    return { ok: false, error: "Failed to save your Heisman picks. Please try again." };
  }

  const { error: lockErr } = await sb
    .from("preseason_submissions")
    .insert({ player_id: player.id });
  if (lockErr) {
    return {
      ok: false,
      error: "Failed to lock in your submission. Please try again.",
    };
  }

  revalidatePath(`/picks/preseason/${encodeURIComponent(playerName)}`);
  revalidatePath("/");
  revalidatePath("/standings");
  revalidatePath("/admin/playoff");
  revalidatePath("/admin/heisman");

  return { ok: true };
}
