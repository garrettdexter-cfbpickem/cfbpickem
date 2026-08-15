import { NextRequest, NextResponse } from "next/server";
import { syncWeek } from "@/lib/sync";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const week = Number(body.week);
  if (!week || week < 1) {
    return NextResponse.json({ error: "week is required" }, { status: 400 });
  }

  try {
    const result = await syncWeek(week);
    return NextResponse.json({ ok: true, week, ...result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
