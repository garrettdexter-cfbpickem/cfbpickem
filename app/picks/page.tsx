import Link from "next/link";
import { getPlayers } from "@/lib/data";
import { createPlayer } from "./actions";

export const dynamic = "force-dynamic";

export default async function PicksLandingPage() {
  const players = await getPlayers();

  return (
    <div className="space-y-6 max-w-md">
      <h1 className="text-xl font-bold">Who&apos;s picking?</h1>

      <div className="flex flex-wrap gap-2">
        {players.map((p) => (
          <div
            key={p.id}
            className="border rounded-lg px-3 py-2 bg-white flex items-center gap-2"
          >
            <Link
              href={`/picks/${encodeURIComponent(p.name)}`}
              className="hover:underline"
            >
              {p.name}
            </Link>
            <Link
              href={`/picks/preseason/${encodeURIComponent(p.name)}`}
              className="text-xs text-maroon underline"
            >
              preseason picks
            </Link>
          </div>
        ))}
        {players.length === 0 && (
          <p className="text-neutral-500 text-sm">
            No players yet — add your name below to get started.
          </p>
        )}
      </div>

      <form action={createPlayer} className="flex gap-2">
        <input
          name="name"
          placeholder="New player name"
          required
          className="border rounded-lg px-3 py-2 flex-1"
        />
        <button className="bg-maroon text-white px-4 py-2 rounded-lg font-medium">
          Go
        </button>
      </form>
    </div>
  );
}
