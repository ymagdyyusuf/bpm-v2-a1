import { notFound } from "next/navigation";
import { getPob } from "@/lib/db/pobs";
import { listComponentsForPob } from "@/lib/db/components";
import { listComponentCategories, listComponentKinds } from "@/lib/db/reference";
import { getPobStatuses } from "@/lib/db/events";
import type { ComponentStatus } from "@/lib/events";
import { StatusBadge } from "@/components/StatusBadge";
import { createComponentAction } from "@/lib/actions/components";
import { toArabicDigits } from "@/lib/numerals";
import { AppHeader } from "@/components/AppHeader";
import { selectStyle, fieldLabelStyle, errorBannerStyle, noticeBannerStyle, inactiveBadgeStyle } from "@/components/formStyles";

function IdentityField({ label, value }: { label: string; value?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={fieldLabelStyle}>{label}</span>
      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: 9,
          padding: "11px 13px",
          background: "var(--surface)",
          fontSize: 14.5,
          fontWeight: 600,
        }}
      >
        {value ?? "—"}
      </div>
    </div>
  );
}

export default async function PobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { id } = await params;
  const { error, notice } = await searchParams;

  const [pob, components, categories, kinds] = await Promise.all([
    getPob(id),
    listComponentsForPob(id),
    listComponentCategories(),
    listComponentKinds(),
  ]);

  if (!pob) notFound();

  const statuses = await getPobStatuses(id, components.map((c) => c.id));

  return (
    <div style={{ padding: "36px 48px 56px", display: "flex", flexDirection: "column", gap: 24 }}>
      <AppHeader title={`${pob.subject?.label ?? ""} — ${pob.stage?.label ?? ""}`} subtitle="تفاصيل الحزمة" />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <a href="/" style={{ fontSize: 13.5, fontWeight: 600 }}>
            → رجوع لقائمة الحزم
          </a>
          {!pob.is_active ? <span style={inactiveBadgeStyle}>معطَّلة</span> : null}
          <StatusBadge status={statuses.pob} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <a href={`/pobs/${pob.id}/events/new`} style={{ fontSize: 13.5, fontWeight: 600 }}>
            تسجيل حدث على الحزمة كلها
          </a>
          <a href={`/pobs/${pob.id}/edit`} style={{ fontSize: 13.5, fontWeight: 600 }}>
            تعديل بيانات الحزمة أو حذفها
          </a>
        </div>
      </div>

      {error ? <div style={errorBannerStyle}>{error}</div> : null}
      {notice ? <div style={noticeBannerStyle}>{notice}</div> : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 14 }}>
        <IdentityField label="السنة" value={toArabicDigits(pob.academic_year?.label)} />
        <IdentityField label="الترم" value={pob.term?.label} />
        <IdentityField label="الناشر" value={pob.publisher?.label} />
        <IdentityField label="المرحلة" value={pob.stage?.label} />
        <IdentityField label="النوع" value={pob.type?.label} />
        <IdentityField label="اللغة" value={pob.language?.label} />
        <IdentityField label="المادة" value={pob.subject?.label} />
      </div>

      <details
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-soft)",
          borderRadius: 14,
          padding: "16px 20px",
        }}
      >
        <summary className="heading-font" style={{ fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
          مكوّن جديد
        </summary>
        <form
          action={createComponentAction}
          style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginTop: 16 }}
        >
          <input type="hidden" name="pob_id" value={pob.id} />

          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={fieldLabelStyle}>الفئة</span>
            <select name="category_id" required defaultValue="" style={selectStyle}>
              <option value="" disabled>
                اختر
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={fieldLabelStyle}>النوع</span>
            <select name="kind_id" required defaultValue="" style={selectStyle}>
              <option value="" disabled>
                اختر
              </option>
              {kinds.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.label}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={fieldLabelStyle}>الاسم (اختياري)</span>
            <input type="text" name="name" style={selectStyle} />
          </label>

          <div />

          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={fieldLabelStyle}>الطول (سم)</span>
            <input type="text" name="page_height_cm" inputMode="decimal" style={selectStyle} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={fieldLabelStyle}>العرض (سم)</span>
            <input type="text" name="page_width_cm" inputMode="decimal" style={selectStyle} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={fieldLabelStyle}>الصفحات</span>
            <input type="text" name="page_count" inputMode="numeric" style={selectStyle} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={fieldLabelStyle}>الألوان</span>
            <input type="text" name="colors" placeholder="مثال: ٤ ألوان" style={selectStyle} />
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
              إضافة المكوّن
            </button>
          </div>
        </form>
        <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 8 }}>
          مكوّن فئته &quot;هدية&quot; يُحفظ باسمه فقط — أي مقاس أو صفحات أو ألوان تُهمَل تلقائياً.
        </p>
      </details>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 className="heading-font" style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>
          مكوّنات الحزمة
        </h2>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border-soft)", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "90px 100px minmax(160px,2fr) 110px 70px 90px 110px 150px", padding: "0 20px" }}>
            {["الفئة", "النوع", "الاسم", "مقاس الصفحة", "الصفحات", "الألوان", "الموقف", ""].map((h) => (
              <div
                key={h}
                className="heading-font"
                style={{ padding: "16px 6px", fontSize: 13, fontWeight: 700, color: "var(--text-muted)" }}
              >
                {h}
              </div>
            ))}
          </div>
          {components.length === 0 ? (
            <div style={{ padding: "24px 20px", fontSize: 14, color: "var(--text-muted)", borderTop: "1px solid var(--border-soft)" }}>
              لا يوجد مكوّنات بعد
            </div>
          ) : (
            components.map((c) => {
              const size =
                c.page_height_cm != null && c.page_width_cm != null
                  ? `${toArabicDigits(c.page_height_cm)} × ${toArabicDigits(c.page_width_cm)}`
                  : "—";
              const status: ComponentStatus = statuses.components[c.id] ?? {
                progress: "لم يبدأ",
                isBlocked: false,
                blockReason: null,
                lastAction: null,
              };
              return (
                <div
                  key={c.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "90px 100px minmax(160px,2fr) 110px 70px 90px 110px 150px",
                    padding: "0 20px",
                    borderTop: "1px solid var(--border-soft)",
                  }}
                >
                  <div style={{ padding: "12px 6px", display: "flex", alignItems: "center", fontSize: 14 }}>
                    {c.category?.label}
                  </div>
                  <div style={{ padding: "12px 6px", display: "flex", alignItems: "center", fontSize: 14, color: "var(--text-muted)" }}>
                    {c.kind?.label}
                  </div>
                  <div style={{ padding: "12px 6px", display: "flex", alignItems: "center", fontSize: 15, lineHeight: 1.65 }}>
                    {c.name ?? "—"}
                  </div>
                  <div style={{ padding: "12px 6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "var(--text-muted)" }}>
                    {size}
                  </div>
                  <div style={{ padding: "12px 6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14.5, fontWeight: 600 }}>
                    {toArabicDigits(c.page_count)}
                  </div>
                  <div style={{ padding: "12px 6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "var(--text-muted)" }}>
                    {c.colors ?? "—"}
                  </div>
                  <div style={{ padding: "12px 6px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <StatusBadge status={status} />
                  </div>
                  <div style={{ padding: "12px 6px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
                    <a href={`/pobs/${pob.id}/events/new?component_id=${c.id}`} style={{ fontSize: 12.5, fontWeight: 600 }}>
                      تسجيل حدث
                    </a>
                    <a href={`/pobs/${pob.id}/components/${c.id}/edit`} style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-muted)" }}>
                      تعديل / حذف
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
