"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { Option } from "@/lib/db/reference";
import {
  REPORT_COLUMNS,
  PRINT_ORDERS_COLUMNS,
  NO_COLUMNS,
  parseColumns,
  type ReportColumnKey,
} from "@/components/ReportColumns";

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
  overdue_only: string;
  include_inactive: string;
  cols: string;
  title: string;
  shortcut: string;
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

const PROGRESS_OPTIONS = ["لم يبدأ", "جارٍ", "منتهية"] as const;

const ALL_KEYS: (keyof ReportFilterValues)[] = [
  ...SELECT_FILTERS.map((f) => f.key),
  "date_from",
  "date_to",
  "progress",
  "blocked_only",
  "overdue_only",
  "include_inactive",
  "cols",
  "title",
  "shortcut",
];

export function ReportFilterBar({
  options,
  current,
  printOrderActionId,
}: {
  options: Record<string, Option[]>;
  current: ReportFilterValues;
  /** id إجراء "أمر طبع" — لاختصار "أوامر الطبع"؛ فراغ لو الإجراء مش موجود. */
  printOrderActionId: string | undefined;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [titleDraft, setTitleDraft] = useState(current.title ?? "");
  const [isPending, startTransition] = useTransition();

  function apply(patch: Partial<Record<keyof ReportFilterValues, string>>) {
    const params = new URLSearchParams();
    for (const key of ALL_KEYS) {
      const value = key in patch ? patch[key] : current[key];
      if (value) params.set(key, value);
    }
    const url = `${pathname}?${params.toString()}`;
    startTransition(() => {
      router.push(url, { scroll: false });
    });
  }

  function toggleBoolean(key: "blocked_only" | "overdue_only" | "include_inactive") {
    apply({ [key]: current[key] === "1" ? "" : "1" });
  }

  const selectedProgress = new Set((current.progress ?? "").split(",").filter(Boolean));
  function toggleProgress(value: string) {
    const next = new Set(selectedProgress);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    apply({ progress: [...next].join(",") });
  }

  const selectedCols = parseColumns(current.cols);
  function toggleColumn(key: ReportColumnKey) {
    const next = new Set(selectedCols);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    apply({ cols: next.size > 0 ? [...next].join(",") : NO_COLUMNS });
  }

  const fieldStyle = {
    border: "1px solid var(--border)",
    borderRadius: 8,
    padding: "7px 9px",
    background: "var(--surface)",
    color: "var(--text)",
    fontSize: 13,
  };
  const labelStyle = { fontSize: 11, fontWeight: 600 as const, color: "var(--text-muted)" };

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
        gap: 14,
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>اختصارات:</span>
        <button type="button" onClick={() => apply({ progress: "لم يبدأ,جارٍ", shortcut: "المتبقية" })} style={shortcutStyle}>
          المتبقية
        </button>
        <button type="button" onClick={() => apply({ progress: "جارٍ", shortcut: "تم بدء العمل بها" })} style={shortcutStyle}>
          تم بدء العمل بها
        </button>
        <button type="button" onClick={() => apply({ overdue_only: "1", shortcut: "المتأخرة" })} style={shortcutStyle}>
          المتأخرة
        </button>
        <button type="button" onClick={() => apply({ blocked_only: "1", shortcut: "المعطّلة" })} style={shortcutStyle}>
          المعطّلة
        </button>
        <button
          type="button"
          onClick={() =>
            apply({
              ...(printOrderActionId ? { action_id: printOrderActionId } : {}),
              cols: PRINT_ORDERS_COLUMNS.join(","),
              shortcut: "أوامر الطبع",
            })
          }
          style={shortcutStyle}
        >
          أوامر الطبع
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4, maxWidth: 420 }}>
        <label style={labelStyle}>عنوان التقرير (اختياري)</label>
        <input
          type="text"
          value={titleDraft}
          onChange={(e) => setTitleDraft(e.target.value)}
          onBlur={() => apply({ title: titleDraft })}
          onKeyDown={(e) => {
            if (e.key === "Enter") apply({ title: titleDraft });
          }}
          placeholder="استخراج التقارير"
          style={fieldStyle}
        />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {SELECT_FILTERS.map((f) => (
          <div key={f.key} style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 120 }}>
            <label style={labelStyle}>{f.label}</label>
            <select value={current[f.key] ?? ""} onChange={(e) => apply({ [f.key]: e.target.value })} style={fieldStyle}>
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
          <label style={labelStyle}>من تاريخ</label>
          <input type="date" value={current.date_from ?? ""} onChange={(e) => apply({ date_from: e.target.value })} style={fieldStyle} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={labelStyle}>إلى تاريخ</label>
          <input type="date" value={current.date_to ?? ""} onChange={(e) => apply({ date_to: e.target.value })} style={fieldStyle} />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <label style={labelStyle}>حالة الإنجاز</label>
        <div style={{ display: "flex", gap: 14 }}>
          {PROGRESS_OPTIONS.map((p) => (
            <label key={p} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
              <input type="checkbox" checked={selectedProgress.has(p)} onChange={() => toggleProgress(p)} />
              {p}
            </label>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
          <input type="checkbox" checked={current.blocked_only === "1"} onChange={() => toggleBoolean("blocked_only")} />
          المعطَّل فقط
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
          <input type="checkbox" checked={current.overdue_only === "1"} onChange={() => toggleBoolean("overdue_only")} />
          متأخر فقط
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
          <input type="checkbox" checked={current.include_inactive === "1"} onChange={() => toggleBoolean("include_inactive")} />
          تشمل المعطّلة
        </label>
        <a
          href={pathname}
          onClick={(e) => {
            e.preventDefault();
            setTitleDraft("");
            startTransition(() => {
              router.push(pathname, { scroll: false });
            });
          }}
          style={{ fontSize: 12.5, fontWeight: 600 }}
        >
          مسح الفلاتر
        </a>
        {isPending ? <span style={{ fontSize: 12, color: "var(--text-muted)" }}>جارٍ التحديث…</span> : null}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={labelStyle}>الأعمدة</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {REPORT_COLUMNS.map((c) => (
            <label key={c.key} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5 }}>
              <input type="checkbox" checked={selectedCols.has(c.key)} onChange={() => toggleColumn(c.key)} />
              {c.label}
            </label>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => window.print()}
        className="heading-font"
        style={{
          alignSelf: "flex-end",
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
  );
}

const shortcutStyle = {
  background: "var(--bg)",
  border: "1px solid var(--border)",
  borderRadius: 999,
  padding: "6px 14px",
  fontSize: 12.5,
  fontWeight: 600 as const,
  color: "var(--text)",
};
