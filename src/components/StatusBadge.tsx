import type { ComponentStatus } from "@/lib/events";

export const STATUS_STYLE: Record<ComponentStatus["progress"], { bg: string; text: string }> = {
  "لم يبدأ": { bg: "oklch(0.93 0.006 260)", text: "oklch(0.40 0.012 260)" },
  "جارٍ": { bg: "oklch(0.945 0.05 78)", text: "oklch(0.38 0.095 68)" },
  "منتهية": { bg: "oklch(0.935 0.045 150)", text: "oklch(0.35 0.09 150)" },
};

export function StatusBadge({ status }: { status: ComponentStatus }) {
  const s = STATUS_STYLE[status.progress];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "4px 10px",
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 600,
          background: s.bg,
          color: s.text,
        }}
      >
        {status.progress}
      </span>
      {status.isBlocked ? (
        <span style={{ fontSize: 11.5, fontWeight: 600, color: "oklch(0.45 0.12 25)", textAlign: "center", lineHeight: 1.4 }}>
          معطَّل: {status.blockReason}
        </span>
      ) : null}
    </div>
  );
}
