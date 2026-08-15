import { NextRequest, NextResponse } from "next/server";
import { getCurrentWeek } from "@/lib/data";
import { lockLinesForWeek } from "@/lib/sync";

// Runs Thursdays at noon via Vercel Cron (see vercel.json). Locks in the
// DraftKings spread for every game the admin has flagged
// included_in_pickem for the current week, and marks those games
// spread_locked so routine syncs never overwrite the number again.
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const week = await getCurrentWeek();
    const result = await lockLinesForWeek(week);
    return NextResponse.json({ ok: true, week, ...result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
