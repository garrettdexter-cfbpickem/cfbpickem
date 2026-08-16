import Link from "next/link";
import GameRow from "@/components/GameRow";
import CombinedStandingsTable from "@/components/CombinedStandingsTable";
import {
  getCurrentWeek,
  getIncludedGamesForWeek,
  getPlayers,
  getAllGames,
  getAllPicks,
  getPlayoffTeams,
  getPlayoffPicks,
  getHeismanCandidates,
  getHeismanPicks,
} from "@/lib/data";
import {
  computeWeeklyPoints,
  computePlayoffPoints,
  computeHeismanPoints,
  buildCombinedStandings,
} from "@/lib/scoring";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const week = await getCurrentWeek();

  const [games, players, allGames, allPicks, playoffTeams, playoffPicks, heismanCandidates, heismanPicks] =
    await Promise.all([
      getIncludedGamesForWeek(week),
      getPlayers(),
      getAllGames(),
      getAllPicks(),
      getPlayoffTeams(),
      getPlayoffPicks(),
      getHeismanCandidates(),
      getHeismanPicks(),
    ]);

  const weeklyPoints = computeWeeklyPoints(players, allGames, allPicks);
  const playoffPoints = computePlayoffPoints(playoffTeams, playoffPicks);
  const heismanPoints = computeHeismanPoints(heismanCandidates, heismanPicks);
  const standings = buildCombinedStandings(players, weeklyPoints, playoffPoints, heismanPoints);

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-xl font-bold">Week {week} Games</h1>
          <Link href={`/week/${week}`} className="text-sm text-lsuPurple underline">
            Full scoreboard
          </Link>
        </div>
        <div className="space-y-2">
          {games.length === 0 && (
            <p className="text-sm text-neutral-600">
              No games have been added to the pick&apos;em slate for this week yet.
            </p>
          )}
          {games.map((game) => (
            <GameRow key={game.id} game={game} />
          ))}
        </div>
        <div className="mt-4">
          <Link
            href="/picks"
            className="inline-block rounded bg-lsuPurple px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Make Your Picks
          </Link>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold">Standings</h2>
          <Link href="/standings" className="text-sm text-lsuPurple underline">
            Full standings
          </Link>
        </div>
        <CombinedStandingsTable rows={standings.slice(0, 5)} />
      </section>
    </div>
  );
}
