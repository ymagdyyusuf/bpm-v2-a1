import { toArabicDigits } from "@/lib/numerals";

/** رأس التقرير — سطر واحد إلزامي فوق كل جدول: اسم التقرير · الفلاتر · تاريخ الإخراج · عدد الصفوف (شريحة ٦). */
export function ReportHeader({
  title,
  filtersText,
  rowCount,
}: {
  title: string;
  filtersText: string;
  rowCount: number;
}) {
  const outputDate = new Date().toLocaleDateString("ar-EG-u-nu-arab", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, borderBottom: "2px solid var(--text)", paddingBottom: 10 }}>
      <h1 className="heading-font" style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>
        {title}
      </h1>
      <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
        الفلاتر: {filtersText || "بلا فلاتر"} · تاريخ الإخراج: {outputDate} · عدد الصفوف: {toArabicDigits(rowCount)}
      </div>
    </div>
  );
}
