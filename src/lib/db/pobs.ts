import { createClient } from "@/lib/supabase/server";
import { parsePobPrice } from "@/lib/pobs";

export type Pob = {
  id: string;
  price: number | null;
  academic_year: { label: string } | null;
  term: { label: string } | null;
  publisher: { label: string } | null;
  stage: { label: string } | null;
  type: { label: string } | null;
  language: { label: string } | null;
  subject: { label: string } | null;
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
  id, price,
  academic_year:academic_years(label),
  term:terms(label),
  publisher:publishers(label),
  stage:stages(label),
  type:types(label),
  language:languages(label),
  subject:subjects(label)
`;

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

export type CreatePobInput = {
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

export async function createPob(input: CreatePobInput): Promise<void> {
  const price = parsePobPrice(input.price);

  const supabase = await createClient();
  const { error } = await supabase.from("pobs").insert({
    academic_year_id: input.academic_year_id,
    term_id: input.term_id,
    publisher_id: input.publisher_id,
    stage_id: input.stage_id,
    type_id: input.type_id,
    language_id: input.language_id,
    subject_id: input.subject_id,
    price,
  });

  if (error) {
    if (error.code === "23505") {
      throw new Error(DUPLICATE_POB_ERROR);
    }
    throw error;
  }
}
