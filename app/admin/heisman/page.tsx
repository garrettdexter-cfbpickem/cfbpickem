import { requireAdmin } from "@/lib/adminAuth";
import { getHeismanCandidates } from "@/lib/data";
import { addHeismanCandidateAction, saveHeismanCandidateAction } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function AdminHeismanPage() {
  await requireAdmin();
  const candidates = await getHeismanCandidates();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Admin — Heisman Pool</h1>

      <div className="rounded-lg border bg-white p-4">
        <h2 className="mb-2 font-semibold">Add a Candidate</h2>
        <form action={addHeismanCandidateAction} className="flex gap-2">
          <input
            type="text"
            name="candidate_name"
            placeholder="Candidate name"
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
        {candidates.map((candidate) => (
          <form
            key={candidate.id}
            action={saveHeismanCandidateAction}
            className="flex flex-wrap items-center gap-4 rounded-lg border bg-white p-3"
          >
            <input type="hidden" name="id" value={candidate.id} />
            <span className="min-w-[10rem] font-medium">{candidate.candidate_name}</span>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="is_finalist"
                defaultChecked={candidate.is_finalist}
              />
              Finalist (invited to NY)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="is_winner" defaultChecked={candidate.is_winner} />
              Winner
            </label>
            <button
              type="submit"
              className="rounded bg-lsuPurple px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90"
            >
              Save
            </button>
          </form>
        ))}
        {candidates.length === 0 && (
          <p className="text-sm text-neutral-600">No Heisman candidates yet.</p>
        )}
      </div>
    </div>
  );
}
