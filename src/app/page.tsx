import { listPobs, type PobFilters } from "@/lib/db/pobs";
import { listAcademicYears, listTerms, listStages, listTypes, listLanguages, listSubjects } from "@/lib/db/reference";
import { listPublishers } from "@/lib/db/publishers";
import { createPobAction } from "@/lib/actions/pobs";
import { toArabicDigits } from "@/lib/numerals";
import { AppHeader } from "@/components/AppHeader";
import { PobsFilterBar } from "@/components/PobsFilterBar";
import { errorBannerStyle, noticeBannerStyle, inactiveBadgeStyle } from "@/components/formStyles";

const FILTER_KEYS = [
  "academic_year_id",
  "term_id",
  "publisher_id",
  "stage_id",
  "type_id",
  "language_id",
  "subject_id",
] as const;

export default async function PobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;

  const filters: PobFilters = {};
  for (const key of FILTER_KEYS) {
    if (params[key]) filters[key] = params[key];
  }

  const [pobs, academicYearsRaw, terms, publishers, stages, types, languages, subjects] = await Promise.all([
    listPobs(filters),
    listAcademicYears(),
    listTerms(),
    listPublishers(),
    listStages(),
    listTypes(),
    listLanguages(),
    listSubjects(),
  ]);

  // D-31: السنة رقم — تُعرض عربية، والقيمة (uuid) خلف الكواليس تبقى كما هي للفلترة والترتيب
  const academicYears = academicYearsRaw.map((y) => ({ ...y, label: toArabicDigits(y.label) }));

  const options = {
    academic_year_id: academicYears,
    term_id: terms,
    publisher_id: publishers,
    stage_id: stages,
    type_id: types,
    language_id: languages,
    subject_id: subjects,
  };

  return (
    <div style={{ padding: "40px 48px 56px", display: "flex", flexDirection: "column", gap: 22 }}>
      <AppHeader title="حزم الكتب" subtitle="الوصول إلى حزمة والتعامل معها" />

      <PobsFilterBar options={options} current={filters} />

      {params.error ? <div style={errorBannerStyle}>{params.error}</div> : null}
      {params.notice ? <div style={noticeBannerStyle}>{params.notice}</div> : null}

      <details
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-soft)",
          borderRadius: 14,
          padding: "16px 20px",
        }}
      >
        <summary className="heading-font" style={{ fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
          حزمة جديدة
        </summary>
        <form
          action={createPobAction}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 14,
            marginTop: 16,
          }}
        >
          {(
            [
              ["academic_year_id", "السنة", academicYears],
              ["term_id", "الترم", terms],
              ["publisher_id", "الناشر", publishers],
              ["stage_id", "المرحلة", stages],
              ["type_id", "النوع", types],
              ["language_id", "اللغة", languages],
              ["subject_id", "المادة", subjects],
            ] as const
          ).map(([name, label, list]) => (
            <label key={name} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>{label}</span>
              <select
                name={name}
                required
                defaultValue=""
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 9,
                  padding: "10px 12px",
                  background: "var(--surface)",
                  color: "var(--text)",
                  fontSize: 14,
                }}
              >
                <option value="" disabled>
                  اختر
                </option>
                {list.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          ))}

          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>السعر (اختياري)</span>
            <input
              type="text"
              name="price"
              inputMode="decimal"
              style={{
                border: "1px solid var(--border)",
                borderRadius: 9,
                padding: "10px 12px",
                background: "var(--surface)",
                color: "var(--text)",
                fontSize: 14,
              }}
            />
          </label>

          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button
              type="submit"
              className="heading-font"
              style={{
                background: "var(--accent)",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "10px 22px",
                fontWeight: 700,
                fontSize: 15,
                width: "100%",
              }}
            >
              حفظ الحزمة
            </button>
          </div>
        </form>
      </details>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border-soft)", borderRadius: 14, overflow: "hidden" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(200px,1.6fr) 118px 118px 96px 108px 88px 82px 110px",
            padding: "0 20px",
          }}
        >
          {["المادة", "المرحلة", "الناشر", "النوع", "اللغة", "الترم", "السنة", "السعر"].map((h, i) => (
            <div
              key={h}
              className="heading-font"
              style={{
                padding: "16px 6px",
                fontSize: 13,
                fontWeight: 700,
                color: "var(--text-muted)",
                textAlign: i === 0 ? "start" : i === 7 ? "left" : "center",
              }}
            >
              {h}
            </div>
          ))}
        </div>
        {pobs.length === 0 ? (
          <div style={{ padding: "24px 20px", fontSize: 14, color: "var(--text-muted)", borderTop: "1px solid var(--border-soft)" }}>
            لا توجد حزم مطابقة
          </div>
        ) : (
          pobs.map((p) => (
            <div
              key={p.id}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(200px,1.6fr) 118px 118px 96px 108px 88px 82px 110px",
                padding: "0 20px",
                borderTop: "1px solid var(--border-soft)",
              }}
            >
              <div style={{ padding: "15px 6px", fontSize: 15, lineHeight: 1.65, display: "flex", alignItems: "center", gap: 8 }}>
                <a href={`/pobs/${p.id}`} style={{ color: "var(--text)", fontWeight: 600 }}>
                  {p.subject?.label}
                </a>
                {!p.is_active ? <span style={inactiveBadgeStyle}>معطَّلة</span> : null}
              </div>
              <div style={{ padding: "15px 6px", fontSize: 15, textAlign: "center", color: "var(--text-muted)" }}>
                {p.stage?.label}
              </div>
              <div style={{ padding: "15px 6px", fontSize: 15, textAlign: "center", color: "var(--text-muted)" }}>
                {p.publisher?.label}
              </div>
              <div style={{ padding: "15px 6px", fontSize: 15, textAlign: "center", color: "var(--text-muted)" }}>
                {p.type?.label}
              </div>
              <div style={{ padding: "15px 6px", fontSize: 15, textAlign: "center", color: "var(--text-muted)" }}>
                {p.language?.label}
              </div>
              <div style={{ padding: "15px 6px", fontSize: 15, textAlign: "center", color: "var(--text-muted)" }}>
                {p.term?.label}
              </div>
              <div style={{ padding: "15px 6px", fontSize: 15, textAlign: "center", color: "var(--text-muted)" }}>
                {toArabicDigits(p.academic_year?.label)}
              </div>
              <div style={{ padding: "15px 6px", fontSize: 15, textAlign: "left", fontWeight: 700 }}>
                {p.price != null ? toArabicDigits(p.price.toFixed(2)) : "—"}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
