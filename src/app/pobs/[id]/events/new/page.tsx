import { notFound } from "next/navigation";
import { getPob } from "@/lib/db/pobs";
import { listComponentsForPob } from "@/lib/db/components";
import { listActions } from "@/lib/db/reference";
import { createEventAction } from "@/lib/actions/events";
import { AppHeader } from "@/components/AppHeader";
import { selectStyle, fieldLabelStyle, errorBannerStyle, primaryButtonStyle } from "@/components/formStyles";

export default async function NewEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; component_id?: string }>;
}) {
  const { id } = await params;
  const { error, component_id: preselectedComponentId } = await searchParams;

  const [pob, components, actions] = await Promise.all([getPob(id), listComponentsForPob(id), listActions()]);

  if (!pob) notFound();

  const preselected = preselectedComponentId
    ? components.find((c) => c.id === preselectedComponentId)
    : undefined;

  return (
    <div style={{ padding: "36px 48px 56px", display: "flex", flexDirection: "column", gap: 24 }}>
      <AppHeader
        title="تسجيل حدث"
        subtitle={preselected ? `${preselected.name ?? preselected.kind?.label ?? ""}` : `${pob.subject?.label ?? ""} — الحزمة كلها`}
      />

      <a href={`/pobs/${pob.id}`} style={{ fontSize: 13.5, fontWeight: 600 }}>
        → رجوع لتفاصيل الحزمة
      </a>

      {error ? <div style={errorBannerStyle}>{error}</div> : null}

      <form
        action={createEventAction}
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-soft)",
          borderRadius: 14,
          padding: "20px",
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
        }}
      >
        <input type="hidden" name="pob_id" value={pob.id} />

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={fieldLabelStyle}>على إيه؟</span>
          <select name="component_id" defaultValue={preselected?.id ?? ""} style={selectStyle}>
            <option value="">الحزمة كلها</option>
            {components.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name ?? c.kind?.label ?? c.category?.label}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={fieldLabelStyle}>الإجراء</span>
          <select name="action_id" required defaultValue="" style={selectStyle}>
            <option value="" disabled>
              اختر
            </option>
            {actions.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
                {a.requires_number ? " (برقم)" : ""}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={fieldLabelStyle}>رقم البروفة (لو الإجراء بروفة)</span>
          <input type="text" name="proof_number" inputMode="numeric" style={selectStyle} />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={fieldLabelStyle}>الميعاد المتوقع</span>
          <input type="date" name="date_expected" style={selectStyle} />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={fieldLabelStyle}>الميعاد الفعلي</span>
          <input type="date" name="date_actual" style={selectStyle} />
        </label>

        <div />

        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
          <input type="checkbox" name="is_blocked" />
          تسجيل تعطيل
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6, gridColumn: "span 2" }}>
          <span style={fieldLabelStyle}>سبب التعطيل (لو معطَّل)</span>
          <input type="text" name="block_reason" style={selectStyle} />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6, gridColumn: "span 3" }}>
          <span style={fieldLabelStyle}>ملاحظة (اختياري)</span>
          <textarea name="note" rows={2} style={{ ...selectStyle, resize: "vertical" }} />
        </label>

        <div style={{ gridColumn: "span 3" }}>
          <button type="submit" className="heading-font" style={primaryButtonStyle}>
            تسجيل الحدث
          </button>
        </div>
      </form>

      <p style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
        السجل يُضاف ولا يُعدَّل ولا يُمسح (D-02) — لو غلطت، سجّل حدثاً جديداً يصحّح الموقف.
      </p>
    </div>
  );
}
