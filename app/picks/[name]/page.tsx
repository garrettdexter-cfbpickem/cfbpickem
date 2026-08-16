import Link from "next/link";
import PicksForm from "@/components/PicksForm";
import {
  getPlayers,
  getCurrentWeek,
  getIncludedGamesForWeek,
  getPicksForWeek,
  getWeeklySubmission,
  getPreseasonSubmission,
} from "@/lib/data";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { name: string };
  searchParams: { confirmed?: string };
}

export default async function PlayerPicksPage({ params, searchParams }: PageProps) {
  const name = decodeURIComponent(params.name);

  // Step 1: identity verification. This is NOT real auth - there's no login
  // system - it's just a lightweight "are you sure this is you" confirmation
  // so one player doesn't accidentally (or mischievously) submit picks under
  // a friend's name by clicking the wrong link.
  if (searchParams.confirmed !== "1") {
    return (
      <div className="mx-auto max-w-md rounded-lg border bg-white p-6 text-center">
        <p className="text-lg">
          You selected: <span className="font-bold">{name}</span>.
        </p>
        <p className="mt-1 text-sm text-neutral-600">
          Please confirm this is you before making picks.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <Link
            href={`/picks/${encodeURIComponent(name)}?confirmed=1`}
            className="rounded bg-lsuPurple px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Yes, that&apos;s me — continue
          </Link>
          <Link href="/picks" className="text-sm text-neutral-600 underline">
            No, take me back
          </Link>
        </div>
      </div>
    );
  }

  const players = await getPlayers();
  const player = players.find((p) => p.name === name);

  const week = await getCurrentWeek();
  const games = await getIncludedGamesForWeek(week);
  const picksForWeek = player ? await getPicksForWeek(week) : [];

  const existingPicks: Record<string, string> = {};
  if (player) {
    for (const pick of picksForWeek) {
      if (pick.player_id === player.id) {
        existingPicks[pick.game_id] = pick.picked_team;
      }
    }
  }

  const alreadySubmitted = player ? Boolean(await getWeeklySubmission(player.id, week)) : false;

  const deadline = games.length
    ? Math.min(...games.map((g) => new Date(g.kickoff_time).getTime()))
    : null;

  const preseasonSubmission = player ? await getPreseasonSubmission(player.id) : null;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">
        {name}&apos;s Week {week} Picks
      </h1>
      <PicksForm
        playerName={name}
        week={week}
        games={games}
        existingPicks={existingPicks}
        deadline={deadline}
        alreadySubmitted={alreadySubmitted}
      />

      {preseasonSubmission ? (
        <div className="inline-block rounded bg-lsuGold px-3 py-1 text-sm font-semibold text-lsuPurple">
          ✓ Preseason picks submitted
        </div>
      ) : (
        <div>
          <Link
            href={`/picks/preseason/${encodeURIComponent(name)}`}
            className="text-sm text-lsuPurple underline"
          >
            Haven&apos;t submitted your preseason Playoff &amp; Heisman picks yet? Do that here.
          </Link>
        </div>
      )}
    </div>
  );
}
