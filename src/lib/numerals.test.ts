import { describe, expect, it } from "vitest";
import { toArabicDigits } from "./numerals";

describe("toArabicDigits", () => {
  it("الحالة العادية: رقم عشري يتحول بأرقامه وفاصلته", () => {
    expect(toArabicDigits(150.5)).toBe("١٥٠٫٥");
    expect(toArabicDigits("2026")).toBe("٢٠٢٦");
  });

  it("حالة الحد: صفر يتحول، ونص مختلط يحول أرقامه فقط", () => {
    expect(toArabicDigits(0)).toBe("٠");
    expect(toArabicDigits("٣ إعدادي")).toBe("٣ إعدادي");
  });

  it("حالة الفراغ: null أو undefined يُرجعان سلسلة فارغة", () => {
    expect(toArabicDigits(null)).toBe("");
    expect(toArabicDigits(undefined)).toBe("");
  });
});
