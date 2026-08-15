import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

// Kept simple on purpose: the cookie's value IS the admin secret. There's no
// separate session store — we just compare the cookie against
// process.env.ADMIN_SECRET on every check. Good enough for a small trusted
// friend group behind a single shared password.
export const ADMIN_COOKIE_NAME = "admin_session";

/**
 * For use in Server Components / page-level route handlers. Redirects to
 * /admin/login if the admin_session cookie doesn't match ADMIN_SECRET.
 */
export async function requireAdmin(): Promise<void> {
  const store = cookies();
  const value = store.get(ADMIN_COOKIE_NAME)?.value;
  const expected = process.env.ADMIN_SECRET;

  if (!expected || !value || value !== expected) {
    redirect("/admin/login");
  }
}

/**
 * For use inside Route Handlers (API routes) that should return a 401 JSON
 * response themselves rather than redirect. Checks the same cookie from the
 * incoming request.
 */
export function isAdminRequest(req: NextRequest): boolean {
  const value = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const expected = process.env.ADMIN_SECRET;
  return Boolean(expected) && Boolean(value) && value === expected;
}
