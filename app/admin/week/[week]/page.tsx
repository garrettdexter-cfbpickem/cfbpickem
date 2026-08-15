import { requireAdmin } from "@/lib/adminAuth";
import { getGamesForWeek } from "@/lib/data";
import { saveWeekSelection, syncWeekAction, lockLinesAction } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

function formatSpread(spread: number | null) {
  if (spread === null || spread === undefined) return "no line";
  return String(spread);
}

export default async function AdminWeekPage({
  params,
}: {
  params: { week: string };
}) {
  await requireAdmin();
  const week = Number(params.week);
  const games = await getGamesForWeek(week);

  const boundSave = saveWeekSelection.bind(null, week);
  const boundSync = syncWeekAction.bind(null, week);
  const boundLock = lockLinesAction.bind(null, week);

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-bold">Admin — Week {week} Games</h1>

      <div className="flex flex-wrap gap-2">
        <form action={boundSync}>
          <button className="bg-maroon text-white px-3 py-2 rounded-lg text-sm font-medium">
            Sync this week&apos;s games from CFBD
          </button>
        </form>
        <form action={boundLock}>
          <button className="border border-maroon text-maroon bg-white px-3 py-2 rounded-lg text-sm font-medium">
            Lock DraftKings lines now
          </button>
        </form>
      </div>

      {games.length === 0 ? (
        <p className="text-neutral-500">
          No games synced for this week yet — click &quot;Sync this week&apos;s
          games from CFBD&quot; above.
        </p>
      ) : (
        <form action={boundSave} className="space-y-3">
          {games.map((g) => (
            <label
              key={g.id}
              className="flex items-start gap-3 border rounded-lg p-3 bg-white"
            >
              <input
                type="checkbox"
                name={`include_${g.id}`}
                defaultChecked={g.included_in_pickem}
                className="mt-1"
              />
              <div>
                <div className="font-medium">
                  {g.away_team} <span className="text-neutral-400">@</span>{" "}
                  {g.home_team}
                </div>
                <div className="text-sm text-neutral-500">
                  {formatSpread(g.spread)}
                  {g.spread_locked && (
                    <span className="ml-2 text-xs bg-neutral-800 text-white px-1.5 py-0.5 rounded">
                      locked (DraftKings)
                    </span>
                  )}
                  {" · "}
                  {new Date(g.kickoff_time).toLocaleString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </label>
          ))}
          <button className="bg-maroon text-white px-4 py-2 rounded-lg font-medium">
            Save selection
          </button>
        </form>
      )}
    </div>
  );
}
