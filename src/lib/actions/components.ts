"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createComponent,
  updateComponent,
  deleteComponent,
  reactivateComponent,
  type ComponentFormInput,
} from "@/lib/db/components";
import { toArabicDigits } from "@/lib/numerals";

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
    redirect(`/pobs/${pobId}/components/${componentId}/edit?error=${encodeURIComponent(message)}`);
  }

  revalidatePath(`/pobs/${pobId}`);
  redirect(`/pobs/${pobId}?notice=${encodeURIComponent("تم حفظ التعديل")}`);
}

export async function deleteComponentAction(formData: FormData) {
  const pobId = String(formData.get("pob_id") ?? "");
  const componentId = String(formData.get("component_id") ?? "");

  let result;
  try {
    result = await deleteComponent(componentId);
  } catch (e) {
    const message = e instanceof Error ? e.message : "تعذّر حذف المكوّن";
    redirect(`/pobs/${pobId}/components/${componentId}/edit?error=${encodeURIComponent(message)}`);
  }

  revalidatePath(`/pobs/${pobId}`);
  const notice =
    result.action === "deactivated"
      ? `على المكوّن ${toArabicDigits(result.eventCount)} حدث، فتم تعطيله بدل حذفه`
      : "تم حذف المكوّن نهائياً";
  redirect(`/pobs/${pobId}?notice=${encodeURIComponent(notice)}`);
}

export async function reactivateComponentAction(formData: FormData) {
  const pobId = String(formData.get("pob_id") ?? "");
  const componentId = String(formData.get("component_id") ?? "");

  try {
    await reactivateComponent(componentId);
  } catch (e) {
    const message = e instanceof Error ? e.message : "تعذّرت إعادة التفعيل";
    redirect(`/pobs/${pobId}/components/${componentId}/edit?error=${encodeURIComponent(message)}`);
  }

  revalidatePath(`/pobs/${pobId}`);
  redirect(`/pobs/${pobId}?notice=${encodeURIComponent("تم تفعيل المكوّن")}`);
}
