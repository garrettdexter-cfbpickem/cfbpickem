"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin, ADMIN_COOKIE_NAME } from "@/lib/adminAuth";
import { getGamesForWeek, getPlayoffTeams, getHeismanCandidates } from "@/lib/data";
import { syncWeek, lockLinesForWeek } from "@/lib/sync";

export type AdminLoginState = { error?: string };

export async function adminLogin(
  _prevState: AdminLoginState,
  formData: FormData
): Promise<AdminLoginState> {
  const submitted = String(formData.get("password") ?? "");
  const expected = process.env.ADMIN_SECRET;

  if (!expected || submitted !== expected) {
    return { error: "Incorrect password." };
  }

  cookies().set(ADMIN_COOKIE_NAME, expected, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  redirect("/admin");
}

export async function adminLogout() {
  cookies().set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  redirect("/");
}

/** Update included_in_pickem for every game in a week based on which
 * checkboxes were checked in the admin week page's form. */
export async function saveWeekSelection(week: number, formData: FormData) {
  await requireAdmin();
  const sb = supabaseAdmin();

  const games = await getGamesForWeek(week);
  for (const game of games) {
    const checked = formData.get(`include_${game.id}`) != null;
    if (checked === game.included_in_pickem) continue;
    const { error } = await sb
      .from("games")
      .update({ included_in_pickem: checked })
      .eq("id", game.id);
    if (error) throw error;
  }

  revalidatePath(`/admin/week/${week}`);
  revalidatePath(`/week/${week}`);
  revalidatePath(`/picks`);
  revalidatePath("/");
}

/** Pull this week's games/lines from CFBD (admin-triggered, calls
 * lib/sync.ts directly rather than going through the API route). */
export async function syncWeekAction(week: number) {
  await requireAdmin();
  await syncWeek(week);
  revalidatePath(`/admin/week/${week}`);
}

/** Lock DraftKings lines for this week's included games right now (manual
 * re-trigger of the Thursday-noon cron job). */
export async function lockLinesAction(week: number) {
  await requireAdmin();
  await lockLinesForWeek(week);
  revalidatePath(`/admin/week/${week}`);
  revalidatePath(`/week/${week}`);
  revalidatePath("/");
}

export async function addPlayoffTeam(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("team_name") ?? "").trim();
  if (!name) return;

  const sb = supabaseAdmin();
  const { error } = await sb
    .from("playoff_teams")
    .upsert({ team_name: name }, { onConflict: "team_name", ignoreDuplicates: true });
  if (error) throw error;

  revalidatePath("/admin/playoff");
}

export async function savePlayoffTeams(formData: FormData) {
  await requireAdmin();
  const sb = supabaseAdmin();

  const teams = await getPlayoffTeams();
  for (const team of teams) {
    const made_field = formData.get(`made_field_${team.id}`) != null;
    const had_bye = formData.get(`had_bye_${team.id}`) != null;
    const roundsRaw = formData.get(`rounds_won_${team.id}`);
    const parsed = Number(roundsRaw ?? 0);
    const rounds_won = Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : 0;

    const { error } = await sb
      .from("playoff_teams")
      .update({
        made_field,
        had_bye,
        rounds_won,
        updated_at: new Date().toISOString(),
      })
      .eq("id", team.id);
    if (error) throw error;
  }

  revalidatePath("/admin/playoff");
  revalidatePath("/");
  revalidatePath("/standings");
}

export async function addHeismanCandidate(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("candidate_name") ?? "").trim();
  if (!name) return;

  const sb = supabaseAdmin();
  const { error } = await sb
    .from("heisman_candidates")
    .upsert(
      { candidate_name: name },
      { onConflict: "candidate_name", ignoreDuplicates: true }
    );
  if (error) throw error;

  revalidatePath("/admin/heisman");
}

export async function saveHeismanCandidates(formData: FormData) {
  await requireAdmin();
  const sb = supabaseAdmin();

  const candidates = await getHeismanCandidates();
  for (const candidate of candidates) {
    const is_finalist = formData.get(`is_finalist_${candidate.id}`) != null;
    const is_winner = formData.get(`is_winner_${candidate.id}`) != null;

    const { error } = await sb
      .from("heisman_candidates")
      .update({
        is_finalist,
        is_winner,
        updated_at: new Date().toISOString(),
      })
      .eq("id", candidate.id);
    if (error) throw error;
  }

  revalidatePath("/admin/heisman");
  revalidatePath("/");
  revalidatePath("/standings");
}
