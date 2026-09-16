import { createClient } from "@/lib/supabase/server";
import { computeComponentStatus, computeStatus, type EventForStatus, type ComponentStatus } from "@/lib/events";
import { isOverdue, daysSinceLastEvent, todayIso } from "@/lib/reports";
import { listPobs, type Pob, type PobFilters } from "@/lib/db/pobs";

export type ReportFilters = PobFilters & {
  category_id?: string;
  kind_id?: string;
  action_id?: string;
  date_from?: string;
  date_to?: string;
  progress?: "لم يبدأ" | "جارٍ" | "منتهية";
  blocked_only?: boolean;
  include_inactive?: boolean;
};

type ComponentRow = {
  id: string;
  pob_id: string;
  name: string | null;
  page_width_cm: number | null;
  page_height_cm: number | null;
  page_count: number | null;
  colors: string | null;
  display_order: number;
  is_active: boolean;
  category: { label: string; display_order: number } | null;
  kind: { label: string } | null;
};

const COMPONENT_SELECT = `
  id, pob_id, name, page_width_cm, page_height_cm, page_count, colors, display_order, is_active,
  category:component_categories(label, display_order),
  kind:component_kinds(label)
`;

type EventRow = {
  pob_id: string;
  component_id: string | null;
  action_id: string;
  action: { label: string; is_terminal: boolean } | null;
  proof_number: number | null;
  date_expected: string | null;
  date_actual: string | null;
  created_at: string;
  is_blocked: boolean;
  block_reason: string | null;
};

const EVENT_SELECT = `
  pob_id, component_id, action_id, proof_number, date_expected, date_actual,
  is_blocked, block_reason, created_at,
  action:actions(label, is_terminal)
`;

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

async function fetchPobsAndEvents(filters: ReportFilters) {
  const pobFilters: PobFilters = {
    academic_year_id: filters.academic_year_id,
    term_id: filters.term_id,
    publisher_id: filters.publisher_id,
    stage_id: filters.stage_id,
    type_id: filters.type_id,
    language_id: filters.language_id,
    subject_id: filters.subject_id,
  };
  const allPobs = await listPobs(pobFilters);
  const pobs = filters.include_inactive ? allPobs : allPobs.filter((p) => p.is_active);
  const pobIds = pobs.map((p) => p.id);

  if (pobIds.length === 0) {
    return { pobs: [] as Pob[], componentsByPob: new Map<string, ComponentRow[]>(), eventsByPob: new Map<string, EventRow[]>() };
  }

  const supabase = await createClient();

  let componentsQuery = supabase.from("components").select(COMPONENT_SELECT).in("pob_id", pobIds);
  if (filters.category_id) componentsQuery = componentsQuery.eq("category_id", filters.category_id);
  if (filters.kind_id) componentsQuery = componentsQuery.eq("kind_id", filters.kind_id);
  const { data: componentsData, error: componentsError } = await componentsQuery;
  if (componentsError) throw componentsError;

  const { data: eventsData, error: eventsError } = await supabase
    .from("events")
    .select(EVENT_SELECT)
    .in("pob_id", pobIds);
  if (eventsError) throw eventsError;

  const allComponents = (componentsData ?? []) as unknown as ComponentRow[];
  const components = filters.include_inactive ? allComponents : allComponents.filter((c) => c.is_active);

  const componentsByPob = new Map<string, ComponentRow[]>();
  for (const c of components) {
    const list = componentsByPob.get(c.pob_id) ?? [];
    list.push(c);
    componentsByPob.set(c.pob_id, list);
  }

  const eventsByPob = new Map<string, EventRow[]>();
  for (const e of (eventsData ?? []) as unknown as EventRow[]) {
    const list = eventsByPob.get(e.pob_id) ?? [];
    list.push(e);
    eventsByPob.set(e.pob_id, list);
  }

  return { pobs, componentsByPob, eventsByPob };
}

function passesEventFilters(status: ComponentStatus, filters: ReportFilters, latestActionId: string | null): boolean {
  if (filters.action_id && latestActionId !== filters.action_id) return false;
  if (filters.progress && status.progress !== filters.progress) return false;
  if (filters.blocked_only && !status.isBlocked) return false;

  const relevantDate = status.lastDateActual ?? status.lastDateExpected;
  if (filters.date_from && (!relevantDate || relevantDate < filters.date_from)) return false;
  if (filters.date_to && (!relevantDate || relevantDate > filters.date_to)) return false;

  return true;
}

export type DetailedComponentRow = ComponentRow & { status: ComponentStatus; latestActionId: string | null };
export type DetailedGroup = { pob: Pob; pobStatus: ComponentStatus; components: DetailedComponentRow[] };
export type DetailedStatusSummary = {
  pobCount: number;
  componentCount: number;
  byProgress: Record<"لم يبدأ" | "جارٍ" | "منتهية", number>;
  disabledCount: number;
};

