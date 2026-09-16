import { createClient } from "@/lib/supabase/server";
import { parseOptionalNonNegativeInt, parseOptionalNonNegativeDecimal } from "@/lib/components";

export type Component = {
  id: string;
  name: string | null;
  page_width_cm: number | null;
  page_height_cm: number | null;
  page_count: number | null;
  colors: string | null;
  display_order: number;
  category_id: string;
  kind_id: string;
  category: { label: string; display_order: number } | null;
  kind: { label: string } | null;
};

const COMPONENT_SELECT = `
  id, name, page_width_cm, page_height_cm, page_count, colors, display_order,
  category_id, kind_id,
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

export type ComponentFormInput = {
  category_id: string;
  kind_id: string;
  name: string;
  page_width_cm: string;
  page_height_cm: string;
  page_count: string;
  colors: string;
};

function toComponentRow(input: ComponentFormInput) {
  return {
    category_id: input.category_id,
    kind_id: input.kind_id,
    name: input.name.trim() || null,
    page_width_cm: parseOptionalNonNegativeDecimal(input.page_width_cm, "العرض"),
    page_height_cm: parseOptionalNonNegativeDecimal(input.page_height_cm, "الطول"),
    page_count: parseOptionalNonNegativeInt(input.page_count, "الصفحات"),
    colors: input.colors.trim() || null,
  };
}

export async function createComponent(pobId: string, input: ComponentFormInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("components").insert({ pob_id: pobId, ...toComponentRow(input) });
  if (error) throw error;
}

export async function updateComponent(id: string, input: ComponentFormInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("components").update(toComponentRow(input)).eq("id", id);
  if (error) throw error;
}

export type DeleteComponentResult =
  | { action: "deleted" }
  | { action: "deactivated" };

/**
 * D-47: نفس قاعدة الحزمة — يُحذف نهائياً لو فاضٍ من تبعيات، وغير كده يُعطَّل.
 * لا جدول (أصول/أحداث) بيشير للمكوّن حالياً، فالحذف دايماً نهائي اليوم؛
 * لما تُبنى الأصول لاحقاً هذا الفحص لازم يتوسّع بنفس منطق deletePob.
 */
export async function deleteComponent(id: string): Promise<DeleteComponentResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("components").delete().eq("id", id);
  if (error) throw error;
  return { action: "deleted" };
}
