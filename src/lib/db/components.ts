import { createClient } from "@/lib/supabase/server";
import { parseOptionalNonNegativeInt, parseOptionalNonNegativeDecimal } from "@/lib/components";

export type Component = {
  id: string;
  name: string | null;
  page_width_cm: number | null;
  page_height_cm: number | null;
  page_count: number | null;
  sheet_count: number | null;
  color_count: number | null;
  display_order: number;
  category: { label: string; display_order: number } | null;
  kind: { label: string } | null;
};

const COMPONENT_SELECT = `
  id, name, page_width_cm, page_height_cm, page_count, sheet_count, color_count, display_order,
  category:component_categories(label, display_order),
  kind:component_kinds(label)
`;

export async function listComponentsForPob(pobId: string): Promise<Component[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("components")
    .select(COMPONENT_SELECT)
    .eq("pob_id", pobId);

  if (error) throw error;

  const rows = (data ?? []) as unknown as Component[];
  return rows.sort((a, b) => {
    const catDiff = (a.category?.display_order ?? 0) - (b.category?.display_order ?? 0);
    if (catDiff !== 0) return catDiff;
    return a.display_order - b.display_order;
  });
}

export type CreateComponentInput = {
  pob_id: string;
  category_id: string;
  kind_id: string;
  name: string;
  page_width_cm: string;
  page_height_cm: string;
  page_count: string;
  sheet_count: string;
  color_count: string;
};

export async function createComponent(input: CreateComponentInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("components").insert({
    pob_id: input.pob_id,
    category_id: input.category_id,
    kind_id: input.kind_id,
    name: input.name.trim() || null,
    page_width_cm: parseOptionalNonNegativeDecimal(input.page_width_cm),
    page_height_cm: parseOptionalNonNegativeDecimal(input.page_height_cm),
    page_count: parseOptionalNonNegativeInt(input.page_count),
    sheet_count: parseOptionalNonNegativeInt(input.sheet_count),
    color_count: parseOptionalNonNegativeInt(input.color_count),
  });

  if (error) throw error;
}

export async function updateComponentPageCount(id: string, pageCount: string): Promise<void> {
  const value = parseOptionalNonNegativeInt(pageCount);
  const supabase = await createClient();
  const { error } = await supabase.from("components").update({ page_count: value }).eq("id", id);
  if (error) throw error;
}
