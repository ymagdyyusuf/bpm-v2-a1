"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createEvent } from "@/lib/db/events";

export async function createEventAction(formData: FormData) {
  const pobId = String(formData.get("pob_id") ?? "");
  const componentId = String(formData.get("component_id") ?? "") || null;
  const returnTo = componentId ? `/pobs/${pobId}/components/${componentId}/events/new` : `/pobs/${pobId}`;

  try {
    await createEvent({
      pob_id: pobId,
      component_id: componentId,
      action_id: String(formData.get("action_id") ?? ""),
      proofNumber: String(formData.get("proof_number") ?? ""),
      dateExpected: String(formData.get("date_expected") ?? ""),
      dateActual: String(formData.get("date_actual") ?? ""),
      isBlocked: formData.get("is_blocked") === "on",
      blockReason: String(formData.get("block_reason") ?? ""),
      note: String(formData.get("note") ?? ""),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "تعذّر تسجيل الحدث";
    redirect(`${returnTo}?error=${encodeURIComponent(message)}`);
  }

  revalidatePath(`/pobs/${pobId}`);
  redirect(`/pobs/${pobId}?notice=${encodeURIComponent("تم تسجيل الحدث")}`);
}
