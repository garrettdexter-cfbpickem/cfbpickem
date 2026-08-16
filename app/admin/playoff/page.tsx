import { requireAdmin } from "@/lib/adminAuth";
import { getPlayoffTeams } from "@/lib/data";
import { addPlayoffTeamAction, savePlayoffTeamAction } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function AdminPlayoffPage() {
  await requireAdmin();
  const teams = await getPlayoffTeams();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Admin — Playoff Pool</h1>

      <div className="rounded-lg border bg-white p-4">
        <h2 className="mb-2 font-semibold">Add a Team</h2>
        <form action={addPlayoffTeamAction} className="flex gap-2">
          <input
            type="text"
            name="team_name"
            placeholder="Team name"
            required
            className="flex-1 rounded border px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded bg-lsuPurple px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Add
          </button>
        </form>
      </div>

      <div className="space-y-2">
        {teams.map((team) => (
          <form
            key={team.id}
            action={savePlayoffTeamAction}
            className="flex flex-wrap items-center gap-4 rounded-lg border bg-white p-3"
          >
            <input type="hidden" name="id" value={team.id} />
            <span className="min-w-[10rem] font-medium">{team.team_name}</span>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="made_field"
                defaultChecked={team.made_field}
              />
              Made field
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="had_bye" defaultChecked={team.had_bye} />
              First-round bye
            </label>
            <label className="flex items-center gap-2 text-sm">
              Rounds won
              <input
                type="number"
                name="rounds_won"
                min={0}
                max={4}
                defaultValue={team.rounds_won}
                className="w-16 rounded border px-2 py-1"
              />
            </label>
            <button
              type="submit"
              className="rounded bg-lsuPurple px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90"
            >
              Save
            </button>
          </form>
        ))}
        {teams.length === 0 && (
          <p className="text-sm text-neutral-600">No playoff teams yet.</p>
        )}
      </div>
    </div>
  );
}
