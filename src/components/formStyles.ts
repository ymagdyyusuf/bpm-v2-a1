import type { CSSProperties } from "react";

export const selectStyle: CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 9,
  padding: "10px 12px",
  background: "var(--surface)",
  color: "var(--text)",
  fontSize: 14,
};

export const fieldLabelStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "var(--text-muted)",
};

export const errorBannerStyle: CSSProperties = {
  background: "oklch(0.945 0.05 25)",
  color: "oklch(0.4 0.1 25)",
  borderRadius: 9,
  padding: "12px 16px",
  fontSize: 14,
};

export const primaryButtonStyle: CSSProperties = {
  background: "var(--accent)",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  padding: "10px 22px",
  fontWeight: 700,
  fontSize: 15,
};

export const dangerButtonStyle: CSSProperties = {
  background: "transparent",
  color: "oklch(0.45 0.12 25)",
  border: "1px solid oklch(0.8 0.06 25)",
  borderRadius: 10,
  padding: "10px 22px",
  fontWeight: 700,
  fontSize: 14,
};
