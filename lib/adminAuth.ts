import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

export const ADMIN_SESSION_COOKIE = "admin_session";

/**
 * For use in Server Components. Redirects to /admin/login if the
 * admin_session cookie doesn't match ADMIN_SECRET.
 */
export async function requireAdmin(): Promise<void> {
  const cookieStore = cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const secret = process.env.ADMIN_SECRET;

  if (!secret || !session || session !== secret) {
    redirect("/admin/login");
  }
}

/**
 * For use in Route Handlers. Does NOT redirect - just returns whether the
 * request carries a valid admin_session cookie, so the caller can return its
 * own 401 JSON response.
 */
export function isAdminRequest(req: NextRequest): boolean {
  const session = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const secret = process.env.ADMIN_SECRET;
  return Boolean(secret && session && session === secret);
}
