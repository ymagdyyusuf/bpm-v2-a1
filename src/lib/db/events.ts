import { createClient } from "@/lib/supabase/server";
import { resolveEventInput, computeStatus, type EventFormInput, type EventForStatus, type ComponentStatus } from "@/lib/events";

const EVENT_SELECT = `
  id, pob_id, component_id, action_id, proof_number, date_expected, date_actual,
  is_blocked, block_reason, note, created_at,
  action:actions(label)
`;

type EventRow = {
  id: string;
  pob_id: string;
  component_id: string | null;
  action: { label: string } | null;
  date_expected: string | null;
  date_actual: string | null;
  created_at: string;
  is_blocked: boolean;
  block_reason: string | null;
};

export async function listEventsForPob(pobId: string): Promise<EventRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("events").select(EVENT_SELECT).eq("pob_id", pobId);
  if (error) throw error;
  return (data ?? []) as unknown as EventRow[];
}

function toStatusInput(rows: EventRow[]): EventForStatus[] {
  return rows.map((r) => ({
    action_label: r.action?.label ?? "",
    date_expected: r.date_expected,
    date_actual: r.date_actual,
    created_at: r.created_at,
    is_blocked: r.is_blocked,
    block_reason: r.block_reason,
  }));
}

/** خريطة component_id → موقفه الحالي (D-25)، لكل مكوّنات حزمة واحدة بجلبة واحدة. */
export async function getComponentStatuses(pobId: string): Promise<Record<string, ComponentStatus>> {
  const events = await listEventsForPob(pobId);
  const byComponent = new Map<string, EventRow[]>();

  for (const e of events) {
    if (!e.component_id) continue;
    const list = byComponent.get(e.component_id) ?? [];
    list.push(e);
    byComponent.set(e.component_id, list);
  }

  const result: Record<string, ComponentStatus> = {};
  for (const [componentId, rows] of byComponent) {
    result[componentId] = computeStatus(toStatusInput(rows));
  }
  return result;
}

export type CreateEventInput = {
  pob_id: string;
  component_id: string | null;
  action_id: string;
  proofNumber: string;
  dateExpected: string;
  dateActual: string;
  isBlocked: boolean;
  blockReason: string;
  note: string;
};

export async function createEvent(input: CreateEventInput): Promise<void> {
  const supabase = await createClient();

  const { data: action, error: actionError } = await supabase
    .from("actions")
    .select("requires_number")
    .eq("id", input.action_id)
    .single();
  if (actionError) throw actionError;

  const resolved = resolveEventInput({
    actionRequiresNumber: action.requires_number,
    proofNumber: input.proofNumber,
    dateExpected: input.dateExpected,
    dateActual: input.dateActual,
    isBlocked: input.isBlocked,
    blockReason: input.blockReason,
  });

  const { error } = await supabase.from("events").insert({
    pob_id: input.pob_id,
    component_id: input.component_id,
    action_id: input.action_id,
    proof_number: resolved.proofNumber,
    date_expected: resolved.dateExpected,
    date_actual: resolved.dateActual,
    is_blocked: input.isBlocked,
    block_reason: resolved.blockReason,
    note: input.note.trim() || null,
  });

  if (error) throw error;
}
