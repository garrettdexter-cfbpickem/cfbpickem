const CFBD_BASE_URL = "https://api.collegefootballdata.com";

function getApiKey(): string {
  const key = process.env.CFBD_API_KEY;
  if (!key) {
    throw new Error(
      "Missing CFBD_API_KEY environment variable. Set it in your .env.local (see .env.example)."
    );
  }
  return key;
}

async function cfbdFetch(path: string, params: Record<string, string | number>) {
  const url = new URL(CFBD_BASE_URL + path);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      Accept: "application/json",
    },
    // Always hit the network fresh - these are called from server-only sync
    // jobs, not rendered pages, so Next's fetch cache would only get in the
    // way.
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `CFBD request failed: ${res.status} ${res.statusText} for ${url.toString()} - ${body}`
    );
  }

  return res.json();
}

export interface CfbdGame {
  cfbd_game_id: number;
  home_team: string;
  away_team: string;
  kickoff_time: string;
  home_score: number | null;
  away_score: number | null;
  completed: boolean;
}

export interface CfbdLine {
  home_team: string;
  away_team: string;
  spread: number | null;
}

/**
 * Fetches games for a given year/week from CFBD's /games endpoint.
 * Defensively maps CFBD's actual (camelCase) field names, falling back to
 * snake_case variants in case an API version differs.
 */
export async function getGames(year: number, week: number): Promise<CfbdGame[]> {
  const data = await cfbdFetch("/games", {
    year,
    week,
    seasonType: "regular",
    division: "fbs",
  });

  if (!Array.isArray(data)) return [];

  return data.map((raw: any): CfbdGame => {
    const cfbd_game_id = raw.id ?? raw.game_id ?? raw.gameId;
    const home_team = raw.homeTeam ?? raw.home_team;
    const away_team = raw.awayTeam ?? raw.away_team;
    const kickoff_time = raw.startDate ?? raw.start_date;
    const home_score = raw.homePoints ?? raw.home_points ?? null;
    const away_score = raw.awayPoints ?? raw.away_points ?? null;
    const completed =
      raw.completed !== undefined && raw.completed !== null
        ? raw.completed
        : raw.status === "completed";

    return {
      cfbd_game_id,
      home_team,
      away_team,
      kickoff_time,
      home_score,
      away_score,
      completed: Boolean(completed),
    };
  });
}

/**
 * Fetches DraftKings betting lines for a given year/week from CFBD's /lines
 * endpoint. Each game returned by CFBD includes a `lines` array with one
 * entry per sportsbook provider (DraftKings, Bovada, ESPN Bet, etc). We
 * MUST select specifically the DraftKings line for each game rather than
 * "whichever book happens to be first" or falling back to another book,
 * because the app's whole spread-locking workflow is keyed to DraftKings
 * numbers specifically (that's the book the pool has always used). If a
 * game has no DraftKings line at all, we return spread: null for it rather
 * than silently substituting a different sportsbook's number.
 */
export async function getLines(year: number, week: number): Promise<CfbdLine[]> {
  const data = await cfbdFetch("/lines", {
    year,
    week,
    seasonType: "regular",
  });

  if (!Array.isArray(data)) return [];

  return data.map((raw: any): CfbdLine => {
    const home_team = raw.homeTeam ?? raw.home_team;
    const away_team = raw.awayTeam ?? raw.away_team;
    const lines: any[] = raw.lines ?? [];

    const dkLine = lines.find((line) => {
      const provider = line.provider ?? line.providerName ?? "";
      return /draftkings/i.test(String(provider));
    });

    let spread: number | null = null;
    if (dkLine) {
      const rawSpread = dkLine.spread ?? dkLine.spread_home ?? dkLine.spreadHome;
      spread = rawSpread === undefined || rawSpread === null ? null : Number(rawSpread);
      if (spread !== null && Number.isNaN(spread)) spread = null;
    }

    return { home_team, away_team, spread };
  });
}
