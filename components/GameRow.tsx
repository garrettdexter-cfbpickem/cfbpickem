import type { Game } from "@/lib/types";

function formatSpread(spread: number | null): string {
  if (spread === null || spread === undefined) return "no line";
  if (spread === 0) return "pick 'em";
  // spread is the home team's number. Negative = home favored.
  if (spread < 0) return `${spread}`;
  return `+${spread}`;
}

function StatusBadge({ status }: { status: Game["status"] }) {
  if (status === "final") {
    return (
      <span className="rounded bg-neutral-900 px-2 py-0.5 text-xs font-semibold text-white">
        Final
      </span>
    );
  }
  if (status === "in_progress") {
    return (
      <span className="rounded bg-green-600 px-2 py-0.5 text-xs font-semibold text-white">
        Live
      </span>
    );
  }
  return (
    <span className="rounded bg-neutral-200 px-2 py-0.5 text-xs font-semibold text-neutral-700">
      Scheduled
    </span>
  );
}

export default function GameRow({ game }: { game: Game }) {
  const kickoff = new Date(game.kickoff_time);
  const kickoffLabel = kickoff.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const spreadHome = game.spread;
  const spreadLabel =
    spreadHome === null || spreadHome === undefined
      ? "no line"
      : spreadHome === 0
      ? "pick 'em"
      : spreadHome < 0
      ? `${game.home_team} ${formatSpread(spreadHome)}`
      : `${game.away_team} ${formatSpread(-spreadHome)}`;

  const showScore = game.status === "in_progress" || game.status === "final";

  let coverLabel: string | null = null;
  if (game.status === "final" && game.ats_result) {
    if (game.ats_result === "push") {
      coverLabel = "Push";
    } else if (game.ats_result === "home") {
      coverLabel = `${game.home_team} covered`;
    } else {
      coverLabel = `${game.away_team} covered`;
    }
  }

  return (
    <div className="rounded-lg border bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="font-medium">
          {game.away_team} @ {game.home_team}
        </div>
        <StatusBadge status={game.status} />
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-600">
        <span>{spreadLabel}</span>
        <span>{kickoffLabel}</span>
      </div>
      {showScore && (
        <div className="mt-2 text-sm">
          <span className="font-semibold">
            {game.away_team} {game.away_score ?? "-"} @ {game.home_team} {game.home_score ?? "-"}
          </span>
          {coverLabel && <span className="ml-2 text-neutral-600">({coverLabel})</span>}
        </div>
      )}
    </div>
  );
}
