"use client";

import { useRouter, usePathname } from "next/navigation";
import type { Option } from "@/lib/db/reference";

type FilterKey =
  | "academic_year_id"
  | "term_id"
  | "publisher_id"
  | "stage_id"
  | "type_id"
  | "language_id"
  | "subject_id";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "academic_year_id", label: "السنة" },
  { key: "term_id", label: "الترم" },
  { key: "publisher_id", label: "الناشر" },
  { key: "stage_id", label: "المرحلة" },
  { key: "type_id", label: "النوع" },
  { key: "language_id", label: "اللغة" },
  { key: "subject_id", label: "المادة" },
];

export function PobsFilterBar({
  options,
  current,
}: {
  options: Record<FilterKey, Option[]>;
  current: Partial<Record<FilterKey, string>>;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function updateFilter(key: FilterKey, value: string) {
    const params = new URLSearchParams();
    for (const f of FILTERS) {
      const v = f.key === key ? value : current[f.key];
      if (v) params.set(f.key, v);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  const hasFilters = FILTERS.some((f) => current[f.key]);

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border-soft)",
        borderRadius: 14,
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        {FILTERS.map((f) => (
          <div key={f.key} style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 140 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>{f.label}</label>
            <select
              value={current[f.key] ?? ""}
              onChange={(e) => updateFilter(f.key, e.target.value)}
              style={{
                border: "1px solid var(--border)",
                borderRadius: 9,
                padding: "10px 12px",
                background: "var(--surface)",
                color: "var(--text)",
                fontSize: 14,
              }}
            >
              <option value="">الكل</option>
              {options[f.key].map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      {hasFilters ? (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <a
            href={pathname}
            style={{ fontSize: 13, fontWeight: 600 }}
            onClick={(e) => {
              e.preventDefault();
              router.push(pathname);
            }}
          >
            مسح الفلاتر
          </a>
        </div>
      ) : null}
    </div>
  );
}
