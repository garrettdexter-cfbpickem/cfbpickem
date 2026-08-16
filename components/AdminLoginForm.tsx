"use client";

import { useFormState } from "react-dom";
import { adminLogin, type AdminLoginState } from "@/app/admin/actions";
import SubmitButton from "./SubmitButton";

export default function AdminLoginForm() {
  const initialState: AdminLoginState = { ok: false };
  const [state, formAction] = useFormState(adminLogin, initialState);

  return (
    <form action={formAction} className="mx-auto max-w-sm space-y-4 rounded-lg border bg-white p-6">
      <h1 className="text-lg font-bold">Admin Login</h1>
      {state.error && (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium">Password</label>
        <input
          type="password"
          name="password"
          required
          className="mt-1 w-full rounded border px-3 py-2 text-sm"
        />
      </div>
      <SubmitButton
        pendingText="Logging in…"
        className="w-full rounded bg-lsuPurple px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
      >
        Log In
      </SubmitButton>
    </form>
  );
}
