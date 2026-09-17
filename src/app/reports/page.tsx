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
import { getFlatReport, type ReportFilters } from "@/lib/db/reports";
import { computeRowVisibility } from "@/lib/reports";
import { toArabicDigits } from "@/lib/numerals";
import { AppHeader } from "@/components/AppHeader";
import { ReportHeader } from "@/components/ReportHeader";
import { ReportFilterBar, type ReportFilterValues } from "@/components/ReportFilterBar";
import { REPORT_COLUMNS, DEFAULT_COLUMNS, componentCellText } from "@/components/ReportColumns";

const DEFAULT_TITLE = "استخراج التقارير";

export default async function ReportsPage({
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
  const printOrderActionId = actions.find((a) => a.label === "أمر طبع")?.id;

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

  const progressValues = (params.progress ?? "").split(",").filter(Boolean) as ReportFilters["progress"];

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
    progress: progressValues && progressValues.length > 0 ? progressValues : undefined,
    blocked_only: params.blocked_only === "1",
    overdue_only: params.overdue_only === "1",
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
    overdue_only: params.overdue_only,
    include_inactive: params.include_inactive,
    cols: params.cols,
    title: params.title,
    shortcut: params.shortcut,
  };

  const selectedColumnKeys = new Set(
    params.cols ? params.cols.split(",").filter(Boolean) : DEFAULT_COLUMNS
  );
  const activeColumns = REPORT_COLUMNS.filter((c) => selectedColumnKeys.has(c.key));

  const { rows } = await getFlatReport(filters);
  const visibility = computeRowVisibility(
    rows.map((r) => ({ stageLabel: r.pob.stage?.label ?? "", pobLabel: r.pob.subject?.label ?? "" }))
  );

  function findLabel(list: { id: string; label: string }[] | undefined, id: string | undefined) {
    if (!id || !list) return null;
    return list.find((o) => o.id === id)?.label ?? null;
  }
  const filterTexts: string[] = [];
  if (params.shortcut) filterTexts.push(`الاختصار: ${params.shortcut}`);
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
  if (progressValues && progressValues.length > 0) filterTexts.push(`حالة الإنجاز: ${progressValues.join("، ")}`);
  if (params.blocked_only === "1") filterTexts.push("المعطَّل فقط");
  if (params.overdue_only === "1") filterTexts.push("متأخر فقط");
  if (params.date_from) filterTexts.push(`من: ${toArabicDigits(params.date_from)}`);
  if (params.date_to) filterTexts.push(`إلى: ${toArabicDigits(params.date_to)}`);
  if (params.include_inactive === "1") filterTexts.push("يشمل المعطّلة");

  const reportTitle = params.title?.trim() || DEFAULT_TITLE;
  const totalCols = 3 + activeColumns.length;

  return (
    <div style={{ padding: "36px 48px 56px", display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="no-print">
        <AppHeader title="استخراج التقارير" subtitle="محرّك تقرير واحد — كل مكوّن بآخر حدث له" />
      </div>

      <div className="no-print">
        <ReportFilterBar options={options} current={current} printOrderActionId={printOrderActionId} />
      </div>

      <ReportHeader title={reportTitle} filtersText={filterTexts.join(" · ")} rowCount={rows.length} />

      <table className="report-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            {["المرحلة", "الحزمة", "المكوّن", ...activeColumns.map((c) => c.label)].map((h, i) => (
              <th
                key={h + i}
                className="heading-font"
                style={{ padding: "8px 6px", textAlign: "start", fontWeight: 700, color: "var(--text-muted)" }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={totalCols} style={{ padding: "24px 6px", color: "var(--text-muted)" }}>
                لا توجد نتائج مطابقة
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr key={`${r.pob.id}-${r.component?.id ?? "none"}`} style={{ borderTop: "1px solid var(--border-soft)" }}>
                <td style={{ padding: "7px 6px" }}>{visibility[i].showStage ? r.pob.stage?.label : ""}</td>
                <td style={{ padding: "7px 6px" }}>{visibility[i].showPob ? r.pob.subject?.label : ""}</td>
                <td style={{ padding: "7px 6px" }}>{componentCellText(r)}</td>
                {activeColumns.map((c) => (
                  <td
                    key={c.key}
                    style={{
                      padding: "7px 6px",
                      textAlign: c.align,
                      fontVariantNumeric: c.align !== "start" ? "tabular-nums" : undefined,
                    }}
                  >
                    {c.cell(r)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
