import { NextRequest, NextResponse } from "next/server";
import { scoreWeek } from "@/lib/sync";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const adminSecretHeader = req.headers.get("x-admin-secret");
  const validHeader = Boolean(
    process.env.ADMIN_SECRET && adminSecretHeader === process.env.ADMIN_SECRET
  );

  if (!validHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const week = Number(body?.week);

  if (!week || Number.isNaN(week)) {
    return NextResponse.json({ error: "Missing or invalid 'week' in request body" }, { status: 400 });
  }

  const result = await scoreWeek(week);

  return NextResponse.json({ week, ...result });
}
