"use client";

import { useRouter, usePathname } from "next/navigation";
import type { Option } from "@/lib/db/reference";

export type ReportFilterValues = Partial<{
  academic_year_id: string;
  term_id: string;
  publisher_id: string;
  stage_id: string;
  type_id: string;
  language_id: string;
  subject_id: string;
  category_id: string;
  kind_id: string;
  action_id: string;
  date_from: string;
  date_to: string;
  progress: string;
  blocked_only: string;
  include_inactive: string;
}>;

const SELECT_FILTERS: { key: keyof ReportFilterValues; label: string }[] = [
  { key: "academic_year_id", label: "السنة" },
  { key: "term_id", label: "الترم" },
  { key: "publisher_id", label: "الناشر" },
  { key: "stage_id", label: "المرحلة" },
  { key: "type_id", label: "النوع" },
  { key: "language_id", label: "اللغة" },
  { key: "subject_id", label: "المادة" },
  { key: "category_id", label: "الفئة" },
  { key: "kind_id", label: "النوع الفرعي" },
  { key: "action_id", label: "الإجراء" },
];

const PROGRESS_OPTIONS = ["لم يبدأ", "جارٍ", "منتهية"];

export function ReportFilterBar({
  options,
  current,
}: {
  options: Record<string, Option[]>;
  current: ReportFilterValues;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function update(key: string, value: string) {
    const params = new URLSearchParams();
    for (const f of SELECT_FILTERS) {
      const v = f.key === key ? value : current[f.key];
      if (v) params.set(f.key, v);
    }
    for (const k of ["date_from", "date_to", "progress"] as const) {
      const v = k === key ? value : current[k];
      if (v) params.set(k, v);
    }
    for (const k of ["blocked_only", "include_inactive"] as const) {
      const v = k === key ? value : current[k];
      if (v === "1") params.set(k, "1");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function toggle(key: "blocked_only" | "include_inactive") {
    update(key, current[key] === "1" ? "" : "1");
  }

  return (
    <div
      className="no-print"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border-soft)",
        borderRadius: 14,
        padding: "16px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {SELECT_FILTERS.map((f) => (
          <div key={f.key} style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 120 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)" }}>{f.label}</label>
            <select
              value={current[f.key] ?? ""}
              onChange={(e) => update(f.key, e.target.value)}
              style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "7px 9px", background: "var(--surface)", color: "var(--text)", fontSize: 13 }}
            >
              <option value="">الكل</option>
              {(options[f.key] ?? []).map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)" }}>من تاريخ</label>
          <input
            type="date"
            value={current.date_from ?? ""}
            onChange={(e) => update("date_from", e.target.value)}
            style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "7px 9px", background: "var(--surface)", color: "var(--text)", fontSize: 13 }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)" }}>إلى تاريخ</label>
          <input
            type="date"
            value={current.date_to ?? ""}
            onChange={(e) => update("date_to", e.target.value)}
            style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "7px 9px", background: "var(--surface)", color: "var(--text)", fontSize: 13 }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)" }}>حالة الإنجاز</label>
          <select
            value={current.progress ?? ""}
            onChange={(e) => update("progress", e.target.value)}
            style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "7px 9px", background: "var(--surface)", color: "var(--text)", fontSize: 13 }}
          >
            <option value="">الكل</option>
            {PROGRESS_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
          <input type="checkbox" checked={current.blocked_only === "1"} onChange={() => toggle("blocked_only")} />
          المعطَّل فقط
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
          <input
            type="checkbox"
            checked={current.include_inactive === "1"}
            onChange={() => toggle("include_inactive")}
          />
          تشمل المعطّلة
        </label>
        <a
          href={pathname}
          onClick={(e) => {
            e.preventDefault();
            router.push(pathname);
          }}
          style={{ fontSize: 12.5, fontWeight: 600 }}
        >
          مسح الفلاتر
        </a>
        <button
          type="button"
          onClick={() => window.print()}
          className="heading-font"
          style={{
            marginInlineStart: "auto",
            background: "var(--accent)",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "8px 18px",
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          طباعة
        </button>
      </div>
    </div>
  );
}
