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
import { getDetailedStatusReport, type ReportFilters } from "@/lib/db/reports";
import { toArabicDigits } from "@/lib/numerals";
import { AppHeader } from "@/components/AppHeader";
import { ReportHeader } from "@/components/ReportHeader";
import { ReportFilterBar, type ReportFilterValues } from "@/components/ReportFilterBar";
import { StatusBadge } from "@/components/StatusBadge";

export default async function DetailedStatusReportPage({
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

  const filters: ReportFilters = {
    academic_year_id: params.academic_year_id || undefined,
    term_id: params.term_id || undefined,
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
    progress: (params.progress as ReportFilters["progress"]) || undefined,
    blocked_only: params.blocked_only === "1",
    include_inactive: params.include_inactive === "1",
  };

  const current: ReportFilterValues = {
    academic_year_id: params.academic_year_id,
    term_id: params.term_id,
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
    progress: params.progress,
    blocked_only: params.blocked_only,
    include_inactive: params.include_inactive,
  };

  const { groups, summary } = await getDetailedStatusReport(filters);

  function findLabel(list: { id: string; label: string }[] | undefined, id: string | undefined) {
    if (!id || !list) return null;
    return list.find((o) => o.id === id)?.label ?? null;
  }
  const filterTexts: string[] = [];
  const pushIf = (label: string, value: string | null) => {
    if (value) filterTexts.push(`${label}: ${value}`);
  };
  pushIf("السنة", findLabel(academicYears, params.academic_year_id));
  pushIf("الترم", findLabel(terms, params.term_id));
  pushIf("الناشر", findLabel(publishers, params.publisher_id));
  pushIf("المرحلة", findLabel(stages, params.stage_id));
  pushIf("النوع", findLabel(types, params.type_id));
  pushIf("اللغة", findLabel(languages, params.language_id));
  pushIf("المادة", findLabel(subjects, params.subject_id));
  pushIf("الفئة", findLabel(categories, params.category_id));
  pushIf("النوع الفرعي", findLabel(kinds, params.kind_id));
  pushIf("الإجراء", findLabel(actions, params.action_id));
  if (params.progress) filterTexts.push(`حالة الإنجاز: ${params.progress}`);
  if (params.blocked_only === "1") filterTexts.push("المعطَّل فقط");
  if (params.date_from) filterTexts.push(`من: ${toArabicDigits(params.date_from)}`);
  if (params.date_to) filterTexts.push(`إلى: ${toArabicDigits(params.date_to)}`);
  if (params.include_inactive === "1") filterTexts.push("يشمل المعطّلة");

  return (
    <div style={{ padding: "36px 48px 56px", display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="no-print">
        <AppHeader title="الموقف التفصيلي" subtitle="تقرير — كل مكوّن بآخر حدث له" />
      </div>

      <div className="no-print">
        <ReportFilterBar options={options} current={current} />
      </div>

      <ReportHeader
        title="الموقف التفصيلي"
        filtersText={filterTexts.join(" · ")}
        rowCount={summary.componentCount}
      />

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", fontSize: 13, color: "var(--text-muted)" }}>
        <span>عدد الحزم: {toArabicDigits(summary.pobCount)}</span>
        <span>عدد المكوّنات: {toArabicDigits(summary.componentCount)}</span>
        <span>لم يبدأ: {toArabicDigits(summary.byProgress["لم يبدأ"])}</span>
        <span>جارٍ: {toArabicDigits(summary.byProgress["جارٍ"])}</span>
        <span>منتهية: {toArabicDigits(summary.byProgress["منتهية"])}</span>
        <span>معطَّل: {toArabicDigits(summary.disabledCount)}</span>
      </div>

      <table className="report-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            {["الفئة", "النوع الفرعي", "اسم المكوّن", "المقاس", "الصفحات", "الألوان", "آخر إجراء", "رقم البروفة", "الميعاد المتوقع", "الميعاد الفعلي", "الحالة", "التعطيل وسببه"].map(
              (h) => (
                <th key={h} className="heading-font" style={{ padding: "8px 6px", textAlign: "start", fontWeight: 700, color: "var(--text-muted)" }}>
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        {groups.length === 0 ? (
          <tbody>
            <tr>
              <td colSpan={12} style={{ padding: "24px 6px", color: "var(--text-muted)" }}>
                لا توجد نتائج مطابقة
              </td>
            </tr>
          </tbody>
        ) : (
          groups.map((g) => (
            <tbody key={g.pob.id} className="report-group">
              <tr style={{ background: "var(--surface)", borderTop: "2px solid var(--border)" }}>
                <td colSpan={12} style={{ padding: "10px 6px" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center", fontSize: 13 }}>
                    <strong className="heading-font">{g.pob.subject?.label}</strong>
                    <span>{g.pob.stage?.label}</span>
                    <span>{g.pob.publisher?.label}</span>
                    <span>{g.pob.type?.label}</span>
                    <span>{g.pob.language?.label}</span>
                    <span>{g.pob.term?.label}</span>
                    <span>{toArabicDigits(g.pob.academic_year?.label)}</span>
                    <span>{g.pob.price != null ? toArabicDigits(g.pob.price.toFixed(2)) : "—"}</span>
                    <StatusBadge status={g.pobStatus} />
                  </div>
                </td>
              </tr>
              {g.components.map((c) => {
                const size =
                  c.page_height_cm != null && c.page_width_cm != null
                    ? `${toArabicDigits(c.page_height_cm)} × ${toArabicDigits(c.page_width_cm)}`
                    : "—";
                return (
                  <tr key={c.id} style={{ borderTop: "1px solid var(--border-soft)" }}>
                    <td style={{ padding: "7px 6px" }}>{c.category?.label}</td>
                    <td style={{ padding: "7px 6px" }}>{c.kind?.label}</td>
                    <td style={{ padding: "7px 6px" }}>{c.name ?? "—"}</td>
                    <td style={{ padding: "7px 6px", fontVariantNumeric: "tabular-nums" }}>{size}</td>
                    <td style={{ padding: "7px 6px", fontVariantNumeric: "tabular-nums" }}>{toArabicDigits(c.page_count)}</td>
                    <td style={{ padding: "7px 6px" }}>{c.colors ?? "—"}</td>
                    <td style={{ padding: "7px 6px" }}>{c.status.lastAction ?? "—"}</td>
                    <td style={{ padding: "7px 6px", fontVariantNumeric: "tabular-nums" }}>
                      {c.status.lastProofNumber != null ? toArabicDigits(c.status.lastProofNumber) : "—"}
                    </td>
                    <td style={{ padding: "7px 6px", fontVariantNumeric: "tabular-nums" }}>{toArabicDigits(c.status.lastDateExpected) || "—"}</td>
                    <td style={{ padding: "7px 6px", fontVariantNumeric: "tabular-nums" }}>{toArabicDigits(c.status.lastDateActual) || "—"}</td>
                    <td style={{ padding: "7px 6px", fontWeight: 700 }}>{c.status.progress}</td>
                    <td style={{ padding: "7px 6px" }}>
                      {c.status.isBlocked ? `معطَّل: ${c.status.blockReason}` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          ))
        )}
      </table>
    </div>
  );
}
