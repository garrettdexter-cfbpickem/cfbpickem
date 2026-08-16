import { supabaseAdmin } from "./supabase";
import { getGames, getLines } from "./cfbd";
import { computeAtsResult } from "./scoring";

function getSeasonYear(): number {
  const year = process.env.SEASON_YEAR;
  if (!year) {
    throw new Error(
      "Missing SEASON_YEAR environment variable. Set it in your .env.local (see .env.example)."
    );
  }
  return Number(year);
}

/**
 * Pulls games + DraftKings lines for the given week from CFBD and upserts
 * them into the games table (matched on cfbd_game_id).
 *
 * - Never overwrites `spread` for a game that already has spread_locked =
 *   true - the previously-locked number is preserved no matter what CFBD
 *   returns now.
 * - Never touches `included_in_pickem` - that's purely an admin decision
 *   made on the admin week page, independent of syncing.
 * - Always updates kickoff_time, scores, status, and team names.
 */
export async function syncWeek(week: number): Promise<{ upserted: number }> {
  const season = getSeasonYear();
  const supabase = supabaseAdmin();

  const [games, lines] = await Promise.all([
    getGames(season, week),
    getLines(season, week),
  ]);

  const lineByMatchup = new Map<string, number | null>();
  for (const line of lines) {
    lineByMatchup.set(`${line.home_team}|${line.away_team}`, line.spread);
  }

  const cfbdGameIds = games.map((g) => g.cfbd_game_id);
  const { data: existingRows } = cfbdGameIds.length
    ? await supabase
        .from("games")
        .select("cfbd_game_id, spread, spread_locked")
        .in("cfbd_game_id", cfbdGameIds)
    : { data: [] as any[] };

  const existingByCfbdId = new Map<number, { spread: number | null; spread_locked: boolean }>();
  for (const row of existingRows ?? []) {
    existingByCfbdId.set(row.cfbd_game_id, {
      spread: row.spread,
      spread_locked: row.spread_locked,
    });
  }

  let upserted = 0;

  for (const game of games) {
    const existing = existingByCfbdId.get(game.cfbd_game_id);
    const dkSpread = lineByMatchup.get(`${game.home_team}|${game.away_team}`) ?? null;

    const spread = existing?.spread_locked ? existing.spread : dkSpread;
    const status = game.completed ? "final" : "scheduled";

    const row: Record<string, unknown> = {
      cfbd_game_id: game.cfbd_game_id,
      season,
      week,
      home_team: game.home_team,
      away_team: game.away_team,
      kickoff_time: game.kickoff_time,
      home_score: game.home_score,
      away_score: game.away_score,
      status,
      spread,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("games")
      .upsert(row, { onConflict: "cfbd_game_id" });

    if (error) {
      throw new Error(`Failed to upsert game ${game.cfbd_game_id}: ${error.message}`);
    }

    upserted += 1;
  }

  return { upserted };
}

/**
 * Fetches DraftKings lines for the week and, for every game where
 * included_in_pickem = true, sets spread to the DraftKings number (or null
 * if unavailable) and marks spread_locked = true. Games not included in the
 * pick'em slate are left alone entirely.
 */
export async function lockLinesForWeek(week: number): Promise<{ locked: number }> {
  const season = getSeasonYear();
  const supabase = supabaseAdmin();

  const lines = await getLines(season, week);
  const lineByMatchup = new Map<string, number | null>();
  for (const line of lines) {
    lineByMatchup.set(`${line.home_team}|${line.away_team}`, line.spread);
  }

  const { data: includedGames, error: fetchError } = await supabase
    .from("games")
    .select("id, home_team, away_team")
    .eq("season", season)
    .eq("week", week)
    .eq("included_in_pickem", true);

  if (fetchError) {
    throw new Error(`Failed to fetch included games for week ${week}: ${fetchError.message}`);
  }

  let locked = 0;

  for (const game of includedGames ?? []) {
    const spread = lineByMatchup.get(`${game.home_team}|${game.away_team}`) ?? null;

    const { error } = await supabase
      .from("games")
      .update({ spread, spread_locked: true, updated_at: new Date().toISOString() })
      .eq("id", game.id);

    if (error) {
      throw new Error(`Failed to lock line for game ${game.id}: ${error.message}`);
    }

    locked += 1;
  }

  return { locked };
}

/**
 * Fetches current scores/status for the week from CFBD and updates each
 * matching DB row (matched by cfbd_game_id): home_score/away_score/status
 * ('final' if CFBD reports completed, else 'in_progress' if scores exist,
 * else left as-is), and computes ats_result via computeAtsResult when a
 * game becomes final and has a non-null spread.
 */
export async function scoreWeek(week: number): Promise<{ updated: number }> {
  const season = getSeasonYear();
  const supabase = supabaseAdmin();

  const games = await getGames(season, week);

  const cfbdGameIds = games.map((g) => g.cfbd_game_id);
  const { data: existingRows, error: fetchError } = cfbdGameIds.length
    ? await supabase
        .from("games")
        .select("id, cfbd_game_id, spread, status")
        .in("cfbd_game_id", cfbdGameIds)
    : { data: [] as any[], error: null };

  if (fetchError) {
    throw new Error(`Failed to fetch existing games for week ${week}: ${fetchError.message}`);
  }

  const existingByCfbdId = new Map<
    number,
    { id: string; spread: number | null; status: string }
  >();
  for (const row of existingRows ?? []) {
    existingByCfbdId.set(row.cfbd_game_id, {
      id: row.id,
      spread: row.spread,
      status: row.status,
    });
  }

  let updated = 0;

  for (const game of games) {
    const existing = existingByCfbdId.get(game.cfbd_game_id);
    if (!existing) continue;

    let status: string;
    if (game.completed) {
      status = "final";
    } else if (game.home_score !== null || game.away_score !== null) {
      status = "in_progress";
    } else {
      status = existing.status;
    }

    const update: Record<string, unknown> = {
      home_score: game.home_score,
      away_score: game.away_score,
      status,
      updated_at: new Date().toISOString(),
    };

    if (
      status === "final" &&
      existing.spread !== null &&
      existing.spread !== undefined &&
      game.home_score !== null &&
      game.away_score !== null
    ) {
      update.ats_result = computeAtsResult(game.home_score, game.away_score, existing.spread);
    }

    const { error } = await supabase.from("games").update(update).eq("id", existing.id);

    if (error) {
      throw new Error(`Failed to update score for game ${existing.id}: ${error.message}`);
    }

    updated += 1;
  }

  return { updated };
}
