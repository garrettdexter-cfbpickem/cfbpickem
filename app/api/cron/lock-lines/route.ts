import { NextRequest, NextResponse } from "next/server";
import { getCurrentWeek } from "@/lib/data";
import { lockLinesForWeek } from "@/lib/sync";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const week = await getCurrentWeek();
  const result = await lockLinesForWeek(week);

  return NextResponse.json({ week, ...result });
}
