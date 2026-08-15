import { supabaseAdmin } from "./supabase";
import { getGames, getLines } from "./cfbd";
import { computeAtsResult } from "./scoring";

function seasonYear(): number {
  return Number(process.env.SEASON_YEAR ?? new Date().getFullYear());
}

/**
 * Pull this week's games + betting lines from CFBD and upsert them into
 * the `games` table. Safe to call repeatedly (e.g. manually from the admin
 * week page) — kickoff times, scores, and team names get refreshed, but the
 * spread is never overwritten for a game that already has `spread_locked`
 * set (that game's number was locked in from DraftKings and must stay put
 * until an admin/cron explicitly re-locks it). `included_in_pickem` is left
 * untouched entirely — this function never selects games for the slate.
 */
export async function syncWeek(week: number) {
  const year = seasonYear();
  const sb = supabaseAdmin();

  const [games, lines, existingRes] = await Promise.all([
    getGames(year, week),
    getLines(year, week),
    sb
      .from("games")
      .select("cfbd_game_id, spread, spread_locked")
      .eq("season", year)
      .eq("week", week),
  ]);
  if (existingRes.error) throw existingRes.error;

  const existingByCfbdId = new Map(
    (existingRes.data ?? []).map((g: any) => [g.cfbd_game_id, g])
  );

  const lineByMatchup = new Map(
    lines.map((l) => [`${l.home_team}__${l.away_team}`, l.spread])
  );

  const rows = games.map((g) => {
    const existing = existingByCfbdId.get(g.cfbd_game_id);
    const locked = existing?.spread_locked === true;
    const newSpread = lineByMatchup.get(`${g.home_team}__${g.away_team}`) ?? null;

    return {
      cfbd_game_id: g.cfbd_game_id,
      season: year,
      week,
      home_team: g.home_team,
      away_team: g.away_team,
      // Never overwrite a locked spread — keep whatever is already stored.
      spread: locked ? existing.spread : newSpread,
      kickoff_time: g.kickoff_time,
      home_score: g.home_score,
      away_score: g.away_score,
      status: g.completed ? "final" : "scheduled",
      updated_at: new Date().toISOString(),
    };
  });

  if (rows.length === 0) {
    return { synced: 0 };
  }

  const { error } = await sb
    .from("games")
    .upsert(rows, { onConflict: "cfbd_game_id" });
  if (error) throw error;

  return { synced: rows.length };
}

/**
 * Fetch DraftKings lines for the week and lock them in for every game that
 * is currently flagged `included_in_pickem`. Sets `spread` to the
 * DraftKings number (or null if DraftKings hasn't posted one) and marks
 * `spread_locked = true` so `syncWeek` never touches it again. Games not
 * included in the pick'em slate are left completely alone. Intended to run
 * Thursdays at noon (see app/api/cron/lock-lines/route.ts) but can also be
 * triggered manually from the admin week page.
 */
export async function lockLinesForWeek(week: number) {
  const year = seasonYear();
  const sb = supabaseAdmin();

  const [lines, gamesRes] = await Promise.all([
    getLines(year, week),
    sb
      .from("games")
      .select("id, home_team, away_team")
      .eq("season", year)
      .eq("week", week)
      .eq("included_in_pickem", true),
  ]);
  if (gamesRes.error) throw gamesRes.error;

  const lineByMatchup = new Map(
    lines.map((l) => [`${l.home_team}__${l.away_team}`, l.spread])
  );

  let locked = 0;
  for (const game of gamesRes.data ?? []) {
    const dkSpread =
      lineByMatchup.get(`${game.home_team}__${game.away_team}`) ?? null;

    const { error } = await sb
      .from("games")
      .update({
        spread: dkSpread,
        spread_locked: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", game.id);
    if (error) throw error;
    locked += 1;
  }

  return { locked };
}

/**
 * Refresh scores/status for a week's games from CFBD and compute ATS
 * results for anything that has finished.
 */
export async function scoreWeek(week: number) {
  const year = seasonYear();
  const sb = supabaseAdmin();

  const [cfbdGames, { data: dbGames, error: dbErr }] = await Promise.all([
    getGames(year, week),
    sb.from("games").select("*").eq("week", week).eq("season", year),
  ]);
  if (dbErr) throw dbErr;

  const dbGameById = new Map((dbGames ?? []).map((g: any) => [g.cfbd_game_id, g]));

  let updated = 0;
  for (const cg of cfbdGames) {
    const existing = dbGameById.get(cg.cfbd_game_id);
    if (!existing) continue; // game not synced yet — run sync-week first

    const hasScore = cg.home_score !== null && cg.away_score !== null;
    let status: "scheduled" | "in_progress" | "final" = existing.status;
    let atsResult: "home" | "away" | "push" | null = existing.ats_result;

    if (cg.completed && hasScore) {
      status = "final";
      if (existing.spread !== null && existing.spread !== undefined) {
        atsResult = computeAtsResult(
          cg.home_score as number,
          cg.away_score as number,
          Number(existing.spread)
        );
      }
    } else if (hasScore) {
      status = "in_progress";
    }

    const { error } = await sb
      .from("games")
      .update({
        home_score: cg.home_score,
        away_score: cg.away_score,
        status,
        ats_result: atsResult,
        updated_at: new Date().toISOString(),
      })
      .eq("cfbd_game_id", cg.cfbd_game_id);

    if (error) throw error;
    updated += 1;
  }

  return { updated };
}
