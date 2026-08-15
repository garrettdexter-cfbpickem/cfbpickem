"use client";

import { useFormState, useFormStatus } from "react-dom";
import { adminLogin, type AdminLoginState } from "@/app/admin/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-maroon text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
    >
      {pending ? "Checking..." : "Log in"}
    </button>
  );
}

export default function AdminLoginForm() {
  const [state, formAction] = useFormState<AdminLoginState, FormData>(adminLogin, {});

  return (
    <form action={formAction} className="space-y-3">
      {state.error && (
        <p className="text-red-700 bg-red-50 border border-red-200 rounded p-3 text-sm">
          {state.error}
        </p>
      )}
      <input
        type="password"
        name="password"
        placeholder="Admin password"
        required
        className="border rounded-lg px-3 py-2 w-full"
      />
      <SubmitButton />
    </form>
  );
}
