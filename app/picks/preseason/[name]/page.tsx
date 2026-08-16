import Link from "next/link";
import PreseasonPicksForm from "@/components/PreseasonPicksForm";
import {
  getPlayers,
  getPreseasonSubmission,
  getPlayoffPicksForPlayer,
  getHeismanPicksForPlayer,
} from "@/lib/data";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { name: string };
  searchParams: { confirmed?: string };
}

export default async function PreseasonPlayerPage({ params, searchParams }: PageProps) {
  const name = decodeURIComponent(params.name);

  // Same identity-verification pattern as the weekly picks page.
  if (searchParams.confirmed !== "1") {
    return (
      <div className="mx-auto max-w-md rounded-lg border bg-white p-6 text-center">
        <p className="text-lg">
          You selected: <span className="font-bold">{name}</span>.
        </p>
        <p className="mt-1 text-sm text-neutral-600">
          Please confirm this is you before making preseason picks.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <Link
            href={`/picks/preseason/${encodeURIComponent(name)}?confirmed=1`}
            className="rounded bg-lsuPurple px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Yes, that&apos;s me — continue
          </Link>
          <Link href="/picks/preseason" className="text-sm text-neutral-600 underline">
            No, take me back
          </Link>
        </div>
      </div>
    );
  }

  const players = await getPlayers();
  const player = players.find((p) => p.name === name);

  const alreadySubmitted = player ? Boolean(await getPreseasonSubmission(player.id)) : false;
  const existingPlayoffPicks = player && alreadySubmitted ? await getPlayoffPicksForPlayer(player.id) : [];
  const existingHeismanPicks = player && alreadySubmitted ? await getHeismanPicksForPlayer(player.id) : [];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">{name}&apos;s Preseason Picks</h1>
      <PreseasonPicksForm
        playerName={name}
        alreadySubmitted={alreadySubmitted}
        existingPlayoffPicks={existingPlayoffPicks}
        existingHeismanPicks={existingHeismanPicks}
      />
    </div>
  );
}
