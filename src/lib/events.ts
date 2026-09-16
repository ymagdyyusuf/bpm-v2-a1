import { normalizeDigitsForParsing } from "./numerals";

export type EventFormInput = {
  actionRequiresNumber: boolean;
  proofNumber: string;
  dateExpected: string;
  dateActual: string;
  isBlocked: boolean;
  blockReason: string;
};

export type ResolvedEvent = {
  proofNumber: number | null;
  dateExpected: string | null;
  dateActual: string | null;
  blockReason: string | null;
};

/** إجراء يتطلب رقماً (بروفة) يُلزم بـproof_number. */
function resolveProofNumber(input: EventFormInput): number | null {
  const trimmed = normalizeDigitsForParsing(input.proofNumber.trim());
  const value = trimmed ? Number(trimmed) : null;

  if (trimmed && (!Number.isInteger(value) || (value as number) < 0)) {
    throw new Error("رقم البروفة: يجب أن يكون رقماً صحيحاً موجباً");
  }
  if (input.actionRequiresNumber && value == null) {
    throw new Error("رقم البروفة: مطلوب لهذا الإجراء");
  }
  return value;
}

/** is_blocked = صح يُلزم بـblock_reason. */
function resolveBlockReason(input: EventFormInput): string | null {
  const blockReason = input.blockReason.trim() || null;
  if (input.isBlocked && !blockReason) {
    throw new Error("سبب التعطيل: مطلوب عند التعطيل");
  }
  return blockReason;
}

/** D-29: لو الاتنين فاضيين، date_actual يفترض تاريخ اليوم. */
function resolveDates(input: EventFormInput): { dateExpected: string | null; dateActual: string | null } {
  const dateExpected = input.dateExpected.trim() || null;
  let dateActual = input.dateActual.trim() || null;

  if (!dateExpected && !dateActual) {
    dateActual = new Date().toISOString().slice(0, 10);
  }
  return { dateExpected, dateActual };
}

export function resolveEventInput(input: EventFormInput): ResolvedEvent {
  const proofNumber = resolveProofNumber(input);
  const blockReason = resolveBlockReason(input);
  const { dateExpected, dateActual } = resolveDates(input);
  return { proofNumber, dateExpected, dateActual, blockReason };
}

export type EventForStatus = {
  action_label: string;
  date_expected: string | null;
  date_actual: string | null;
  created_at: string;
  is_blocked: boolean;
  block_reason: string | null;
};

export type ComponentStatus = {
  progress: "لم يبدأ" | "جارٍ" | "منتهية";
  isBlocked: boolean;
  blockReason: string | null;
  lastAction: string | null;
};

/** D-25: آخر حدث = الأحدث بـCOALESCE(date_actual, date_expected) ثم created_at. */
function sortKey(e: EventForStatus): [string, string] {
  return [e.date_actual ?? e.date_expected ?? "", e.created_at];
}

/**
 * موقف الحزمة = أحدث حدث في نطاقها أو نطاق أي من مكوّناتها (D-49) —
 * مرّر كل أحداث الحزمة (على الحزمة وعلى مكوّناتها معاً) لنفس الدالة.
 */
export function computeStatus(events: EventForStatus[]): ComponentStatus {
  if (events.length === 0) {
    return { progress: "لم يبدأ", isBlocked: false, blockReason: null, lastAction: null };
  }

  const latest = [...events].sort((a, b) => {
    const [aDate, aCreated] = sortKey(a);
    const [bDate, bCreated] = sortKey(b);
    if (aDate !== bDate) return aDate < bDate ? 1 : -1;
    return aCreated < bCreated ? 1 : -1;
  })[0];

  return {
    progress: latest.action_label === "تم الانتهاء" ? "منتهية" : "جارٍ",
    isBlocked: latest.is_blocked,
    blockReason: latest.is_blocked ? latest.block_reason : null,
    lastAction: latest.action_label,
  };
}

/**
 * D-49: موقف المكوّن = أحدث حدث من (أحداثه الخاصة + أحداث حزمته) بترتيب D-25.
 * حدث أحدث يغلب تلقائياً — الترتيب الزمني وحده يحسم، بلا استثناء مكتوب
 * (نفس القاعدة تحكم التعطيل: لو أحدث حدث حزمة معطِّل، المكوّن يظهر معطَّلاً).
 * دالة واحدة تستعملها كل الشاشات والتقارير (D-18 · D-20).
 */
export function computeComponentStatus(
  ownEvents: EventForStatus[],
  pobLevelEvents: EventForStatus[]
): ComponentStatus {
  return computeStatus([...ownEvents, ...pobLevelEvents]);
}
