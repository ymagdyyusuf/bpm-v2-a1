import { notFound } from "next/navigation";
import { getPob, getPobDependents } from "@/lib/db/pobs";
import {
  listAcademicYears,
  listTerms,
  listStages,
  listTypes,
  listLanguages,
  listSubjects,
} from "@/lib/db/reference";
import { listPublishers } from "@/lib/db/publishers";
import { updatePobAction, deletePobAction, reactivatePobAction } from "@/lib/actions/pobs";
import { toArabicDigits } from "@/lib/numerals";
import { AppHeader } from "@/components/AppHeader";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import {
  selectStyle,
  fieldLabelStyle,
  errorBannerStyle,
  primaryButtonStyle,
  dangerButtonStyle,
  neutralButtonStyle,
} from "@/components/formStyles";

export default async function EditPobPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const [pob, academicYearsRaw, terms, publishers, stages, types, languages, subjects] = await Promise.all([
    getPob(id),
    listAcademicYears(),
    listTerms(),
    listPublishers(),
    listStages(),
    listTypes(),
    listLanguages(),
    listSubjects(),
  ]);

  if (!pob) notFound();

  const dependents = await getPobDependents(pob.id);
  const willDeactivate = dependents.componentCount > 0 || dependents.eventCount > 0;
  const dependentParts: string[] = [];
  if (dependents.componentCount > 0) dependentParts.push(`${toArabicDigits(dependents.componentCount)} مكوّن`);
  if (dependents.eventCount > 0) dependentParts.push(`${toArabicDigits(dependents.eventCount)} حدث`);

  const academicYears = academicYearsRaw.map((y) => ({ ...y, label: toArabicDigits(y.label) }));

  const fields: { name: string; label: string; current: string; options: { id: string; label: string }[] }[] = [
    { name: "academic_year_id", label: "السنة", current: pob.academic_year_id, options: academicYears },
    { name: "term_id", label: "الترم", current: pob.term_id, options: terms },
    { name: "publisher_id", label: "الناشر", current: pob.publisher_id, options: publishers },
    { name: "stage_id", label: "المرحلة", current: pob.stage_id, options: stages },
    { name: "type_id", label: "النوع", current: pob.type_id, options: types },
    { name: "language_id", label: "اللغة", current: pob.language_id, options: languages },
    { name: "subject_id", label: "المادة", current: pob.subject_id, options: subjects },
  ];

  return (
    <div style={{ padding: "36px 48px 56px", display: "flex", flexDirection: "column", gap: 24 }}>
      <AppHeader title="تعديل الحزمة" subtitle={`${pob.subject?.label ?? ""} — ${pob.stage?.label ?? ""}`} />

      <a href={`/pobs/${pob.id}`} style={{ fontSize: 13.5, fontWeight: 600 }}>
        → رجوع لتفاصيل الحزمة
      </a>

      {error ? <div style={errorBannerStyle}>{error}</div> : null}

      <form
        action={updatePobAction}
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-soft)",
          borderRadius: 14,
          padding: "20px",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 14,
        }}
      >
        <input type="hidden" name="pob_id" value={pob.id} />

        {fields.map((f) => (
          <label key={f.name} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={fieldLabelStyle}>{f.label}</span>
            <select name={f.name} required defaultValue={f.current} style={selectStyle}>
              {f.options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        ))}

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={fieldLabelStyle}>السعر (اختياري)</span>
          <input type="text" name="price" inputMode="decimal" defaultValue={pob.price ?? ""} style={selectStyle} />
        </label>

        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <button type="submit" className="heading-font" style={{ ...primaryButtonStyle, width: "100%" }}>
            حفظ التعديل
          </button>
        </div>
      </form>

      {pob.is_active ? (
        <form
          action={deletePobAction}
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border-soft)",
            borderRadius: 14,
            padding: "18px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <input type="hidden" name="pob_id" value={pob.id} />
          <p style={{ margin: 0, fontSize: 13.5, color: "var(--text-muted)" }}>
            {willDeactivate ? (
              <>على الحزمة {dependentParts.join(" و")} — الحذف هيعطّلها بدل ما يمسحها، وترجع بـ&quot;إعادة تفعيل&quot; وقت ما تحب.</>
            ) : (
              <>الحزمة فاضية تماماً — الحذف نهائي ولا رجعة فيه.</>
            )}
          </p>
          <ConfirmSubmitButton
            confirmText={
              willDeactivate
                ? `على الحزمة ${dependentParts.join(" و")}. هتتعطّل بدل ما تتمسح، وممكن ترجّعها بعدين. متأكد؟`
                : "الحزمة فاضية تماماً وهتتمسح نهائياً — الخطوة دي لا رجعة فيها. متأكد؟"
            }
            style={dangerButtonStyle}
          >
            حذف الحزمة
          </ConfirmSubmitButton>
        </form>
      ) : (
        <form
          action={reactivatePobAction}
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border-soft)",
            borderRadius: 14,
            padding: "18px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <input type="hidden" name="pob_id" value={pob.id} />
          <p style={{ margin: 0, fontSize: 13.5, color: "var(--text-muted)" }}>
            الحزمة معطَّلة حالياً{dependentParts.length > 0 ? ` (عليها ${dependentParts.join(" و")})` : ""} — الحذف النهائي
            غير متاح طالما عليها تبعيات؛ إعادة التفعيل ترجّعها للقائمة الفعّالة كما هي.
          </p>
          <button type="submit" className="heading-font" style={neutralButtonStyle}>
            إعادة تفعيل الحزمة
          </button>
        </form>
      )}
    </div>
  );
}
