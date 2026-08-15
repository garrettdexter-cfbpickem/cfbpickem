// Thin wrapper around the CollegeFootballData.com REST API.
// Docs: https://api.collegefootballdata.com
//
// NOTE: CFBD's response field names occasionally shift between API
// versions. If sync-week or score-week start failing, check the current
// shape at https://api.collegefootballdata.com and adjust the mapping
// functions below (mapGame / mapLine).

const BASE_URL = "https://api.collegefootballdata.com";

function apiKey(): string {
  const key = process.env.CFBD_API_KEY;
  if (!key) throw new Error("Missing CFBD_API_KEY env var");
  return key;
}

async function cfbdFetch(path: string, params: Record<string, string>) {
  const url = new URL(BASE_URL + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      Accept: "application/json",
    },
    // Always fetch fresh data — this is only ever called from server routes.
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`CFBD request failed (${res.status}): ${body}`);
  }

  return res.json();
}

export type CfbdGame = {
  cfbd_game_id: number;
  home_team: string;
  away_team: string;
  kickoff_time: string;
  home_score: number | null;
  away_score: number | null;
  completed: boolean;
};

export type CfbdLine = {
  home_team: string;
  away_team: string;
  spread: number | null; // home team spread
};

export async function getGames(
  year: number,
  week: number
): Promise<CfbdGame[]> {
  const raw = await cfbdFetch("/games", {
    year: String(year),
    week: String(week),
    seasonType: "regular",
    division: "fbs",
  });

  return (raw as any[]).map((g) => ({
    cfbd_game_id: g.id,
    home_team: g.homeTeam ?? g.home_team,
    away_team: g.awayTeam ?? g.away_team,
    kickoff_time: g.startDate ?? g.start_date,
    home_score: g.homePoints ?? g.home_points ?? null,
    away_score: g.awayPoints ?? g.away_points ?? null,
    completed: Boolean(g.completed),
  }));
}

export async function getLines(
  year: number,
  week: number
): Promise<CfbdLine[]> {
  const raw = await cfbdFetch("/lines", {
    year: String(year),
    week: String(week),
    seasonType: "regular",
  });

  return (raw as any[]).map((g) => {
    const lines = g.lines ?? [];
    // The owner requires the spread to come specifically from DraftKings.
    // If DraftKings hasn't posted a line for this game, leave spread null
    // rather than silently substituting a "consensus" number or whichever
    // book happens to be first in the array — a wrong-but-present spread is
    // worse than a visibly blank one here.
    const preferred = lines.find((l: any) => /draftkings/i.test(l.provider ?? "")) ?? null;

    const spreadRaw = preferred?.spread;
    const spread =
      spreadRaw === undefined || spreadRaw === null
        ? null
        : Number(spreadRaw);

    return {
      home_team: g.homeTeam ?? g.home_team,
      away_team: g.awayTeam ?? g.away_team,
      spread,
    };
  });
}
