import { describe, expect, it } from "vitest";
import { parseColumns, DEFAULT_COLUMNS } from "./ReportColumns";

describe("parseColumns", () => {
  it("الحالة العادية: قائمة مفاتيح مفصولة بفاصلة → مجموعة منها", () => {
    expect(parseColumns("price,size")).toEqual(new Set(["price", "size"]));
  });

  it("حالة الحد: cols غائب من الرابط أصلاً → الأعمدة الافتراضية (لا صفر)", () => {
    expect(parseColumns(undefined)).toEqual(new Set(DEFAULT_COLUMNS));
  });

  it("حالة الفراغ: cols=none (صفر أعمدة مختارة عمداً) → مجموعة فاضية، لا الافتراضية", () => {
    expect(parseColumns("none")).toEqual(new Set());
  });
});
