"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase";
import { getPreseasonSubmission } from "@/lib/data";

export interface SubmitPreseasonPicksState {
  ok: boolean;
  error?: string;
}

function parseLines(raw: FormDataEntryValue | null): string[] {
  if (typeof raw !== "string") return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
  }
  return result;
}

export async function submitPreseasonPicks(
  playerName: string,
  prevState: SubmitPreseasonPicksState,
  formData: FormData
): Promise<SubmitPreseasonPicksState> {
  const supabase = supabaseAdmin();

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

  const alreadySubmitted = await getPreseasonSubmission(confirmedPlayerId);
  if (alreadySubmitted) {
    return {
      ok: false,
      error: "You've already submitted your preseason picks — they can't be changed once submitted.",
    };
  }

  const teamNames = parseLines(formData.get("playoff_teams"));
  const candidateNames = parseLines(formData.get("heisman_candidates"));

  if (teamNames.length === 0 && candidateNames.length === 0) {
    return { ok: false, error: "Please enter at least one playoff team or Heisman candidate." };
  }

  if (teamNames.length > 0) {
    const { error: teamsError } = await supabase
      .from("playoff_teams")
      .upsert(
        teamNames.map((team_name) => ({ team_name })),
        { onConflict: "team_name", ignoreDuplicates: true }
      );
    if (teamsError) {
      return { ok: false, error: "Something went wrong saving your playoff teams." };
    }

    const { error: playoffPicksError } = await supabase
      .from("playoff_picks")
      .upsert(
        teamNames.map((team_name) => ({ player_id: confirmedPlayerId, team_name })),
        { onConflict: "player_id,team_name" }
      );
    if (playoffPicksError) {
      return { ok: false, error: "Something went wrong saving your playoff picks." };
    }
  }

  if (candidateNames.length > 0) {
    const { error: candidatesError } = await supabase
      .from("heisman_candidates")
      .upsert(
        candidateNames.map((candidate_name) => ({ candidate_name })),
        { onConflict: "candidate_name", ignoreDuplicates: true }
      );
    if (candidatesError) {
      return { ok: false, error: "Something went wrong saving your Heisman candidates." };
    }

    const { error: heismanPicksError } = await supabase
      .from("heisman_picks")
      .upsert(
        candidateNames.map((candidate_name) => ({ player_id: confirmedPlayerId, candidate_name })),
        { onConflict: "player_id,candidate_name" }
      );
    if (heismanPicksError) {
      return { ok: false, error: "Something went wrong saving your Heisman picks." };
    }
  }

  const { error: submissionError } = await supabase
    .from("preseason_submissions")
    .insert({ player_id: confirmedPlayerId });
  if (submissionError) {
    return {
      ok: false,
      error: "You've already submitted your preseason picks — they can't be changed once submitted.",
    };
  }

  revalidatePath("/picks/preseason");
  revalidatePath(`/picks/preseason/${encodeURIComponent(playerName)}`);
  revalidatePath(`/picks/${encodeURIComponent(playerName)}`);
  revalidatePath("/");
  revalidatePath("/standings");

  return { ok: true };
}
