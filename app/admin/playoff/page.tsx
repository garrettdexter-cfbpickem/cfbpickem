import { requireAdmin } from "@/lib/adminAuth";
import { getPlayoffTeams } from "@/lib/data";
import { addPlayoffTeam, savePlayoffTeams } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function AdminPlayoffPage() {
  await requireAdmin();
  const teams = await getPlayoffTeams();

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-xl font-bold">Admin — Playoff Pool</h1>

      <form action={addPlayoffTeam} className="flex gap-2">
        <input
          name="team_name"
          placeholder="Team name"
          required
          className="border rounded-lg px-3 py-2 flex-1"
        />
        <button className="bg-maroon text-white px-4 py-2 rounded-lg font-medium">
          Add
        </button>
      </form>

      {teams.length === 0 ? (
        <p className="text-neutral-500 text-sm">
          No teams yet — they&apos;ll also appear automatically once players
          submit their preseason picks.
        </p>
      ) : (
        <form action={savePlayoffTeams} className="space-y-2">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center text-xs font-medium text-neutral-500 px-1">
            <div>Team</div>
            <div>Made field</div>
            <div>1st-rd bye</div>
            <div>Rounds won</div>
          </div>
          {teams.map((t) => (
            <div
              key={t.id}
              className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center border rounded-lg p-3 bg-white"
            >
              <div className="font-medium">{t.team_name}</div>
              <input
                type="checkbox"
                name={`made_field_${t.id}`}
                defaultChecked={t.made_field}
              />
              <input
                type="checkbox"
                name={`had_bye_${t.id}`}
                defaultChecked={t.had_bye}
              />
              <input
                type="number"
                min={0}
                name={`rounds_won_${t.id}`}
                defaultValue={t.rounds_won}
                className="border rounded px-2 py-1 w-16"
              />
            </div>
          ))}
          <button className="bg-maroon text-white px-4 py-2 rounded-lg font-medium">
            Save
          </button>
        </form>
      )}
    </div>
  );
}
