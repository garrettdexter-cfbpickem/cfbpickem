"use client";

import { useFormState } from "react-dom";
import { addPlayerAction, type AddPlayerState } from "@/app/admin/actions";
import SubmitButton from "./SubmitButton";

export default function AddPlayerForm() {
  const initialState: AddPlayerState = { ok: false };
  const [state, formAction] = useFormState(async (
    prevState: AddPlayerState,
    formData: FormData
  ) => addPlayerAction(formData), initialState);

  return (
    <form action={formAction} className="space-y-3">
      {state.ok && (
        <div className="rounded bg-lsuGold px-3 py-2 text-sm font-semibold text-lsuPurple">
          Added {state.name}!
        </div>
      )}
      {state.error && (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          name="name"
          placeholder="New player name"
          required
          className="flex-1 rounded border px-3 py-2 text-sm"
        />
        <SubmitButton
          pendingText="Adding…"
          className="rounded bg-lsuPurple px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          Add Player
        </SubmitButton>
      </div>
    </form>
  );
}
