"use client";

import { useRouter } from "next/navigation";

interface WeekSelectorProps {
    currentWeek: number;
    maxWeek?: number;
}

// Simple dropdown so the admin can jump straight to any week's game-selection
// screen without having to type a week number into the URL by hand.
export default function WeekSelector({ currentWeek, maxWeek = 20 }: WeekSelectorProps) {
    const router = useRouter();
    const weeks = Array.from({ length: maxWeek }, (_, i) => i + 1);

  // Make sure the currently viewed week always appears as an option, even if
  // it's outside the default 1-20 range (e.g. a bowl/playoff week number).
  if (!weeks.includes(currentWeek)) {
        weeks.push(currentWeek);
        weeks.sort((a, b) => a - b);
  }

  return (
        <label className="flex items-center gap-2 text-sm">
              <span className="font-medium">Jump to week:</span>
              <select
                        value={currentWeek}
                        onChange={(e) => router.push(`/admin/week/${e.target.value}`)}
                        className="rounded border px-2 py-1"
                      >
                {weeks.map((w) => (
                                  <option key={w} value={w}>
                                              Week {w}
                                  </option>
                                ))}
              </select>
        </label>
      );
}
