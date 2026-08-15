import { requireAdmin } from "@/lib/adminAuth";
import { getHeismanCandidates } from "@/lib/data";
import { addHeismanCandidate, saveHeismanCandidates } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function AdminHeismanPage() {
  await requireAdmin();
  const candidates = await getHeismanCandidates();

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-xl font-bold">Admin — Heisman Pool</h1>

      <form action={addHeismanCandidate} className="flex gap-2">
        <input
          name="candidate_name"
          placeholder="Candidate name"
          required
          className="border rounded-lg px-3 py-2 flex-1"
        />
        <button className="bg-maroon text-white px-4 py-2 rounded-lg font-medium">
          Add
        </button>
      </form>

      {candidates.length === 0 ? (
        <p className="text-neutral-500 text-sm">
          No candidates yet — they&apos;ll also appear automatically once
          players submit their preseason picks.
        </p>
      ) : (
        <form action={saveHeismanCandidates} className="space-y-2">
          <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-center text-xs font-medium text-neutral-500 px-1">
            <div>Candidate</div>
            <div>Finalist</div>
            <div>Winner</div>
          </div>
          {candidates.map((c) => (
            <div
              key={c.id}
              className="grid grid-cols-[1fr_auto_auto] gap-3 items-center border rounded-lg p-3 bg-white"
            >
              <div className="font-medium">{c.candidate_name}</div>
              <input
                type="checkbox"
                name={`is_finalist_${c.id}`}
                defaultChecked={c.is_finalist}
              />
              <input
                type="checkbox"
                name={`is_winner_${c.id}`}
                defaultChecked={c.is_winner}
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
