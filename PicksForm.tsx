"use client";

import { useFormState, useFormStatus } from "react-dom";
import type { Game } from "@/lib/types";
import { submitPicks, type SubmitPicksState } from "@/app/picks/actions";

function formatSpread(homeTeam: string, awayTeam: string, spread: number | null) {
  if (spread === null || spread === undefined) return "no line";
  if (spread < 0) return `${homeTeam} -${Math.abs(spread)}`;
  if (spread > 0) return `${awayTeam} -${spread}`;
  return "pick 'em";
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-maroon text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
    >
      {pending ? "Saving..." : "Save Picks"}
    </button>
  );
}

export default function PicksForm({
  playerName,
  week,
  games,
  existingPicks,
  deadline,
  alreadySubmitted,
}: {
  playerName: string;
  week: number;
  games: Game[];
  existingPicks: Record<string, string>;
  deadline: number | null;
  alreadySubmitted: boolean;
}) {
  const boundAction = submitPicks.bind(null, playerName, week);
  const [state, formAction] = useFormState<SubmitPicksState, FormData>(boundAction, {
    ok: false,
  });

  const locked = alreadySubmitted || state.ok;

  if (locked) {
    return (
      <div className="border rounded-lg p-4 bg-white space-y-3">
        <p className="text-green-700 font-medium">
          Your picks are locked in for this week!
        </p>
        <div className="space-y-1">
          {games.map((g) => {
            const picked = existingPicks[g.id];
            return (
              <div key={g.id} className="text-sm">
                <span className="text-neutral-500">
                  {g.away_team} @ {g.home_team}:
                </span>{" "}
                <span className="font-medium">{picked ?? "—"}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const deadlinePassed = deadline !== null && Date.now() >= deadline;

  return (
    <form action={formAction} className="space-y-3">
      {state.error && (
        <p className="text-red-700 bg-red-50 border border-red-200 rounded p-3 text-sm">
          {state.error}
        </p>
      )}

      {deadlinePassed && (
        <p className="text-red-700 bg-red-50 border border-red-200 rounded p-3 text-sm">
          Picks are closed — the first game of the week has already kicked
          off.
        </p>
      )}

      {games.map((g) => {
        const existing = existingPicks[g.id];
        return (
          <div key={g.id} className="border rounded-lg p-3 bg-white">
            <div className="font-medium">
              {g.away_team} <span className="text-neutral-400">@</span>{" "}
              {g.home_team}
            </div>
            <div className="text-sm text-neutral-500 mb-2">
              {formatSpread(g.home_team, g.away_team, g.spread)}
            </div>
            <div className="flex gap-4">
              {[g.away_team, g.home_team].map((team) => (
                <label key={team} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={`pick_${g.id}`}
                    value={team}
                    defaultChecked={existing === team}
                    disabled={deadlinePassed}
                  />
                  {team}
                </label>
              ))}
            </div>
          </div>
        );
      })}

      <SubmitButton />
    </form>
  );
}
