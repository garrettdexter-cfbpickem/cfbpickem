import { NextRequest, NextResponse } from "next/server";
import { getCurrentWeek } from "@/lib/data";
import { syncWeek } from "@/lib/sync";

// NOT wired into vercel.json anymore — the owner now triggers syncing
// manually from the admin week page (/admin/week/[week], "Sync this week's
// games from CFBD", which calls lib/sync.ts's syncWeek() directly). This
// route is left in place, still working, in case a scheduled or ad-hoc
// sync is ever wanted again; it's simply unused by default.
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const week = await getCurrentWeek();
    const thisWeek = await syncWeek(week).catch((e) => ({ error: String(e) }));
    const nextWeek = await syncWeek(week + 1).catch((e) => ({ error: String(e) }));
    return NextResponse.json({ ok: true, week, thisWeek, nextWeek });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
