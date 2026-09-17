import type { ReactNode } from "react";
import type { FlatReportRow } from "@/lib/db/reports";
import { toArabicDigits } from "@/lib/numerals";

export type ReportColumnKey =
  | "publisher"
  | "type"
  | "language"
  | "term"
  | "year"
  | "price"
  | "last_action"
  | "proof_number"
  | "date_expected"
  | "date_actual"
  | "status"
  | "blocked"
  | "days_since"
  | "overdue"
  | "size"
  | "pages"
  | "colors";

export type ReportColumnDef = {
  key: ReportColumnKey;
  label: string;
  align: "start" | "center" | "left";
  cell: (row: FlatReportRow) => ReactNode;
};

/** ترتيب العرض الثابت للأعمدة الاختيارية — شريحة ٦ (إعادة البناء) §٣. */
export const REPORT_COLUMNS: ReportColumnDef[] = [
  { key: "publisher", label: "الناشر", align: "start", cell: (r) => r.pob.publisher?.label ?? "—" },
  { key: "type", label: "النوع", align: "start", cell: (r) => r.pob.type?.label ?? "—" },
  { key: "language", label: "اللغة", align: "start", cell: (r) => r.pob.language?.label ?? "—" },
  { key: "term", label: "الترم", align: "start", cell: (r) => r.pob.term?.label ?? "—" },
  { key: "year", label: "السنة", align: "center", cell: (r) => toArabicDigits(r.pob.academic_year?.label) || "—" },
  {
    key: "price",
    label: "السعر",
    align: "left",
    cell: (r) => (r.pob.price != null ? toArabicDigits(r.pob.price.toFixed(2)) : "—"),
  },
  { key: "last_action", label: "آخر إجراء", align: "start", cell: (r) => r.status.lastAction ?? "—" },
  {
    key: "proof_number",
    label: "رقم البروفة",
    align: "center",
    cell: (r) => (r.status.lastProofNumber != null ? toArabicDigits(r.status.lastProofNumber) : "—"),
  },
  {
    key: "date_expected",
    label: "الميعاد المتوقع",
    align: "center",
    cell: (r) => toArabicDigits(r.status.lastDateExpected) || "—",
  },
  {
    key: "date_actual",
    label: "الميعاد الفعلي",
    align: "center",
    cell: (r) => toArabicDigits(r.status.lastDateActual) || "—",
  },
  { key: "status", label: "الحالة", align: "center", cell: (r) => r.status.progress },
  {
    key: "blocked",
    label: "التعطيل وسببه",
    align: "start",
    cell: (r) => (r.status.isBlocked ? `معطَّل: ${r.status.blockReason}` : "—"),
  },
  {
    key: "days_since",
    label: "أيام منذ آخر حدث",
    align: "center",
    cell: (r) => (r.daysSince != null ? toArabicDigits(r.daysSince) : "—"),
  },
  { key: "overdue", label: "متأخر؟", align: "center", cell: (r) => (r.overdue ? "متأخر" : "—") },
  {
    key: "size",
    label: "المقاس",
    align: "center",
    cell: (r) =>
      r.component && r.component.page_height_cm != null && r.component.page_width_cm != null
        ? `${toArabicDigits(r.component.page_height_cm)} × ${toArabicDigits(r.component.page_width_cm)}`
        : "—",
  },
  {
    key: "pages",
    label: "الصفحات",
    align: "center",
    cell: (r) => (r.component ? toArabicDigits(r.component.page_count) : "—"),
  },
  { key: "colors", label: "الألوان", align: "start", cell: (r) => r.component?.colors ?? "—" },
];

export const DEFAULT_COLUMNS: ReportColumnKey[] = [
  "last_action",
  "proof_number",
  "date_expected",
  "date_actual",
  "status",
  "blocked",
];

export const PRINT_ORDERS_COLUMNS: ReportColumnKey[] = ["size", "pages", "colors", "price"];

export function componentCellText(row: FlatReportRow): string {
  if (!row.component) return "— بلا مكوّنات —";
  const parts = [row.component.category?.label, row.component.kind?.label, row.component.name].filter(Boolean);
  return parts.join(" · ") || "—";
}
