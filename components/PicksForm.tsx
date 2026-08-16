"use client";

import { useFormState } from "react-dom";
import { submitPicks, type SubmitPicksState } from "@/app/picks/actions";
import type { Game } from "@/lib/types";
import SubmitButton from "./SubmitButton";

interface PicksFormProps {
  playerName: string;
  week: number;
  games: Game[];
  existingPicks: Record<string, string>;
  deadline: number | null;
  alreadySubmitted: boolean;
}

export default function PicksForm({
  playerName,
  week,
  games,
  existingPicks,
  deadline,
  alreadySubmitted,
}: PicksFormProps) {
  const submitPicksWithArgs = submitPicks.bind(null, playerName, week);
  const initialState: SubmitPicksState = { ok: false };
  const [state, formAction] = useFormState(submitPicksWithArgs, initialState);

  if (alreadySubmitted) {
    return (
      <div className="space-y-3">
        <div className="rounded bg-lsuGold px-3 py-2 text-sm font-semibold text-lsuPurple">
          Locked in! Your picks for Week {week} are submitted and can&apos;t be changed.
        </div>
        <div className="space-y-2">
          {games.map((game) => {
            const picked = existingPicks[game.id];
            return (
              <div key={game.id} className="rounded-lg border bg-white p-3">
                <div className="font-medium">
                  {game.away_team} @ {game.home_team}
                </div>
                <div className="mt-1 text-sm text-neutral-600">
                  Your pick: <span className="font-semibold text-neutral-900">{picked ?? "—"}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (state.ok) {
    return (
      <div className="rounded bg-lsuGold px-3 py-2 text-sm font-semibold text-lsuPurple">
        Locked in! Your picks for Week {week} have been submitted.
      </div>
    );
  }

  if (games.length === 0) {
    return <p className="text-sm text-neutral-600">No games are open for picks this week yet.</p>;
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      )}
      {deadline !== null && (
        <p className="text-xs text-neutral-500">
          Picks lock at {new Date(deadline).toLocaleString()} (first kickoff of the week).
        </p>
      )}
      <div className="space-y-3">
        {games.map((game) => {
          const current = existingPicks[game.id];
          return (
            <fieldset key={game.id} className="rounded-lg border bg-white p-3">
              <legend className="px-1 text-sm font-medium">
                {game.away_team} @ {game.home_team}
              </legend>
              <div className="mt-2 flex gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`pick_${game.id}`}
                    value={game.away_team}
                    defaultChecked={current === game.away_team}
                    required
                  />
                  {game.away_team}
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`pick_${game.id}`}
                    value={game.home_team}
                    defaultChecked={current === game.home_team}
                  />
                  {game.home_team}
                </label>
              </div>
            </fieldset>
          );
        })}
      </div>
      <SubmitButton
        pendingText="Submitting…"
        className="rounded bg-lsuPurple px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
      >
        Submit Picks
      </SubmitButton>
    </form>
  );
}
