import {
  listAcademicYears,
  listTerms,
  listStages,
  listTypes,
  listLanguages,
  listSubjects,
  listComponentCategories,
  listComponentKinds,
  listActions,
} from "@/lib/db/reference";
import { listPublishers } from "@/lib/db/publishers";
import { getRemainingBooksReport, type ReportFilters } from "@/lib/db/reports";
import { toArabicDigits } from "@/lib/numerals";
import { AppHeader } from "@/components/AppHeader";
import { ReportHeader } from "@/components/ReportHeader";
import { ReportFilterBar, type ReportFilterValues } from "@/components/ReportFilterBar";

const OVERDUE_STYLE = { background: "oklch(0.945 0.05 25)", color: "oklch(0.4 0.1 25)" };

export default async function RemainingBooksReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;

  const [academicYearsRaw, terms, publishers, stages, types, languages, subjects, categories, kinds, actions] =
    await Promise.all([
      listAcademicYears(),
      listTerms(),
      listPublishers(),
      listStages(),
      listTypes(),
      listLanguages(),
      listSubjects(),
      listComponentCategories(),
      listComponentKinds(),
      listActions(),
    ]);
  const academicYears = academicYearsRaw.map((y) => ({ ...y, label: toArabicDigits(y.label) }));

  const options = {
    academic_year_id: academicYears,
    term_id: terms,
    publisher_id: publishers,
    stage_id: stages,
    type_id: types,
    language_id: languages,
    subject_id: subjects,
    category_id: categories,
    kind_id: kinds,
    action_id: actions,
  };

  // [قاله يوسف] "الحاليان" = أعلى display_order في كل جدول، طالما لا علم "حالياً" مخزَّن
  const currentAcademicYearId = params.academic_year_id ?? academicYearsRaw.at(-1)?.id;
  const currentTermId = params.term_id ?? terms.at(-1)?.id;
  const usingDefaultPeriod = !params.academic_year_id && !params.term_id;

  const filters: ReportFilters = {
    academic_year_id: currentAcademicYearId,
    term_id: currentTermId,
    publisher_id: params.publisher_id || undefined,
    stage_id: params.stage_id || undefined,
    type_id: params.type_id || undefined,
    language_id: params.language_id || undefined,
    subject_id: params.subject_id || undefined,
    category_id: params.category_id || undefined,
    kind_id: params.kind_id || undefined,
    action_id: params.action_id || undefined,
    date_from: params.date_from || undefined,
    date_to: params.date_to || undefined,
    blocked_only: params.blocked_only === "1",
    include_inactive: params.include_inactive === "1",
  };

  const current: ReportFilterValues = {
    academic_year_id: currentAcademicYearId,
    term_id: currentTermId,
    publisher_id: params.publisher_id,
    stage_id: params.stage_id,
    type_id: params.type_id,
    language_id: params.language_id,
    subject_id: params.subject_id,
    category_id: params.category_id,
    kind_id: params.kind_id,
    action_id: params.action_id,
    date_from: params.date_from,
    date_to: params.date_to,
    blocked_only: params.blocked_only,
    include_inactive: params.include_inactive,
  };

  const { rows, summary } = await getRemainingBooksReport(filters);

  function findLabel(list: { id: string; label: string }[] | undefined, id: string | undefined) {
    if (!id || !list) return null;
    return list.find((o) => o.id === id)?.label ?? null;
  }
  const filterTexts: string[] = [];
  const pushIf = (label: string, value: string | null) => {
    if (value) filterTexts.push(`${label}: ${value}`);
  };
  pushIf("السنة", findLabel(academicYears, currentAcademicYearId));
  pushIf("الترم", findLabel(terms, currentTermId));
  pushIf("الناشر", findLabel(publishers, params.publisher_id));
  pushIf("المرحلة", findLabel(stages, params.stage_id));
  pushIf("النوع", findLabel(types, params.type_id));
  pushIf("اللغة", findLabel(languages, params.language_id));
  pushIf("المادة", findLabel(subjects, params.subject_id));
  pushIf("الفئة", findLabel(categories, params.category_id));
  pushIf("النوع الفرعي", findLabel(kinds, params.kind_id));
  pushIf("الإجراء", findLabel(actions, params.action_id));
  if (params.blocked_only === "1") filterTexts.push("المعطَّل فقط");
  if (params.include_inactive === "1") filterTexts.push("يشمل المعطّلة");
  if (usingDefaultPeriod) filterTexts.push("(السنة والترم الحاليان تلقائياً)");

  return (
    <div style={{ padding: "36px 48px 56px", display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="no-print">
        <AppHeader title="الكتب المتبقية" subtitle="تقرير — كل مكوّن لم يصل لحالة منتهية" />
      </div>

      <div className="no-print">
        <ReportFilterBar options={options} current={current} />
      </div>

      <ReportHeader title="الكتب المتبقية" filtersText={filterTexts.join(" · ")} rowCount={summary.remaining} />

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", fontSize: 13, color: "var(--text-muted)" }}>
        <span>المتبقي: {toArabicDigits(summary.remaining)}</span>
        <span>منه متأخر: {toArabicDigits(summary.overdue)}</span>
        <span>معطَّل: {toArabicDigits(summary.disabled)}</span>
      </div>

      <table className="report-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            {["المادة", "المرحلة", "الناشر", "اسم المكوّن", "آخر إجراء", "الميعاد المتوقع", "أيام منذ آخر حدث", "متأخر؟", "التعطيل وسببه"].map((h) => (
              <th key={h} className="heading-font" style={{ padding: "8px 6px", textAlign: "start", fontWeight: 700, color: "var(--text-muted)" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={9} style={{ padding: "24px 6px", color: "var(--text-muted)" }}>
                لا يوجد كتب متبقية مطابقة
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr
                key={r.component.id}
                style={{ borderTop: "1px solid var(--border-soft)", ...(r.overdue ? OVERDUE_STYLE : {}) }}
              >
                <td style={{ padding: "7px 6px" }}>{r.pob.subject?.label}</td>
                <td style={{ padding: "7px 6px" }}>{r.pob.stage?.label}</td>
                <td style={{ padding: "7px 6px" }}>{r.pob.publisher?.label}</td>
                <td style={{ padding: "7px 6px" }}>{r.component.name ?? "—"}</td>
                <td style={{ padding: "7px 6px" }}>{r.status.lastAction ?? "—"}</td>
                <td style={{ padding: "7px 6px", fontVariantNumeric: "tabular-nums" }}>
                  {toArabicDigits(r.status.lastDateExpected) || "—"}
                </td>
                <td style={{ padding: "7px 6px", fontVariantNumeric: "tabular-nums" }}>
                  {r.daysSince != null ? toArabicDigits(r.daysSince) : "—"}
                </td>
                <td style={{ padding: "7px 6px", fontWeight: r.overdue ? 700 : 400 }}>{r.overdue ? "متأخر" : "—"}</td>
                <td style={{ padding: "7px 6px" }}>{r.status.isBlocked ? `معطَّل: ${r.status.blockReason}` : "—"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
