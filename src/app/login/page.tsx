import { signInAction } from "@/lib/actions/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

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
      <form
        action={signInAction}
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-soft)",
          borderRadius: 14,
          padding: "32px 28px",
          width: "100%",
          maxWidth: 360,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <h1 className="heading-font" style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>
          تسجيل الدخول
        </h1>
        <p style={{ margin: 0, fontSize: 13.5, color: "var(--text-muted)" }}>
          نظام إدارة حزم الكتب
        </p>

        {error ? (
          <div
            style={{
              background: "oklch(0.945 0.05 25)",
              color: "oklch(0.4 0.1 25)",
              borderRadius: 9,
              padding: "10px 12px",
              fontSize: 13.5,
            }}
          >
            {error}
          </div>
        ) : null}

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>
            البريد الإلكتروني
          </span>
          <input
            type="email"
            name="email"
            required
            autoFocus
            style={{
              border: "1px solid var(--border)",
              borderRadius: 9,
              padding: "10px 12px",
              background: "var(--surface)",
              color: "var(--text)",
            }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>
            كلمة المرور
          </span>
          <input
            type="password"
            name="password"
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
          style={{
            background: "var(--accent)",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "12px 20px",
            fontWeight: 700,
            fontSize: 15,
          }}
          className="heading-font"
        >
          دخول
        </button>
      </form>
    </div>
  );
}
