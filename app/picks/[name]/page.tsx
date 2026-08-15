import Link from "next/link";
import {
  getCurrentWeek,
  getIncludedGamesForWeek,
  getPicksForWeek,
  getPlayers,
  getWeeklySubmission,
} from "@/lib/data";
import PicksForm from "@/components/PicksForm";

export const dynamic = "force-dynamic";

export default async function PlayerPicksPage({
  params,
}: {
  params: { name: string };
}) {
  const playerName = decodeURIComponent(params.name);
  const week = await getCurrentWeek();
  const [games, picks, players] = await Promise.all([
    getIncludedGamesForWeek(week),
    getPicksForWeek(week),
    getPlayers(),
  ]);

  const player = players.find((p) => p.name === playerName);

  const existingPicks: Record<string, string> = {};
  for (const p of picks) {
    if (p.player_id === player?.id) existingPicks[p.game_id] = p.picked_team;
  }

  const alreadySubmitted = player
    ? Boolean(await getWeeklySubmission(player.id, week))
    : false;

  const deadline =
    games.length > 0
      ? Math.min(...games.map((g) => new Date(g.kickoff_time).getTime()))
      : null;

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-xl font-bold">
        {playerName}&apos;s Picks — Week {week}
      </h1>

      {!player && !alreadySubmitted && (
        <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-3 text-sm">
          No player named &quot;{playerName}&quot; yet — submitting will
          create them.
        </p>
      )}

      {games.length === 0 ? (
        <p className="text-neutral-500">
          No games are open for picks yet this week — check back once the
          admin has selected this week&apos;s slate.
        </p>
      ) : (
        <PicksForm
          playerName={playerName}
          week={week}
          games={games}
          existingPicks={existingPicks}
          deadline={deadline}
          alreadySubmitted={alreadySubmitted}
        />
      )}

      <p className="text-sm text-neutral-500">
        Haven&apos;t submitted your preseason Playoff &amp; Heisman picks
        yet?{" "}
        <Link
          href={`/picks/preseason/${encodeURIComponent(playerName)}`}
          className="text-maroon underline"
        >
          Do that here
        </Link>
        .
      </p>
    </div>
  );
}
