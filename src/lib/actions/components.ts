"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createComponent, updateComponentPageCount } from "@/lib/db/components";

export async function createComponentAction(formData: FormData) {
  const pobId = String(formData.get("pob_id") ?? "");

  try {
    await createComponent({
      pob_id: pobId,
      category_id: String(formData.get("category_id") ?? ""),
      kind_id: String(formData.get("kind_id") ?? ""),
      name: String(formData.get("name") ?? ""),
      page_width_cm: String(formData.get("page_width_cm") ?? ""),
      page_height_cm: String(formData.get("page_height_cm") ?? ""),
      page_count: String(formData.get("page_count") ?? ""),
      sheet_count: String(formData.get("sheet_count") ?? ""),
      color_count: String(formData.get("color_count") ?? ""),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "تعذّر إضافة المكوّن";
    redirect(`/pobs/${pobId}?error=${encodeURIComponent(message)}`);
  }

  revalidatePath(`/pobs/${pobId}`);
}

export async function updateComponentPageCountAction(formData: FormData) {
  const pobId = String(formData.get("pob_id") ?? "");
  const componentId = String(formData.get("component_id") ?? "");
  const pageCount = String(formData.get("page_count") ?? "");

  try {
    await updateComponentPageCount(componentId, pageCount);
  } catch (e) {
    const message = e instanceof Error ? e.message : "تعذّر حفظ عدد الصفحات";
    redirect(`/pobs/${pobId}?error=${encodeURIComponent(message)}`);
  }

  revalidatePath(`/pobs/${pobId}`);
}
