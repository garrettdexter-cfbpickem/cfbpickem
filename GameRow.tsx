import type { Game } from "@/lib/types";

function formatSpread(game: Game): string {
  if (game.spread === null || game.spread === undefined) return "no line";
  if (game.spread < 0) return `${game.home_team} -${Math.abs(game.spread)}`;
  if (game.spread > 0) return `${game.away_team} -${game.spread}`;
  return "pick 'em";
}

function statusBadge(game: Game) {
  const styles: Record<Game["status"], string> = {
    scheduled: "bg-neutral-200 text-neutral-700",
    in_progress: "bg-green-100 text-green-800",
    final: "bg-neutral-800 text-white",
  };
  const label: Record<Game["status"], string> = {
    scheduled: "Scheduled",
    in_progress: "Live",
    final: "Final",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded ${styles[game.status]}`}>
      {label[game.status]}
    </span>
  );
}

export default function GameRow({
  game,
  pickedTeam,
}: {
  game: Game;
  pickedTeam?: string;
}) {
  const kickoff = new Date(game.kickoff_time);
  return (
    <div className="border rounded-lg p-3 bg-white flex items-center justify-between gap-3">
      <div>
        <div className="font-medium">
          {game.away_team}{" "}
          <span className="text-neutral-400">@</span> {game.home_team}
        </div>
        <div className="text-sm text-neutral-500">
          {formatSpread(game)} &middot;{" "}
          {kickoff.toLocaleString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </div>
        {pickedTeam && (
          <div className="text-sm text-maroon font-medium mt-1">
            Pick: {pickedTeam}
          </div>
        )}
      </div>
      <div className="text-right">
        {statusBadge(game)}
        {(game.status === "in_progress" || game.status === "final") && (
          <div className="mt-1 font-mono text-sm">
            {game.away_team.slice(0, 4).toUpperCase()} {game.away_score ?? 0} -{" "}
            {game.home_score ?? 0} {game.home_team.slice(0, 4).toUpperCase()}
          </div>
        )}
        {game.status === "final" && game.ats_result && (
          <div className="text-xs text-neutral-500 mt-1">
            {game.ats_result === "push"
              ? "Push"
              : `${
                  game.ats_result === "home" ? game.home_team : game.away_team
                } covered`}
          </div>
        )}
      </div>
    </div>
  );
}
