import { createClient } from "@/lib/supabase/server";
import {
  resolveEventInput,
  computeStatus,
  computeComponentStatus,
  type EventFormInput,
  type EventForStatus,
  type ComponentStatus,
} from "@/lib/events";

const EVENT_SELECT = `
  id, pob_id, component_id, action_id, proof_number, date_expected, date_actual,
  is_blocked, block_reason, note, created_at,
  action:actions(label, is_terminal)
`;

type EventRow = {
  id: string;
  pob_id: string;
  component_id: string | null;
  action: { label: string; is_terminal: boolean } | null;
  proof_number: number | null;
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
    action_is_terminal: r.action?.is_terminal ?? false,
    date_expected: r.date_expected,
    date_actual: r.date_actual,
    created_at: r.created_at,
    is_blocked: r.is_blocked,
    block_reason: r.block_reason,
    proof_number: r.proof_number,
  }));
}

export type PobStatuses = {
  /** موقف كل مكوّن — من أحداثه الخاصة + أحداث حزمته معاً (D-49). */
  components: Record<string, ComponentStatus>;
  /**
   * حالة الحزمة كلها — من كل أحداثها، سواء على مكوّن بعينه أو على
   * الحزمة ذاتها (component_id فارغ). [قاله يوسف] لا أحداث = لم يبدأ.
   */
  pob: ComponentStatus;
};

/**
 * يجلب أحداث الحزمة مرة واحدة ويحسب منها موقف كل مكوّن (من أحداثه الخاصة
 * مدموجة مع أحداث الحزمة نفسها، D-49) وموقف الحزمة كلها معاً.
 * componentIds لازم تشمل كل مكوّنات الحزمة — حتى اللي بلا أحداث خاصة،
 * عشان تاخد موقف الحزمة لو عليها حدث (اختبار "حدث حزمة وحده").
 */
export async function getPobStatuses(pobId: string, componentIds: string[]): Promise<PobStatuses> {
  const events = await listEventsForPob(pobId);
  const pobLevelEvents = toStatusInput(events.filter((e) => !e.component_id));

  const ownEventsByComponent = new Map<string, EventForStatus[]>();
  for (const e of events) {
    if (!e.component_id) continue;
    const list = ownEventsByComponent.get(e.component_id) ?? [];
    list.push(...toStatusInput([e]));
    ownEventsByComponent.set(e.component_id, list);
  }

  const components: Record<string, ComponentStatus> = {};
  for (const componentId of componentIds) {
    components[componentId] = computeComponentStatus(
      ownEventsByComponent.get(componentId) ?? [],
      pobLevelEvents
    );
  }

  return { components, pob: computeStatus(toStatusInput(events)) };
}

/** موقف كل حزمة من مجموعة حزم بجلبة واحدة — لعمود "الحالة" في قائمة الحزم. */
export async function getPobStatusesFor(pobIds: string[]): Promise<Record<string, ComponentStatus>> {
  if (pobIds.length === 0) return {};

  const supabase = await createClient();
  const { data, error } = await supabase.from("events").select(EVENT_SELECT).in("pob_id", pobIds);
  if (error) throw error;

  const rows = (data ?? []) as unknown as EventRow[];
  const byPob = new Map<string, EventRow[]>();
  for (const e of rows) {
    const list = byPob.get(e.pob_id) ?? [];
    list.push(e);
    byPob.set(e.pob_id, list);
  }

  const result: Record<string, ComponentStatus> = {};
  for (const pobId of pobIds) {
    result[pobId] = computeStatus(toStatusInput(byPob.get(pobId) ?? []));
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