/** تقرير الموقف التفصيلي (شريحة ٦) — يقرأ من computeComponentStatus وحدها (D-49 · D-18 · D-20). */
export async function getDetailedStatusReport(
  filters: ReportFilters
): Promise<{ groups: DetailedGroup[]; summary: DetailedStatusSummary }> {
  const { pobs, componentsByPob, eventsByPob } = await fetchPobsAndEvents(filters);

  const groups: DetailedGroup[] = [];
  const summary: DetailedStatusSummary = {
    pobCount: 0,
    componentCount: 0,
    byProgress: { "لم يبدأ": 0, "جارٍ": 0, "منتهية": 0 },
    disabledCount: 0,
  };

  for (const pob of pobs) {
    const pobEvents = eventsByPob.get(pob.id) ?? [];
    const pobLevelEvents = toStatusInput(pobEvents.filter((e) => !e.component_id));
    const ownEventsByComponent = new Map<string, EventRow[]>();
    for (const e of pobEvents) {
      if (!e.component_id) continue;
      const list = ownEventsByComponent.get(e.component_id) ?? [];
      list.push(e);
      ownEventsByComponent.set(e.component_id, list);
    }

    const components = componentsByPob.get(pob.id) ?? [];
    const rows: DetailedComponentRow[] = [];

    for (const c of components) {
      const ownRows = ownEventsByComponent.get(c.id) ?? [];
      const status = computeComponentStatus(toStatusInput(ownRows), pobLevelEvents);

      // آخر إجراء الحقيقي (معرّفاً) — لفلتر "الإجراء" (الربط بالمعرّف لا بالاسم، معيار الكود #٤)
      const merged = [...ownRows, ...pobEvents.filter((e) => !e.component_id)];
      const latestActionId =
        merged.length === 0
          ? null
          : [...merged].sort((a, b) => {
              const ak = a.date_actual ?? a.date_expected ?? "";
              const bk = b.date_actual ?? b.date_expected ?? "";
              if (ak !== bk) return ak < bk ? 1 : -1;
              return a.created_at < b.created_at ? 1 : -1;
            })[0].action_id;

      if (!passesEventFilters(status, filters, latestActionId)) continue;

      rows.push({ ...c, status, latestActionId });
      summary.componentCount += 1;
      summary.byProgress[status.progress] += 1;
      if (!c.is_active) summary.disabledCount += 1;
    }

    if (rows.length === 0) continue;

    rows.sort((a, b) => a.display_order - b.display_order);

    const pobStatus = computeStatus(toStatusInput(pobEvents));
    groups.push({ pob, pobStatus, components: rows });
    summary.pobCount += 1;
  }

  // الترتيب الافتراضي: المرحلة ← المادة، بترتيب القوائم المرجعية (display_order)
  // لا أبجدياً — نص عربي مرتَّب أبجدياً يكسر تسلسل KG1 ← ١ ابتدائي ← ٢ ابتدائي...
  groups.sort((a, b) => {
    const stageDiff = (a.pob.stage?.display_order ?? 0) - (b.pob.stage?.display_order ?? 0);
    if (stageDiff !== 0) return stageDiff;
    return (a.pob.subject?.display_order ?? 0) - (b.pob.subject?.display_order ?? 0);
  });

  return { groups, summary };
}

export type RemainingBookRow = {
  pob: Pob;
  component: ComponentRow;
  status: ComponentStatus;
  overdue: boolean;
  daysSince: number | null;
};

/** تقرير الكتب المتبقية (شريحة ٦) — كل مكوّن حالته ليست "منتهية". */
export async function getRemainingBooksReport(
  filters: ReportFilters
): Promise<{ rows: RemainingBookRow[]; summary: { remaining: number; overdue: number; disabled: number } }> {
  const { pobs, componentsByPob, eventsByPob } = await fetchPobsAndEvents(filters);
  const today = todayIso();

  const rows: RemainingBookRow[] = [];
  const pobById = new Map(pobs.map((p) => [p.id, p]));

  for (const pob of pobs) {
    const pobEvents = eventsByPob.get(pob.id) ?? [];
    const pobLevelEvents = toStatusInput(pobEvents.filter((e) => !e.component_id));
    const ownEventsByComponent = new Map<string, EventRow[]>();
    for (const e of pobEvents) {
      if (!e.component_id) continue;
      const list = ownEventsByComponent.get(e.component_id) ?? [];
      list.push(e);
      ownEventsByComponent.set(e.component_id, list);
    }

    const components = componentsByPob.get(pob.id) ?? [];
    for (const c of components) {
      const ownRows = ownEventsByComponent.get(c.id) ?? [];
      const status = computeComponentStatus(toStatusInput(ownRows), pobLevelEvents);
      if (status.progress === "منتهية") continue;

      const merged = [...ownRows, ...pobEvents.filter((e) => !e.component_id)];
      const latestActionId =
        merged.length === 0
          ? null
          : [...merged].sort((a, b) => {
              const ak = a.date_actual ?? a.date_expected ?? "";
              const bk = b.date_actual ?? b.date_expected ?? "";
              if (ak !== bk) return ak < bk ? 1 : -1;
              return a.created_at < b.created_at ? 1 : -1;
            })[0].action_id;

      if (!passesEventFilters(status, filters, latestActionId)) continue;

      rows.push({
        pob: pobById.get(pob.id)!,
        component: c,
        status,
        overdue: isOverdue(status, today),
        daysSince: daysSinceLastEvent(status, today),
      });
    }
  }

  rows.sort((a, b) => {
    const aDate = a.status.lastDateActual ?? a.status.lastDateExpected ?? "";
    const bDate = b.status.lastDateActual ?? b.status.lastDateExpected ?? "";
    return aDate < bDate ? -1 : aDate > bDate ? 1 : 0;
  });

  const summary = {
    remaining: rows.length,
    overdue: rows.filter((r) => r.overdue).length,
    disabled: rows.filter((r) => !r.component.is_active || !r.pob.is_active).length,
  };

  return { rows, summary };
}
