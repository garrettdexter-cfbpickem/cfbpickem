import GameRow from "@/components/GameRow";
import {
  getIncludedGamesForWeek,
  getPlayers,
  getWeeklySubmissionsForWeek,
  getPicksForWeek,
} from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function WeekPage({ params }: { params: { week: string } }) {
  const week = Number(params.week);

  const [games, allPlayers, submissions, picks] = await Promise.all([
    getIncludedGamesForWeek(week),
    getPlayers(),
    getWeeklySubmissionsForWeek(week),
    getPicksForWeek(week),
  ]);

  // Reveal-all logic: picks for the week are only shown once EITHER every
  // player has submitted, OR the first game of the week has kicked off.
  // Before that, showing any individual player's picks would let players who
  // haven't submitted yet see (and copy) picks from players who already
  // have, which is exactly the bug this page used to have.
  const allSubmitted =
    allPlayers.length > 0 && allPlayers.every((p) => submissions.some((s) => s.player_id === p.id));

  const firstKickoff = games.length
    ? Math.min(...games.map((g) => new Date(g.kickoff_time).getTime()))
    : null;

  const revealAll = allSubmitted || (firstKickoff !== null && Date.now() >= firstKickoff);

  const picksByGameAndPlayer = new Map<string, string>();
  for (const pick of picks) {
    picksByGameAndPlayer.set(`${pick.game_id}|${pick.player_id}`, pick.picked_team);
  }

  return (
    <div className="space-y-8">
      <section>
        <h1 className="mb-3 text-xl font-bold">Week {week} Scoreboard</h1>
        <div className="space-y-2">
          {games.length === 0 && (
            <p className="text-sm text-neutral-600">No games in the pick&apos;em slate for this week.</p>
          )}
          {games.map((game) => (
            <GameRow key={game.id} game={game} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold">Everyone&apos;s Picks</h2>
        {!revealAll && (
          <p className="rounded-lg border bg-white p-3 text-sm text-neutral-600">
            Picks are hidden until everyone has submitted or the first game kicks off &mdash;{" "}
            {submissions.length} of {allPlayers.length} players have submitted so far.
          </p>
        )}
        {revealAll && games.length > 0 && allPlayers.length > 0 && (
          <div className="overflow-x-auto rounded-lg border bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="px-3 py-2">Game</th>
                  {allPlayers.map((player) => (
                    <th key={player.id} className="px-3 py-2">
                      {player.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {games.map((game) => (
                  <tr key={game.id} className="border-b last:border-b-0">
                    <td className="px-3 py-2 font-medium">
                      {game.away_team} @ {game.home_team}
                    </td>
                    {allPlayers.map((player) => {
                      const picked = picksByGameAndPlayer.get(`${game.id}|${player.id}`);
                      let cellClass = "px-3 py-2 text-neutral-500";
                      if (picked && game.status === "final" && game.ats_result) {
                        const coveringTeam =
                          game.ats_result === "home"
                            ? game.home_team
                            : game.ats_result === "away"
                            ? game.away_team
                            : null;
                        if (game.ats_result === "push") {
                          cellClass = "px-3 py-2 text-neutral-500";
                        } else if (picked === coveringTeam) {
                          cellClass = "px-3 py-2 text-green-700 font-semibold";
                        } else {
                          cellClass = "px-3 py-2 text-red-600 line-through";
                        }
                      } else if (picked) {
                        cellClass = "px-3 py-2 text-neutral-900";
                      }
                      return (
                        <td key={player.id} className={cellClass}>
                          {picked ?? "-"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {revealAll && (games.length === 0 || allPlayers.length === 0) && (
          <p className="text-sm text-neutral-600">Nothing to show yet.</p>
        )}
      </section>
    </div>
  );
}
