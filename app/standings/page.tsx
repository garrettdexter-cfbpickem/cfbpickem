import Link from "next/link";
import {
  getAllGames,
  getAllPicks,
  getPlayers,
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
import CombinedStandingsTable from "@/components/CombinedStandingsTable";

export const dynamic = "force-dynamic";

export default async function StandingsPage() {
  const [players, games, picks, playoffTeams, playoffPicks, heismanCandidates, heismanPicks] =
    await Promise.all([
      getPlayers(),
      getAllGames(),
      getAllPicks(),
      getPlayoffTeams(),
      getPlayoffPicks(),
      getHeismanCandidates(),
      getHeismanPicks(),
    ]);

  const weeklyStandings = buildStandings(players, games, picks);
  const playoffPointsByPlayer = computePlayoffPoints(playoffTeams, playoffPicks);
  const heismanPointsByPlayer = computeHeismanPoints(heismanCandidates, heismanPicks);
  const combined = buildCombinedStandings(
    players,
    weeklyStandings,
    playoffPointsByPlayer,
    heismanPointsByPlayer
  );

  const weeks = Array.from(new Set(games.map((g) => g.week))).sort(
    (a, b) => a - b
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Season Standings</h1>
      <CombinedStandingsTable rows={combined} />

      <div>
        <h2 className="font-semibold mb-2">Weeks</h2>
        <div className="flex flex-wrap gap-2">
          {weeks.map((w) => (
            <Link
              key={w}
              href={`/week/${w}`}
              className="text-sm border rounded px-3 py-1 bg-white hover:bg-neutral-100"
            >
              Week {w}
            </Link>
          ))}
          {weeks.length === 0 && (
            <p className="text-neutral-500 text-sm">No weeks synced yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
