import { supabaseAdmin } from "./supabase";

export interface PointAdjustment {
    id: string;
    player_id: string;
    points: number;
    note: string;
    created_at: string;
}

/**
 * Manual one-off point adjustments (bonuses/penalties) entered by the admin.
 * Returns an empty list if the table doesn't exist yet or the query fails, so
 * the public pages never break because of this optional feature.
 */
export async function getPointAdjustments(): Promise<PointAdjustment[]> {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("point_adjustments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10000);
    if (error) return [];
    return (data ?? []) as PointAdjustment[];
}

export function computeAdjustmentPoints(adjustments: PointAdjustment[]): Map<string, number> {
    const totals = new Map<string, number>();
    for (const adj of adjustments) {
          totals.set(adj.player_id, (totals.get(adj.player_id) ?? 0) + Number(adj.points));
    }
    return totals;
}
