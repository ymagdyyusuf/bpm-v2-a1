import type { ComponentStatus } from "./events";

/**
 * تقرير الكتب المتبقية: "متأخر" = ميعاد متوقع مضى وليس له ميعاد فعلي.
 * [قاله يوسف] — مفصل شريحة ٦.
 */
export function isOverdue(status: ComponentStatus, today: string): boolean {
  if (status.lastDateActual) return false;
  if (!status.lastDateExpected) return false;
  return status.lastDateExpected < today;
}

/** أيام منذ آخر حدث = اليوم - COALESCE(الفعلي, المتوقع) لآخر حدث. */
export function daysSinceLastEvent(status: ComponentStatus, today: string): number | null {
  const last = status.lastDateActual ?? status.lastDateExpected;
  if (!last) return null;

  const lastDate = new Date(last + "T00:00:00Z");
  const todayDate = new Date(today + "T00:00:00Z");
  const diffMs = todayDate.getTime() - lastDate.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/** اليوم بصيغة ISO (بلا وقت) — نقطة مرجعية واحدة لكل حسابات "التأخر". */
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
