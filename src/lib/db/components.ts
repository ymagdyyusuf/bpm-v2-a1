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
  is_active: boolean;
  category: { label: string; display_order: number } | null;
  kind: { label: string } | null;
};

const COMPONENT_SELECT = `
  id, name, page_width_cm, page_height_cm, page_count, colors, display_order,
  category_id, kind_id, is_active,
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

/** عدد الأحداث على مكوّن — يُستعمل قبل الحذف لعرض النتيجة المتوقَّعة مقدَّماً، وداخل deleteComponent نفسها. */
export async function getComponentEventCount(id: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("component_id", id);
  if (error) throw error;
  return count ?? 0;
}

export type DeleteComponentResult =
  | { action: "deleted" }
  | { action: "deactivated"; eventCount: number };

/**
 * D-47: نفس قاعدة الحزمة — يُحذف نهائياً لو فاضٍ من تبعيات، وغير كده يُعطَّل.
 * events.component_id بقى يشير للمكوّن منذ شريحة ٥ (اكتُشف الفحص الناقص
 * هنا أثناء إثبات شريحة ٥ نفسه — FK كان سيرفض الحذف بخطأ خام بدل تعطيل
 * مفهوم). لما تُبنى الأصول لاحقاً، تُضاف لنفس الفحص.
 */
export async function deleteComponent(id: string): Promise<DeleteComponentResult> {
  const eventCount = await getComponentEventCount(id);
  const supabase = await createClient();

  if (eventCount > 0) {
    const { error } = await supabase.from("components").update({ is_active: false }).eq("id", id);
    if (error) throw error;
    return { action: "deactivated", eventCount };
  }

  const { error } = await supabase.from("components").delete().eq("id", id);
  if (error) throw error;
  return { action: "deleted" };
}

/** عكس deleteComponent عند التعطيل — is_active علم عادي، لا مانع مبدئي يمنع رجوعه صح (شريحة تنظيم الحذف). */
export async function reactivateComponent(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("components").update({ is_active: true }).eq("id", id);
  if (error) throw error;
}
