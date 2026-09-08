import { requireAdmin } from "@/lib/adminAuth";
import { getGamesForWeek } from "@/lib/data";
import {
  saveGameSelection,
  syncWeekAction,
  lockLinesAction,
  scoreWeekAction,
} from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function AdminWeekPage({ params }: { params: { week: string } }) {
  await requireAdmin();
  const week = Number(params.week);
  const games = await getGamesForWeek(week);

  const saveGameSelectionForWeek = saveGameSelection.bind(null, week);
  const syncWeekForWeek = syncWeekAction.bind(null, week);
  const lockLinesForWeek = lockLinesAction.bind(null, week);
  const scoreWeekForWeek = scoreWeekAction.bind(null, week);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Admin — Week {week} Games</h1>

      <div className="flex flex-wrap gap-2">
        <form action={syncWeekForWeek}>
          <button
            type="submit"
            className="rounded bg-lsuPurple px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Sync this week&apos;s games from CFBD
          </button>
        </form>
        <form action={lockLinesForWeek}>
          <button
            type="submit"
            className="rounded border border-lsuPurple px-4 py-2 text-sm font-semibold text-lsuPurple hover:bg-neutral-50"
          >
            Lock DraftKings lines now
          </button>
        </form>
        <form action={scoreWeekForWeek}>
          <button
            type="submit"
            className="rounded border border-lsuPurple px-4 py-2 text-sm font-semibold text-lsuPurple hover:bg-neutral-50"
          >
            Force score this week now
          </button>
        </form>
      </div>
      <p className="text-xs text-neutral-500">
        &quot;Force score this week now&quot; pulls current scores/status from CFBD and computes
        results for every final game that has a locked spread. Normally this runs automatically
        every Sunday at 4am, but it&apos;s safe to click any time — e.g. right after games finish,
        or if some games were still in progress when the automatic run happened.
      </p>

      <form action={saveGameSelectionForWeek} className="space-y-3">
        <div className="space-y-2">
          {games.map((game) => {
            const kickoff = new Date(game.kickoff_time).toLocaleString();
            const spreadLabel =
              game.spread === null || game.spread === undefined
                ? "no line"
                : game.spread === 0
                ? "pick 'em"
                : `${game.home_team} ${game.spread}`;
            const scoreLabel =
              game.status === "scheduled"
                ? "not started"
                : `${game.away_team} ${game.away_score ?? "-"} @ ${game.home_team} ${
                    game.home_score ?? "-"
                  } (${game.status === "final" ? "final" : "in progress"})`;
            const atsLabel =
              game.status !== "final"
                ? null
                : game.ats_result
                ? game.ats_result === "push"
                  ? "scored: push"
                  : `scored: ${game.ats_result === "home" ? game.home_team : game.away_team} covered`
                : "final, but NOT scored yet (needs a locked spread)";
            return (
              <label
                key={game.id}
                className="flex items-center gap-3 rounded-lg border bg-white p-3"
              >
                <input
                  type="checkbox"
                  name={`game_${game.id}`}
                  defaultChecked={game.included_in_pickem}
                />
                <span className="flex-1">
                  <span className="font-medium">
                    {game.away_team} @ {game.home_team}
                  </span>
                  <span className="ml-2 text-sm text-neutral-600">
                    {spreadLabel} — {kickoff}
                    {game.spread_locked ? " (locked)" : ""}
                  </span>
                  <br />
                  <span className="text-sm text-neutral-600">{scoreLabel}</span>
                  {atsLabel && (
                    <span
                      className={
                        atsLabel.startsWith("final, but NOT")
                          ? "ml-2 text-sm font-semibold text-red-600"
                          : "ml-2 text-sm font-semibold text-green-700"
                      }
                    >
                      {atsLabel}
                    </span>
                  )}
                </span>
              </label>
            );
          })}
          {games.length === 0 && (
            <p className="text-sm text-neutral-600">
              No games synced for this week yet. Click &quot;Sync this week&apos;s games&quot;
              above.
            </p>
          )}
        </div>
        {games.length > 0 && (
          <button
            type="submit"
            className="rounded bg-lsuPurple px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Save selection
          </button>
        )}
      </form>
    </div>
  );
}
