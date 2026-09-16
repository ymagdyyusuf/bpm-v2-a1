import { signOutAction } from "@/lib/actions/auth";

export default function InactivePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-soft)",
          borderRadius: 14,
          padding: "32px 28px",
          maxWidth: 380,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <h1 className="heading-font" style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>
          حسابك لم يُفعَّل بعد
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>
          تواصل مع مسؤول النظام لتفعيل حسابك.
        </p>
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
