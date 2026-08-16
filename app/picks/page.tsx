import Link from "next/link";
import { getPlayers } from "@/lib/data";
import { addPlayerAndGoToPicks } from "./actions";

export const dynamic = "force-dynamic";

export default async function PicksLandingPage() {
  const players = await getPlayers();

  return (
    <div className="space-y-8">
      <section>
        <h1 className="mb-3 text-xl font-bold">Who&apos;s picking?</h1>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {players.map((player) => (
            <Link
              key={player.id}
              href={`/picks/${encodeURIComponent(player.name)}`}
              className="rounded-lg border bg-white p-3 text-center font-medium hover:border-lsuGold"
            >
              {player.name}
            </Link>
          ))}
        </div>
        {players.length === 0 && (
          <p className="text-sm text-neutral-600">No players yet — add one below.</p>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Not on the list?</h2>
        <form action={addPlayerAndGoToPicks} className="flex gap-2">
          <input
            type="text"
            name="name"
            placeholder="Your name"
            required
            className="flex-1 rounded border px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded bg-lsuPurple px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Continue
          </button>
        </form>
      </section>

      <section>
        <Link href="/picks/preseason" className="text-sm text-lsuPurple underline">
          See everyone&apos;s preseason picks
        </Link>
      </section>
    </div>
  );
}
