import { requireAdmin } from "@/lib/adminAuth";
import { getPlayers } from "@/lib/data";
import AddPlayerForm from "@/components/AddPlayerForm";

export const dynamic = "force-dynamic";

export default async function AdminPlayersPage() {
  await requireAdmin();
  const players = await getPlayers();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Players</h1>

      <div className="rounded-lg border bg-white p-4">
        <h2 className="mb-2 font-semibold">Current Roster</h2>
        <ul className="list-inside list-disc text-sm">
          {players.map((player) => (
            <li key={player.id}>{player.name}</li>
          ))}
        </ul>
        {players.length === 0 && <p className="text-sm text-neutral-500">No players yet.</p>}
      </div>

      <div className="rounded-lg border bg-white p-4">
        <h2 className="mb-2 font-semibold">Add a Player</h2>
        <AddPlayerForm />
      </div>
    </div>
  );
}
