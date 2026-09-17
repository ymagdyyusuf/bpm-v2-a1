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

export const noticeBannerStyle: CSSProperties = {
  background: "oklch(0.945 0.045 150)",
  color: "oklch(0.35 0.09 150)",
  borderRadius: 9,
  padding: "12px 16px",
  fontSize: 14,
};

export const inactiveBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "3px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 600,
  background: "oklch(0.93 0.006 260)",
  color: "oklch(0.46 0.012 260)",
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

export const neutralButtonStyle: CSSProperties = {
  background: "transparent",
  color: "var(--accent)",
  border: "1px solid var(--accent)",
  borderRadius: 10,
  padding: "10px 22px",
  fontWeight: 700,
  fontSize: 14,
};
