import type { CombinedStandingRow } from "@/lib/scoring";

export default function CombinedStandingsTable({
  rows,
}: {
  rows: CombinedStandingRow[];
}) {
  return (
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="border-b text-sm text-neutral-500">
          <th className="py-2">#</th>
          <th className="py-2">Player</th>
          <th className="py-2 text-right">Weekly</th>
          <th className="py-2 text-right">Playoff</th>
          <th className="py-2 text-right">Heisman</th>
          <th className="py-2 text-right font-semibold">Total</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={r.playerId} className="border-b last:border-0">
            <td className="py-2 text-neutral-400">{i + 1}</td>
            <td className="py-2 font-medium">
              {r.playerName}
              <div className="text-xs text-neutral-400 font-normal">
                {r.weeklyWins}-{r.weeklyLosses}-{r.weeklyPushes} ATS
              </div>
            </td>
            <td className="py-2 text-right">{r.weeklyPoints}</td>
            <td className="py-2 text-right">{r.playoffPoints}</td>
            <td className="py-2 text-right">{r.heismanPoints}</td>
            <td className="py-2 text-right font-semibold">{r.total}</td>
          </tr>
        ))}
        {rows.length === 0 && (
          <tr>
            <td colSpan={6} className="py-4 text-center text-neutral-400">
              No results yet.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
