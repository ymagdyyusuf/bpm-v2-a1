"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { addPublisher } from "@/lib/db/publishers";

export async function addPublisherAction(formData: FormData) {
  const label = String(formData.get("label") ?? "");

  try {
    await addPublisher(label);
  } catch (e) {
    const message = e instanceof Error ? e.message : "تعذّر إضافة الناشر";
    redirect(`/publishers?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/publishers");
}
