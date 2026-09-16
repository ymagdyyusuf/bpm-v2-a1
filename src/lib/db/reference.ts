import { createClient } from "@/lib/supabase/server";

export type Option = {
  id: string;
  label: string;
};

async function listOptions(table: string): Promise<Option[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from(table)
    .select("id, label")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export const listAcademicYears = () => listOptions("academic_years");
export const listTerms = () => listOptions("terms");
export const listStages = () => listOptions("stages");
export const listTypes = () => listOptions("types");
export const listLanguages = () => listOptions("languages");
export const listSubjects = () => listOptions("subjects");
