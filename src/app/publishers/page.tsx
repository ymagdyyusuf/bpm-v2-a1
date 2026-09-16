import { listPublishers } from "@/lib/db/publishers";
import { addPublisherAction } from "@/lib/actions/publishers";
import { AppHeader } from "@/components/AppHeader";

export default async function PublishersPage() {
  const publishers = await listPublishers();

  return (
    <div style={{ padding: "40px 48px 56px", display: "flex", flexDirection: "column", gap: 22 }}>
      <AppHeader title="الناشرون" subtitle="قائمة الناشرين المرجعية" />

      <form
        action={addPublisherAction}
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-soft)",
          borderRadius: 14,
          padding: "18px 20px",
          display: "flex",
          gap: 12,
          alignItems: "flex-end",
        }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, maxWidth: 320 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>
            اسم الناشر
          </span>
          <input
            type="text"
            name="label"
            required
            style={{
              border: "1px solid var(--border)",
              borderRadius: 9,
              padding: "10px 12px",
              background: "var(--surface)",
              color: "var(--text)",
            }}
          />
        </label>
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
          }}
        >
          إضافة ناشر
        </button>
      </form>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border-soft)", borderRadius: 14, overflow: "hidden" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.8fr 140px 100px",
            padding: "0 20px",
          }}
        >
          <div className="heading-font" style={{ padding: "16px 6px", fontSize: 13, fontWeight: 700, color: "var(--text-muted)" }}>
            الاسم
          </div>
          <div className="heading-font" style={{ padding: "16px 6px", fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textAlign: "center" }}>
            الترتيب
          </div>
          <div className="heading-font" style={{ padding: "16px 6px", fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textAlign: "center" }}>
            الحالة
          </div>
        </div>
        {publishers.length === 0 ? (
          <div style={{ padding: "24px 20px", fontSize: 14, color: "var(--text-muted)", borderTop: "1px solid var(--border-soft)" }}>
            لا يوجد ناشرون بعد
          </div>
        ) : (
          publishers.map((p) => (
            <div
              key={p.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1.8fr 140px 100px",
                padding: "0 20px",
                borderTop: "1px solid var(--border-soft)",
              }}
            >
              <div style={{ padding: "15px 6px", fontSize: 15, lineHeight: 1.65 }}>{p.label}</div>
              <div style={{ padding: "15px 6px", fontSize: 15, textAlign: "center", color: "var(--text-muted)" }}>
                {p.display_order}
              </div>
              <div style={{ padding: "15px 6px", fontSize: 15, textAlign: "center", color: "var(--text-muted)" }}>
                {p.is_active ? "فعّال" : "معطَّل"}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
