"use client";

import { useFormStatus } from "react-dom";

interface SubmitButtonProps {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
}

/**
 * useFormStatus() only works when called from a component nested inside the
 * <form> it's reporting on, so the pending state lives here rather than in
 * the parent form component.
 */
export default function SubmitButton({ children, pendingText, className }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingText ?? "Submitting…" : children}
    </button>
  );
}
