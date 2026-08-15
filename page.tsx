import Link from "next/link";
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
  buildStandings,
  buildCombinedStandings,
  computePlayoffPoints,
  computeHeismanPoints,
} from "@/lib/scoring";
import GameRow from "@/components/GameRow";
import CombinedStandingsTable from "@/components/CombinedStandingsTable";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [
    week,
    players,
    allGames,
    allPicks,
    playoffTeams,
    playoffPicks,
    heismanCandidates,
    heismanPicks,
  ] = await Promise.all([
    getCurrentWeek(),
    getPlayers(),
    getAllGames(),
    getAllPicks(),
    getPlayoffTeams(),
    getPlayoffPicks(),
    getHeismanCandidates(),
    getHeismanPicks(),
  ]);

  const weekGames = await getIncludedGamesForWeek(week);

  const weeklyStandings = buildStandings(players, allGames, allPicks);
  const playoffPointsByPlayer = computePlayoffPoints(playoffTeams, playoffPicks);
  const heismanPointsByPlayer = computeHeismanPoints(heismanCandidates, heismanPicks);
  const combined = buildCombinedStandings(
    players,
    weeklyStandings,
    playoffPointsByPlayer,
    heismanPointsByPlayer
  ).slice(0, 5);

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h1 className="text-xl font-bold">Week {week}</h1>
          <Link href={`/week/${week}`} className="text-sm text-maroon underline">
            Full scoreboard &rarr;
          </Link>
        </div>
        {weekGames.length === 0 ? (
          <p className="text-neutral-500">
            No games are in the pick&apos;em slate for this week yet. Check
            back once the admin has selected this week&apos;s games.
          </p>
        ) : (
          <div className="space-y-2">
            {weekGames.map((g) => (
              <GameRow key={g.id} game={g} />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-xl font-bold">League Standings</h2>
          <Link href="/standings" className="text-sm text-maroon underline">
            Full standings &rarr;
          </Link>
        </div>
        <CombinedStandingsTable rows={combined} />
      </section>

      <section>
        <Link
          href="/picks"
          className="inline-block bg-maroon text-white px-4 py-2 rounded-lg font-medium"
        >
          Make your picks for Week {week}
        </Link>
      </section>
    </div>
  );
}
