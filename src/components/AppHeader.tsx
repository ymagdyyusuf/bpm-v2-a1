import { signOutAction } from "@/lib/actions/auth";

export function AppHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <h1 className="heading-font" style={{ margin: 0, fontSize: 26, fontWeight: 800 }}>
          {title}
        </h1>
        <div style={{ fontSize: 14, color: "var(--text-muted)" }}>{subtitle}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <nav style={{ display: "flex", gap: 14, fontSize: 14, fontWeight: 600 }}>
          <a href="/">الحزم</a>
          <a href="/publishers">الناشرون</a>
          <a href="/reports">استخراج التقارير</a>
        </nav>
        <form action={signOutAction}>
          <button
            type="submit"
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: 9,
              padding: "9px 16px",
              fontSize: 13.5,
              color: "var(--text-muted)",
            }}
          >
            تسجيل الخروج
          </button>
        </form>
      </div>
    </div>
  );
}
