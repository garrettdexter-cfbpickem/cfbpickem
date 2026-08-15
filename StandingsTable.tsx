import type { StandingRow } from "@/lib/scoring";

export default function StandingsTable({ rows }: { rows: StandingRow[] }) {
  return (
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="border-b text-sm text-neutral-500">
          <th className="py-2">#</th>
          <th className="py-2">Player</th>
          <th className="py-2 text-right">W</th>
          <th className="py-2 text-right">L</th>
          <th className="py-2 text-right">Push</th>
          <th className="py-2 text-right">Win %</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={r.playerId} className="border-b last:border-0">
            <td className="py-2 text-neutral-400">{i + 1}</td>
            <td className="py-2 font-medium">{r.playerName}</td>
            <td className="py-2 text-right">{r.wins}</td>
            <td className="py-2 text-right">{r.losses}</td>
            <td className="py-2 text-right">{r.pushes}</td>
            <td className="py-2 text-right">
              {(r.winPct * 100).toFixed(0)}%
            </td>
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
