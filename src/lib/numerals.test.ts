import { describe, expect, it } from "vitest";
import { toArabicDigits, normalizeDigitsForParsing } from "./numerals";

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

describe("normalizeDigitsForParsing", () => {
  it("الحالة العادية: أرقام عربية وفاصلتها تتحول لإنجليزية", () => {
    expect(normalizeDigitsForParsing("١٧٦")).toBe("176");
    expect(normalizeDigitsForParsing("١٥٠٫٥")).toBe("150.5");
  });

  it("حالة الحد: نص مختلط أرقام عربية وإنجليزية معاً", () => {
    expect(normalizeDigitsForParsing("١٧6")).toBe("176");
  });

  it("حالة الفراغ: نص بلا أرقام يمر بلا تغيير", () => {
    expect(normalizeDigitsForParsing("")).toBe("");
  });
});
