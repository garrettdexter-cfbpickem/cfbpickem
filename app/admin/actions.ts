"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase";
import { syncWeek, lockLinesForWeek } from "@/lib/sync";
import { ADMIN_SESSION_COOKIE } from "@/lib/adminAuth";

export interface AdminLoginState {
  ok: boolean;
  error?: string;
}

export async function adminLogin(
  prevState: AdminLoginState,
  formData: FormData
): Promise<AdminLoginState> {
  const password = String(formData.get("password") ?? "");
  const secret = process.env.ADMIN_SECRET;

  if (!secret || password !== secret) {
    return { ok: false, error: "Incorrect password" };
  }

  cookies().set(ADMIN_SESSION_COOKIE, secret, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  redirect("/admin");
}

export async function saveGameSelection(week: number, formData: FormData): Promise<void> {
  const supabase = supabaseAdmin();

  const { data: games, error } = await supabase
    .from("games")
    .select("id")
    .eq("week", week);
  if (error) {
    throw new Error(`Failed to load games for week ${week}: ${error.message}`);
  }

  for (const game of games ?? []) {
    const included = formData.get(`game_${game.id}`) === "on";
    const { error: updateError } = await supabase
      .from("games")
      .update({ included_in_pickem: included })
      .eq("id", game.id);
    if (updateError) {
      throw new Error(`Failed to update game ${game.id}: ${updateError.message}`);
    }
  }

  revalidatePath(`/admin/week/${week}`);
  revalidatePath(`/week/${week}`);
  revalidatePath("/");
  revalidatePath("/picks");
}

export async function syncWeekAction(week: number): Promise<void> {
  await syncWeek(week);
  revalidatePath(`/admin/week/${week}`);
  revalidatePath(`/week/${week}`);
  revalidatePath("/");
}

export async function lockLinesAction(week: number): Promise<void> {
  await lockLinesForWeek(week);
  revalidatePath(`/admin/week/${week}`);
  revalidatePath(`/week/${week}`);
  revalidatePath("/");
}

export async function addPlayoffTeamAction(formData: FormData): Promise<void> {
  const teamName = String(formData.get("team_name") ?? "").trim();
  if (!teamName) return;

  const supabase = supabaseAdmin();
  const { error } = await supabase
    .from("playoff_teams")
    .upsert({ team_name: teamName }, { onConflict: "team_name", ignoreDuplicates: true });
  if (error) {
    throw new Error(`Failed to add playoff team: ${error.message}`);
  }

  revalidatePath("/admin/playoff");
  revalidatePath("/picks/preseason");
  revalidatePath("/standings");
}

export async function savePlayoffTeamAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const madeField = formData.get("made_field") === "on";
  const hadBye = formData.get("had_bye") === "on";
  const roundsWon = Number(formData.get("rounds_won") ?? 0) || 0;

  const supabase = supabaseAdmin();
  const { error } = await supabase
    .from("playoff_teams")
    .update({
      made_field: madeField,
      had_bye: hadBye,
      rounds_won: roundsWon,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) {
    throw new Error(`Failed to update playoff team: ${error.message}`);
  }

  revalidatePath("/admin/playoff");
  revalidatePath("/picks/preseason");
  revalidatePath("/standings");
  revalidatePath("/");
}

export async function addHeismanCandidateAction(formData: FormData): Promise<void> {
  const candidateName = String(formData.get("candidate_name") ?? "").trim();
  if (!candidateName) return;

  const supabase = supabaseAdmin();
  const { error } = await supabase
    .from("heisman_candidates")
    .upsert(
      { candidate_name: candidateName },
      { onConflict: "candidate_name", ignoreDuplicates: true }
    );
  if (error) {
    throw new Error(`Failed to add Heisman candidate: ${error.message}`);
  }

  revalidatePath("/admin/heisman");
  revalidatePath("/picks/preseason");
  revalidatePath("/standings");
}

export async function saveHeismanCandidateAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const isFinalist = formData.get("is_finalist") === "on";
  const isWinner = formData.get("is_winner") === "on";

  const supabase = supabaseAdmin();
  const { error } = await supabase
    .from("heisman_candidates")
    .update({
      is_finalist: isFinalist,
      is_winner: isWinner,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) {
    throw new Error(`Failed to update Heisman candidate: ${error.message}`);
  }

  revalidatePath("/admin/heisman");
  revalidatePath("/picks/preseason");
  revalidatePath("/standings");
  revalidatePath("/");
}

export interface AddPlayerState {
  ok: boolean;
  error?: string;
  name?: string;
}

export async function addPlayerAction(formData: FormData): Promise<AddPlayerState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return { ok: false, error: "Please enter a name." };
  }

  const supabase = supabaseAdmin();
  const { error } = await supabase
    .from("players")
    .upsert({ name }, { onConflict: "name", ignoreDuplicates: true });
  if (error) {
    return { ok: false, error: `Failed to add player: ${error.message}` };
  }

  revalidatePath("/admin/players");
  revalidatePath("/picks");

  return { ok: true, name };
}
