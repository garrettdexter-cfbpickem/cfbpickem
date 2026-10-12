import type { AdjustedStandingRow } from "@/lib/adjustments";

export default function CombinedStandingsTable({ rows }: { rows: AdjustedStandingRow[] }) {

  return (

    <div className="overflow-x-auto rounded-lg border bg-white">

      <table className="w-full text-left text-sm">

        <thead className="border-b bg-neutral-50 text-neutral-600">

          <tr>

            <th className="px-3 py-2">#</th>

            <th className="px-3 py-2">Player</th>

            <th className="px-3 py-2">Weekly</th>

            <th className="px-3 py-2">Playoff</th>

            <th className="px-3 py-2">Heisman</th>

            <th className="px-3 py-2">Adj.</th>

            <th className="px-3 py-2">Total</th>

          </tr>

        </thead>

        <tbody>

          {rows.map((row, i) => (

            <tr key={row.playerId} className="border-b last:border-b-0">

              <td className="px-3 py-2">{i + 1}</td>

              <td className="px-3 py-2 font-medium">{row.playerName}</td>

              <td className="px-3 py-2">{row.weeklyPoints}</td>

              <td className="px-3 py-2">{row.playoffPoints}</td>

              <td className="px-3 py-2">{row.heismanPoints}</td>

              <td className="px-3 py-2">

                {row.adjustmentPoints > 0 ? "+" + row.adjustmentPoints : row.adjustmentPoints}

              </td>

              <td className="px-3 py-2 font-bold">{row.totalPoints}</td>

            </tr>

          ))}

          {rows.length === 0 && (

            <tr>

              <td colSpan={7} className="px-3 py-4 text-center text-neutral-500">

                No players yet.

              </td>

            </tr>

          )}

        </tbody>

      </table>

    </div>

  );

}