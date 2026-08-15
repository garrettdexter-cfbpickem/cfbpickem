import Link from "next/link";
import { requireAdmin } from "@/lib/adminAuth";
import { getCurrentWeek } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  await requireAdmin();
  const week = await getCurrentWeek();

  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-xl font-bold">Admin</h1>
      <nav className="flex flex-col gap-2">
        <Link
          href={`/admin/week/${week}`}
          className="border rounded-lg p-3 bg-white hover:bg-neutral-100"
        >
          Week {week} Games
        </Link>
        <Link
          href="/admin/playoff"
          className="border rounded-lg p-3 bg-white hover:bg-neutral-100"
        >
          Playoff Pool
        </Link>
        <Link
          href="/admin/heisman"
          className="border rounded-lg p-3 bg-white hover:bg-neutral-100"
        >
          Heisman Pool
        </Link>
      </nav>
      <a href="/admin/logout" className="inline-block text-sm text-maroon underline">
        Log out
      </a>
    </div>
  );
}
