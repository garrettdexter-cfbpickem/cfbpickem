import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/", req.url));
  res.cookies.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
  return res;
}
