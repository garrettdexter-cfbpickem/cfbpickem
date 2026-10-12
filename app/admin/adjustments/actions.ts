"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabase";

function refreshPages() {
    revalidatePath("/admin/adjustments");
    revalidatePath("/standings");
    revalidatePath("/");
}

export async function addAdjustmentAction(formData: FormData): Promise<void> {
    await requireAdmin();
    const playerId = String(formData.get("player_id") ?? "");
    const points = Number(formData.get("points"));
    const note = String(formData.get("note") ?? "").trim();
    if (!playerId || !Number.isInteger(points) || points === 0) return;
    const supabase = supabaseAdmin();
    const { error } = await supabase
      .from("point_adjustments")
      .insert({ player_id: playerId, points, note });
    if (error) {
          throw new Error("Failed to add adjustment: " + error.message);
    }
    refreshPages();
}

export async function deleteAdjustmentAction(formData: FormData): Promise<void> {
    await requireAdmin();
    const id = String(formData.get("id") ?? "");
    if (!id) return;
    const supabase = supabaseAdmin();
    const { error } = await supabase.from("point_adjustments").delete().eq("id", id);
    if (error) {
          throw new Error("Failed to delete adjustment: " + error.message);
    }
    refreshPages();
}
