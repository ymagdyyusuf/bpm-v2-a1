import { createClient } from "@/lib/supabase/server";
import { normalizePublisherLabel } from "@/lib/publishers";

export type Publisher = {
  id: string;
  label: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
};

export async function listPublishers(): Promise<Publisher[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("publishers")
    .select("*")
    .order("display_order", { ascending: true })
    .order("label", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function addPublisher(label: string): Promise<void> {
  const trimmed = normalizePublisherLabel(label);

  const supabase = await createClient();
  const { error } = await supabase.from("publishers").insert({ label: trimmed });
  if (error) throw error;
}
