import { describe, expect, it } from "vitest";
import { parseOptionalNonNegativeInt, parseOptionalNonNegativeDecimal } from "./components";

describe("parseOptionalNonNegativeInt", () => {
  it("الحالة العادية: رقم صحيح موجب يُقبل", () => {
    expect(parseOptionalNonNegativeInt("176", "الصفحات")).toBe(176);
  });

  it("رقم بأرقام عربية (٠-٩) يُقبل ويتحول صحيحاً — الواجهة كلها تعرض عربي", () => {
    expect(parseOptionalNonNegativeInt("١٧٦", "الصفحات")).toBe(176);
  });

  it("حالة الحد: صفر مقبول، وسالب وكسور تُرفض مع ذكر اسم الخانة", () => {
    expect(parseOptionalNonNegativeInt("0", "الصفحات")).toBe(0);
    expect(() => parseOptionalNonNegativeInt("-1", "الصفحات")).toThrow("الصفحات:");
    expect(() => parseOptionalNonNegativeInt("1.5", "الصفحات")).toThrow("الصفحات:");
  });

  it("حالة الفراغ: سلسلة فارغة تُرجع null", () => {
    expect(parseOptionalNonNegativeInt("", "الصفحات")).toBeNull();
    expect(parseOptionalNonNegativeInt("   ", "الصفحات")).toBeNull();
  });
});

describe("parseOptionalNonNegativeDecimal", () => {
  it("الحالة العادية: رقم عشري موجب يُقبل", () => {
    expect(parseOptionalNonNegativeDecimal("28.1", "الطول")).toBe(28.1);
  });

  it("حالة الحد: صفر مقبول، وسالب يُرفض مع ذكر اسم الخانة", () => {
    expect(parseOptionalNonNegativeDecimal("0", "الطول")).toBe(0);
    expect(() => parseOptionalNonNegativeDecimal("-1", "الطول")).toThrow("الطول:");
  });

  it("حالة الفراغ: سلسلة فارغة تُرجع null", () => {
    expect(parseOptionalNonNegativeDecimal("", "الطول")).toBeNull();
  });
});
