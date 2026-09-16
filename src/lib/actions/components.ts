"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createComponent, updateComponent, deleteComponent, type ComponentFormInput } from "@/lib/db/components";

function readComponentForm(formData: FormData): ComponentFormInput {
  return {
    category_id: String(formData.get("category_id") ?? ""),
    kind_id: String(formData.get("kind_id") ?? ""),
    name: String(formData.get("name") ?? ""),
    page_width_cm: String(formData.get("page_width_cm") ?? ""),
    page_height_cm: String(formData.get("page_height_cm") ?? ""),
    page_count: String(formData.get("page_count") ?? ""),
    colors: String(formData.get("colors") ?? ""),
  };
}

export async function createComponentAction(formData: FormData) {
  const pobId = String(formData.get("pob_id") ?? "");

  try {
    await createComponent(pobId, readComponentForm(formData));
  } catch (e) {
    const message = e instanceof Error ? e.message : "تعذّر إضافة المكوّن";
    redirect(`/pobs/${pobId}?error=${encodeURIComponent(message)}`);
  }

  revalidatePath(`/pobs/${pobId}`);
}

export async function updateComponentAction(formData: FormData) {
  const pobId = String(formData.get("pob_id") ?? "");
  const componentId = String(formData.get("component_id") ?? "");

  try {
    await updateComponent(componentId, readComponentForm(formData));
  } catch (e) {
    const message = e instanceof Error ? e.message : "تعذّر حفظ التعديل";
    redirect(`/pobs/${pobId}?error=${encodeURIComponent(message)}`);
  }

  revalidatePath(`/pobs/${pobId}`);
}

export async function deleteComponentAction(formData: FormData) {
  const pobId = String(formData.get("pob_id") ?? "");
  const componentId = String(formData.get("component_id") ?? "");

  try {
    await deleteComponent(componentId);
  } catch (e) {
    const message = e instanceof Error ? e.message : "تعذّر حذف المكوّن";
    redirect(`/pobs/${pobId}?error=${encodeURIComponent(message)}`);
  }

  revalidatePath(`/pobs/${pobId}`);
}
