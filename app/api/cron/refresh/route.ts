import { NextRequest, NextResponse } from "next/server";
import { getCurrentWeek } from "@/lib/data";
import { syncWeek, scoreWeek, lockLinesForWeek } from "@/lib/sync";

// Convenience "do everything" endpoint (sync + lock lines + score in one
// call) for manual testing from a browser or curl. The actual production
// schedule is two separate Vercel Cron jobs (see vercel.json):
// /api/cron/lock-lines Thursdays at noon, and /api/cron/score Sundays at
// 4am — both comfortably within Vercel Hobby's free "once per day" cron
// limit. Routine syncing itself is triggered manually from the admin week
// page. This route isn't wired to any cron itself.
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const results: Record<string, unknown> = {};

  try {
    const week = await getCurrentWeek();
    results.week = week;

    // Refresh this week's games/lines, and peek at next week so spreads
    // are already loaded before players need to pick.
    results.syncThisWeek = await syncWeek(week).catch((e) => ({
      error: String(e),
    }));
    results.syncNextWeek = await syncWeek(week + 1).catch((e) => ({
      error: String(e),
    }));
    results.lockLinesThisWeek = await lockLinesForWeek(week).catch((e) => ({
      error: String(e),
    }));
    results.scoreThisWeek = await scoreWeek(week).catch((e) => ({
      error: String(e),
    }));

    return NextResponse.json({ ok: true, ...results });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message, ...results },
      { status: 500 }
    );
  }
}
