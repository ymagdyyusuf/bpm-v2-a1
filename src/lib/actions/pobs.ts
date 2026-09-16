"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createPob, updatePob, deletePob, type PobFormInput } from "@/lib/db/pobs";

function readPobForm(formData: FormData): PobFormInput {
  return {
    academic_year_id: String(formData.get("academic_year_id") ?? ""),
    term_id: String(formData.get("term_id") ?? ""),
    publisher_id: String(formData.get("publisher_id") ?? ""),
    stage_id: String(formData.get("stage_id") ?? ""),
    type_id: String(formData.get("type_id") ?? ""),
    language_id: String(formData.get("language_id") ?? ""),
    subject_id: String(formData.get("subject_id") ?? ""),
    price: String(formData.get("price") ?? ""),
  };
}

export async function createPobAction(formData: FormData) {
  try {
    await createPob(readPobForm(formData));
  } catch (e) {
    const message = e instanceof Error ? e.message : "تعذّر إنشاء الحزمة";
    redirect(`/?error=${encodeURIComponent(message)}`);
  }

  redirect("/");
}

export async function updatePobAction(formData: FormData) {
  const pobId = String(formData.get("pob_id") ?? "");

  try {
    await updatePob(pobId, readPobForm(formData));
  } catch (e) {
    const message = e instanceof Error ? e.message : "تعذّر حفظ التعديل";
    redirect(`/pobs/${pobId}?error=${encodeURIComponent(message)}`);
  }

  revalidatePath(`/pobs/${pobId}`);
}

export async function deletePobAction(formData: FormData) {
  const pobId = String(formData.get("pob_id") ?? "");

  try {
    await deletePob(pobId);
  } catch (e) {
    const message = e instanceof Error ? e.message : "تعذّر حذف الحزمة";
    redirect(`/pobs/${pobId}?error=${encodeURIComponent(message)}`);
  }

  redirect("/");
}
