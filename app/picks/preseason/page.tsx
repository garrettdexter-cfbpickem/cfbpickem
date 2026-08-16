import {
  getPlayers,
  getPreseasonSubmission,
  getPlayoffPicksForPlayer,
  getHeismanPicksForPlayer,
} from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function PreseasonOverviewPage() {
  const players = await getPlayers();

  const cards = await Promise.all(
    players.map(async (player) => {
      const submission = await getPreseasonSubmission(player.id);
      if (!submission) {
        return { player, submitted: false as const };
      }
      const [playoffPicks, heismanPicks] = await Promise.all([
        getPlayoffPicksForPlayer(player.id),
        getHeismanPicksForPlayer(player.id),
      ]);
      return { player, submitted: true as const, playoffPicks, heismanPicks };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Everyone&apos;s Preseason Picks</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Playoff Pool and Heisman Pool picks are viewable here at any time, for everyone.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <div key={card.player.id} className="rounded-lg border bg-white p-4">
            <h2 className="text-lg font-semibold">{card.player.name}</h2>
            {!card.submitted && (
              <p className="mt-2 text-sm text-neutral-500">Not submitted yet.</p>
            )}
            {card.submitted && (
              <div className="mt-2 space-y-3 text-sm">
                <div>
                  <h3 className="font-medium">Playoff Pool</h3>
                  <ul className="mt-1 list-inside list-disc text-neutral-700">
                    {card.playoffPicks.map((pick) => (
                      <li key={pick.id}>{pick.team_name}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium">Heisman Pool</h3>
                  <ul className="mt-1 list-inside list-disc text-neutral-700">
                    {card.heismanPicks.map((pick) => (
                      <li key={pick.id}>{pick.candidate_name}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        ))}
        {cards.length === 0 && (
          <p className="text-sm text-neutral-600">No players yet.</p>
        )}
      </div>
    </div>
  );
}
