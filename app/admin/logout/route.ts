import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/adminAuth";

export async function POST(request: Request) {
    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.set(ADMIN_SESSION_COOKIE, "", {
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          maxAge: 0,
          path: "/",
    });
    return response;
}
