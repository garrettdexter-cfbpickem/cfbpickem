"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  submitPreseasonPicks,
  type PreseasonActionState,
} from "@/app/picks/preseason/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-maroon text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
    >
      {pending ? "Submitting..." : "Submit preseason picks"}
    </button>
  );
}

export default function PreseasonPicksForm({
  playerName,
  alreadySubmitted,
  existingPlayoffPicks,
  existingHeismanPicks,
}: {
  playerName: string;
  alreadySubmitted: boolean;
  existingPlayoffPicks: string[];
  existingHeismanPicks: string[];
}) {
  const boundAction = submitPreseasonPicks.bind(null, playerName);
  const [state, formAction] = useFormState<PreseasonActionState, FormData>(
    boundAction,
    { ok: false }
  );

  const locked = alreadySubmitted || state.ok;

  if (locked) {
    return (
      <div className="border rounded-lg p-4 bg-white space-y-4">
        <p className="text-green-700 font-medium">
          Your preseason Playoff &amp; Heisman picks are locked in!
        </p>
        {existingPlayoffPicks.length > 0 && (
          <div>
            <div className="font-medium text-sm mb-1">
              Playoff Pool (12 teams)
            </div>
            <ul className="text-sm text-neutral-700 list-disc list-inside">
              {existingPlayoffPicks.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        )}
        {existingHeismanPicks.length > 0 && (
          <div>
            <div className="font-medium text-sm mb-1">
              Heisman Pool (5 candidates)
            </div>
            <ul className="text-sm text-neutral-700 list-disc list-inside">
              {existingHeismanPicks.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <p className="text-red-700 bg-red-50 border border-red-200 rounded p-3 text-sm">
          {state.error}
        </p>
      )}

      <div className="border rounded-lg p-3 bg-white space-y-2">
        <div className="font-medium">
          Playoff Pool — pick 12 teams you think make the 12-team CFP field
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <input
              key={i}
              name={`playoff_team_${i}`}
              placeholder={`Team ${i + 1}`}
              className="border rounded-lg px-3 py-2"
            />
          ))}
        </div>
      </div>

      <div className="border rounded-lg p-3 bg-white space-y-2">
        <div className="font-medium">Heisman Pool — pick 5 candidates</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <input
              key={i}
              name={`heisman_${i}`}
              placeholder={`Candidate ${i + 1}`}
              className="border rounded-lg px-3 py-2"
            />
          ))}
        </div>
      </div>

      <SubmitButton />
    </form>
  );
}
