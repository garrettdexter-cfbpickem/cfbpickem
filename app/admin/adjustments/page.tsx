import { requireAdmin } from "@/lib/adminAuth";
import { getPlayers } from "@/lib/data";
import { getPointAdjustments } from "@/lib/adjustments";
import { addAdjustmentAction, deletedAdjustmentAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminAdjustmentsPage() {
    await requireAdmin();
    const [players, adjustments] = await Promise.all([getPlayers(), getPointAdjustments()]);
    const nameById = new Map<string, string>();
    for (const player of players) {
          nameById.set(player.id, player.name);
    }
    return (
          <div className="space-y-6">
                <h1 className="text-xl font-bold">Manual Point Adjustments</h1>h1>
                <p className="text-sm text-neutral-600">
                        Add or subtract points for a player as a one-off (a bonus, a penalty, a ruling). Use a
                        negative number to subtract. Adjustments show up in the standings in their own column and
                        are included in each player&apos;s total.
                </p>p>
                <form action={addAdjustmentAction} className="space-y-3 rounded-lg border bg-white p-4">
                        <h2 className="font-semibold">Add an adjustment</h2>h2>
                        <div className="flex flex-wrap items-end gap-3">
                                  <label className="text-sm">
                                              <span className="mb-1 block font-medium">Player</span>span>
                                              <select name="player_id" required className="rounded border px-2 py-1">
                                                {players.map((player) => (
                            <option key={player.id} value={player.id}>
                              {player.name}
                            </option>option>
                          ))}
                                              </select>select>
                                  </label>label>
                                  <label className="text-sm">
                                              <span className="mb-1 block font-medium">Points (+/-)</span>span>
                                              <input
                                                              type="number"
                                                              name="points"
                                                              step="1"
                                                              required
                                                              placeholder="e.g. 1 or -2"
                                                              className="w-28 rounded border px-2 py-1"
                                                            />
                                  </label>label>
                                  <label className="flex-1 text-sm">
                                              <span className="mb-1 block font-medium">Note (optional)</span>span>
                                              <input
                                                              type="text"
                                                              name="note"
                                                              placeholder="Reason for the adjustment"
                                                              className="w-full rounded border px-2 py-1"
                                                            />
                                  </label>label>
                                  <button
                                                type="submit"
                                                className="rounded bg-lsuPurple px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                                              >
                                              Add adjustment
                                  </button>button>
                        </div>div>
                </form>form>
                <div className="rounded-lg border bg-white p-4">
                        <h2 className="mb-2 font-semibold">Existing adjustments</h2>h2>
                  {adjustments.length === 0 && (
                      <p className="text-sm text-neutral-500">No adjustments yet.</p>p>
                        )}
                        <ul className="space-y-2">
                          {adjustments.map((adj) => (
                        <li
                                        key={adj.id}
                                        className="flex flex-wrap items-center justify-between gap-2 border-b pb-2 text-sm last:border-b-0"
                                      >
                                      <span>
                                                      <span className="font-medium">{nameById.get(adj.player_id) ?? "Unknown player"}</span>span>{" "}
                                                      <span className={adj.points > 0 ? "font-semibold text-green-700" : "font-semibold text-red-600"}>
                                                        {adj.points > 0 ? "+" + adj.points : String(adj.points)}
                                                      </span>span>
                                        {adj.note ? <span className="text-neutral-600"> &mdash; {adj.note}</span>span> : null}
                                                      <span className="ml-2 text-xs text-neutral-400">
                                                        {new Date(adj.created_at).toLocaleDateString()}
                                                      </span>span>
                                      </span>span>
                                      <form action={deleteAdjustmentAction}>
                                                      <input type="hidden" name="id" value={adj.id} />
                                                      <button type="submit" className="text-xs text-red-600 underline">
                                                                        Remove
                                                      </button>button>
                                      </form>form>
                        </li>li>
                      ))}
                        </ul>ul>
                </div>div>
          </div>div>
        );
}</div>
