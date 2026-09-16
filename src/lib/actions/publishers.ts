"use server";

import { revalidatePath } from "next/cache";
import { addPublisher } from "@/lib/db/publishers";

export async function addPublisherAction(formData: FormData) {
  const label = String(formData.get("label") ?? "");
  await addPublisher(label);
  revalidatePath("/");
}
