import { NextRequest, NextResponse } from "next/server";
import { getCurrentWeek } from "@/lib/data";
import { scoreWeek } from "@/lib/sync";

// Runs Sundays at 4am via Vercel Cron (see vercel.json) — well within
// Vercel Hobby's free "once per day" cron limit. Picks up final scores and
// computes ATS results for whichever games have finished by then. It's a
// plain GET endpoint protected by a bearer secret (Authorization: Bearer
// CRON_SECRET), same pattern Vercel Cron and the other cron routes use.
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const week = await getCurrentWeek();
    const result = await scoreWeek(week);
    return NextResponse.json({ ok: true, week, ...result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
