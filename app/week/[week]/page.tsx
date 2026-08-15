import {
  getIncludedGamesForWeek,
  getPicksForWeek,
  getPlayers,
  getWeeklySubmissionsForWeek,
} from "@/lib/data";
import GameRow from "@/components/GameRow";

export const dynamic = "force-dynamic";

export default async function WeekPage({
  params,
}: {
  params: { week: string };
}) {
  const week = Number(params.week);
  const [games, picks, players, submissions] = await Promise.all([
    getIncludedGamesForWeek(week),
    getPicksForWeek(week),
    getPlayers(),
    getWeeklySubmissionsForWeek(week),
  ]);

  const submittedPlayerIds = new Set(submissions.map((s) => s.player_id));

  const pickByPlayerAndGame = new Map<string, string>();
  for (const p of picks) pickByPlayerAndGame.set(`${p.player_id}:${p.game_id}`, p.picked_team);

  const now = Date.now();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Week {week} Scoreboard</h1>

      <div className="space-y-2">
        {games.map((g) => (
          <GameRow key={g.id} game={g} />
        ))}
        {games.length === 0 && (
          <p className="text-neutral-500">
            No games are in the pick&apos;em slate for this week yet.
          </p>
        )}
      </div>

      {players.length > 0 && games.length > 0 && (
        <div className="overflow-x-auto">
          <h2 className="font-semibold mb-2">Everyone&apos;s Picks</h2>
          <p className="text-xs text-neutral-500 mb-2">
            A player&apos;s pick for a game is only revealed once they&apos;ve
            submitted their picks for the week, or that game has kicked off
            — whichever comes first.
          </p>
          <table className="w-full text-sm border-collapse bg-white">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Game</th>
                {players.map((pl) => (
                  <th key={pl.id} className="p-2 text-left whitespace-nowrap">
                    {pl.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {games.map((g) => {
                const kickoffPassed = new Date(g.kickoff_time).getTime() <= now;
                return (
                  <tr key={g.id} className="border-b last:border-0">
                    <td className="p-2 whitespace-nowrap">
                      {g.away_team} @ {g.home_team}
                    </td>
                    {players.map((pl) => {
                      const picked = pickByPlayerAndGame.get(`${pl.id}:${g.id}`);
                      const canReveal = submittedPlayerIds.has(pl.id) || kickoffPassed;

                      let cellClass = "p-2";
                      let content = "—";

                      if (picked) {
                        if (canReveal) {
                          content = picked;
                          if (g.status === "final" && g.ats_result) {
                            const coveringTeam =
                              g.ats_result === "home" ? g.home_team : g.away_team;
                            if (g.ats_result === "push") {
                              cellClass += " text-neutral-500";
                            } else if (picked === coveringTeam) {
                              cellClass += " text-green-700 font-medium";
                            } else {
                              cellClass += " text-red-600 line-through";
                            }
                          }
                        } else {
                          content = "picked";
                          cellClass += " text-neutral-400 italic";
                        }
                      }

                      return (
                        <td key={pl.id} className={cellClass}>
                          {content}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
