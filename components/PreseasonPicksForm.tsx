"use client";

import { useFormState } from "react-dom";
import {
  submitPreseasonPicks,
  type SubmitPreseasonPicksState,
} from "@/app/picks/preseason/actions";
import type { PlayoffPick, HeismanPick } from "@/lib/types";
import SubmitButton from "./SubmitButton";

interface PreseasonPicksFormProps {
  playerName: string;
  alreadySubmitted: boolean;
  existingPlayoffPicks: PlayoffPick[];
  existingHeismanPicks: HeismanPick[];
}

export default function PreseasonPicksForm({
  playerName,
  alreadySubmitted,
  existingPlayoffPicks,
  existingHeismanPicks,
}: PreseasonPicksFormProps) {
  const submitWithArgs = submitPreseasonPicks.bind(null, playerName);
  const initialState: SubmitPreseasonPicksState = { ok: false };
  const [state, formAction] = useFormState(submitWithArgs, initialState);

  if (alreadySubmitted || state.ok) {
    return (
      <div className="space-y-4">
        <div className="rounded bg-lsuGold px-3 py-2 text-sm font-semibold text-lsuPurple">
          Locked in! Your preseason picks are submitted and can&apos;t be changed.
        </div>
        <div>
          <h3 className="font-semibold">Your Playoff Pool picks (12 teams)</h3>
          <ul className="mt-1 list-inside list-disc text-sm text-neutral-700">
            {existingPlayoffPicks.map((pick) => (
              <li key={pick.id}>{pick.team_name}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-semibold">Your Heisman Pool picks (5 candidates)</h3>
          <ul className="mt-1 list-inside list-disc text-sm text-neutral-700">
            {existingHeismanPicks.map((pick) => (
              <li key={pick.id}>{pick.candidate_name}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium">
          Playoff Pool — list the 12 teams you think will make the College Football Playoff
          (one per line)
        </label>
        <textarea
          name="playoff_teams"
          rows={12}
          placeholder={"Team 1\nTeam 2\n..."}
          className="mt-1 w-full rounded border px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">
          Heisman Pool — list your 5 Heisman candidates (one per line)
        </label>
        <textarea
          name="heisman_candidates"
          rows={5}
          placeholder={"Candidate 1\nCandidate 2\n..."}
          className="mt-1 w-full rounded border px-3 py-2 text-sm"
        />
      </div>

      <SubmitButton
        pendingText="Submitting…"
        className="rounded bg-lsuPurple px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
      >
        Submit Preseason Picks
      </SubmitButton>
      <p className="text-xs text-neutral-500">
        These picks are one-time only — once submitted they can&apos;t be edited.
      </p>
    </form>
  );
}
