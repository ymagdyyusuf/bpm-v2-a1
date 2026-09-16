import { notFound } from "next/navigation";
import { getPob } from "@/lib/db/pobs";
import { listComponentsForPob } from "@/lib/db/components";
import { listComponentCategories, listComponentKinds } from "@/lib/db/reference";
import { updateComponentAction, deleteComponentAction } from "@/lib/actions/components";
import { AppHeader } from "@/components/AppHeader";
import { selectStyle, fieldLabelStyle, errorBannerStyle, primaryButtonStyle, dangerButtonStyle } from "@/components/formStyles";

export default async function EditComponentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; componentId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id, componentId } = await params;
  const { error } = await searchParams;

  const [pob, components, categories, kinds] = await Promise.all([
    getPob(id),
    listComponentsForPob(id),
    listComponentCategories(),
    listComponentKinds(),
  ]);

  if (!pob) notFound();
  const component = components.find((c) => c.id === componentId);
  if (!component) notFound();

  return (
    <div style={{ padding: "36px 48px 56px", display: "flex", flexDirection: "column", gap: 24 }}>
      <AppHeader title="تعديل مكوّن" subtitle={`${pob.subject?.label ?? ""} — ${pob.stage?.label ?? ""}`} />

      <a href={`/pobs/${pob.id}`} style={{ fontSize: 13.5, fontWeight: 600 }}>
        → رجوع لتفاصيل الحزمة
      </a>

      {error ? <div style={errorBannerStyle}>{error}</div> : null}

      <form
        action={updateComponentAction}
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
        <input type="hidden" name="component_id" value={component.id} />

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={fieldLabelStyle}>الفئة</span>
          <select name="category_id" required defaultValue={component.category_id} style={selectStyle}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={fieldLabelStyle}>النوع</span>
          <select name="kind_id" required defaultValue={component.kind_id} style={selectStyle}>
            {kinds.map((k) => (
              <option key={k.id} value={k.id}>
                {k.label}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={fieldLabelStyle}>الاسم (اختياري)</span>
          <input type="text" name="name" defaultValue={component.name ?? ""} style={selectStyle} />
        </label>

        <div />

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={fieldLabelStyle}>الطول (سم)</span>
          <input
            type="text"
            name="page_height_cm"
            inputMode="decimal"
            defaultValue={component.page_height_cm ?? ""}
            style={selectStyle}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={fieldLabelStyle}>العرض (سم)</span>
          <input
            type="text"
            name="page_width_cm"
            inputMode="decimal"
            defaultValue={component.page_width_cm ?? ""}
            style={selectStyle}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={fieldLabelStyle}>الصفحات</span>
          <input
            type="text"
            name="page_count"
            inputMode="numeric"
            defaultValue={component.page_count ?? ""}
            style={selectStyle}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={fieldLabelStyle}>الألوان</span>
          <input type="text" name="colors" defaultValue={component.colors ?? ""} style={selectStyle} />
        </label>

        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <button type="submit" className="heading-font" style={{ ...primaryButtonStyle, width: "100%" }}>
            حفظ التعديل
          </button>
        </div>
      </form>

      <p style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
        مكوّن فئته &quot;هدية&quot; يُحفظ باسمه فقط — أي مقاس أو صفحات أو ألوان تُهمَل تلقائياً.
      </p>

      <form
        action={deleteComponentAction}
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-soft)",
          borderRadius: 14,
          padding: "18px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <input type="hidden" name="pob_id" value={pob.id} />
        <input type="hidden" name="component_id" value={component.id} />
        <p style={{ margin: 0, fontSize: 13.5, color: "var(--text-muted)" }}>
          لو المكوّن بلا أحداث هيتحذف نهائياً، وغير كده هيتعطّل تلقائياً بدل الحذف.
        </p>
        <button type="submit" className="heading-font" style={dangerButtonStyle}>
          حذف المكوّن
        </button>
      </form>
    </div>
  );
}
