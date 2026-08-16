import Link from "next/link";
import CombinedStandingsTable from "@/components/CombinedStandingsTable";
import {
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

export default async function StandingsPage() {
  const [players, allGames, allPicks, playoffTeams, playoffPicks, heismanCandidates, heismanPicks] =
    await Promise.all([
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

  const weeks = Array.from(new Set(allGames.map((g) => g.week))).sort((a, b) => a - b);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="mb-3 text-xl font-bold">Combined Standings</h1>
        <CombinedStandingsTable rows={standings} />
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold">Weeks</h2>
        {weeks.length === 0 && <p className="text-sm text-neutral-600">No weeks synced yet.</p>}
        <div className="flex flex-wrap gap-2">
          {weeks.map((week) => (
            <Link
              key={week}
              href={`/week/${week}`}
              className="rounded border bg-white px-3 py-1.5 text-sm hover:border-lsuGold"
            >
              Week {week}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
