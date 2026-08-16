import Link from "next/link";
import { requireAdmin } from "@/lib/adminAuth";
import { getCurrentWeek } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  await requireAdmin();
  const currentWeek = await getCurrentWeek();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Admin</h1>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href={`/admin/week/${currentWeek}`}
          className="rounded-lg border bg-white p-4 font-medium hover:border-lsuGold"
        >
          Week Games (Week {currentWeek})
        </Link>
        <Link
          href="/admin/playoff"
          className="rounded-lg border bg-white p-4 font-medium hover:border-lsuGold"
        >
          Playoff Pool
        </Link>
        <Link
          href="/admin/heisman"
          className="rounded-lg border bg-white p-4 font-medium hover:border-lsuGold"
        >
          Heisman Pool
        </Link>
        <Link
          href="/admin/players"
          className="rounded-lg border bg-white p-4 font-medium hover:border-lsuGold"
        >
          Players
        </Link>
      </div>
      <form action="/admin/logout" method="POST">
        <button type="submit" className="inline-block text-sm text-neutral-600 underline">
          Log out
        </button>
      </form>
    </div>
  );
}
