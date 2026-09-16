import { createClient } from "@/lib/supabase/server";
import { parsePobPrice } from "@/lib/pobs";

export type Pob = {
  id: string;
  price: number | null;
  is_active: boolean;
  academic_year_id: string;
  term_id: string;
  publisher_id: string;
  stage_id: string;
  type_id: string;
  language_id: string;
  subject_id: string;
  academic_year: { label: string } | null;
  term: { label: string } | null;
  publisher: { label: string } | null;
  stage: { label: string; display_order: number } | null;
  type: { label: string } | null;
  language: { label: string } | null;
  subject: { label: string; display_order: number } | null;
};

export type PobFilters = {
  academic_year_id?: string;
  term_id?: string;
  publisher_id?: string;
  stage_id?: string;
  type_id?: string;
  language_id?: string;
  subject_id?: string;
};

const POB_SELECT = `
  id, price, is_active,
  academic_year_id, term_id, publisher_id, stage_id, type_id, language_id, subject_id,
  academic_year:academic_years(label),
  term:terms(label),
  publisher:publishers(label),
  stage:stages(label, display_order),
  type:types(label),
  language:languages(label),
  subject:subjects(label, display_order)
`;

export async function getPob(id: string): Promise<Pob | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("pobs").select(POB_SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return data as unknown as Pob | null;
}

export async function listPobs(filters: PobFilters): Promise<Pob[]> {
  const supabase = await createClient();
  let query = supabase.from("pobs").select(POB_SELECT).order("created_at", { ascending: false });

  for (const [key, value] of Object.entries(filters)) {
    if (value) query = query.eq(key, value);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as Pob[];
}

export type PobFormInput = {
  academic_year_id: string;
  term_id: string;
  publisher_id: string;
  stage_id: string;
  type_id: string;
  language_id: string;
  subject_id: string;
  price: string;
};

export const DUPLICATE_POB_ERROR = "حزمة بنفس السنة والترم والناشر والمرحلة والنوع واللغة والمادة موجودة بالفعل";

function toPobRow(input: PobFormInput) {
  return {
    academic_year_id: input.academic_year_id,
    term_id: input.term_id,
    publisher_id: input.publisher_id,
    stage_id: input.stage_id,
    type_id: input.type_id,
    language_id: input.language_id,
    subject_id: input.subject_id,
    price: parsePobPrice(input.price),
  };
}

export async function createPob(input: PobFormInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("pobs").insert(toPobRow(input));

  if (error) {
    if (error.code === "23505") throw new Error(DUPLICATE_POB_ERROR);
    throw error;
  }
}

export async function updatePob(id: string, input: PobFormInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("pobs").update(toPobRow(input)).eq("id", id);

  if (error) {
    if (error.code === "23505") throw new Error(DUPLICATE_POB_ERROR);
    throw error;
  }
}

export type DeletePobResult =
  | { action: "deleted" }
  | { action: "deactivated"; componentCount: number };

/**
 * D-47: حزمة بلا مكوّنات وبلا أحداث تُحذف نهائياً؛ غير كده تُعطَّل بدل الحذف.
 * الأحداث لسه مش موجودة كجدول (شريحة قادمة) — الفحص هنا على المكوّنات فقط
 * حالياً؛ لما تُبنى الأحداث، هذا الفحص لازم يتوسّع ليشملها (D-48).
 */
export async function deletePob(id: string): Promise<DeletePobResult> {
  const supabase = await createClient();

  const { count, error: countError } = await supabase
    .from("components")
    .select("id", { count: "exact", head: true })
    .eq("pob_id", id);
  if (countError) throw countError;

  if (count && count > 0) {
    const { error } = await supabase.from("pobs").update({ is_active: false }).eq("id", id);
    if (error) throw new Error(error.message);
    return { action: "deactivated", componentCount: count };
  }

  const { error } = await supabase.from("pobs").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { action: "deleted" };
}
