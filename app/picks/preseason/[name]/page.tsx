import {
  getPlayers,
  getPreseasonSubmission,
  getPlayoffPicksForPlayer,
  getHeismanPicksForPlayer,
} from "@/lib/data";
import PreseasonPicksForm from "@/components/PreseasonPicksForm";

export const dynamic = "force-dynamic";

export default async function PreseasonPicksPage({
  params,
}: {
  params: { name: string };
}) {
  const playerName = decodeURIComponent(params.name);
  const players = await getPlayers();
  const player = players.find((p) => p.name === playerName);

  let alreadySubmitted = false;
  let existingPlayoffPicks: string[] = [];
  let existingHeismanPicks: string[] = [];

  if (player) {
    const [submission, playoffPicks, heismanPicks] = await Promise.all([
      getPreseasonSubmission(player.id),
      getPlayoffPicksForPlayer(player.id),
      getHeismanPicksForPlayer(player.id),
    ]);
    alreadySubmitted = Boolean(submission);
    existingPlayoffPicks = playoffPicks.map((p) => p.team_name);
    existingHeismanPicks = heismanPicks.map((p) => p.candidate_name);
  }

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-xl font-bold">
        {playerName} — Preseason Playoff &amp; Heisman Picks
      </h1>

      {!player && !alreadySubmitted && (
        <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-3 text-sm">
          No player named &quot;{playerName}&quot; yet — submitting will
          create them.
        </p>
      )}

      <PreseasonPicksForm
        playerName={playerName}
        alreadySubmitted={alreadySubmitted}
        existingPlayoffPicks={existingPlayoffPicks}
        existingHeismanPicks={existingHeismanPicks}
      />
    </div>
  );
}
