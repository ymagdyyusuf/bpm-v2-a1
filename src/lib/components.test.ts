import { describe, expect, it } from "vitest";
import { parseOptionalNonNegativeInt } from "./components";

describe("parseOptionalNonNegativeInt", () => {
  it("الحالة العادية: رقم صحيح موجب يُقبل", () => {
    expect(parseOptionalNonNegativeInt("176")).toBe(176);
  });

  it("حالة الحد: صفر مقبول، وسالب وكسور تُرفض", () => {
    expect(parseOptionalNonNegativeInt("0")).toBe(0);
    expect(() => parseOptionalNonNegativeInt("-1")).toThrow();
    expect(() => parseOptionalNonNegativeInt("1.5")).toThrow();
  });

  it("حالة الفراغ: سلسلة فارغة تُرجع null", () => {
    expect(parseOptionalNonNegativeInt("")).toBeNull();
    expect(parseOptionalNonNegativeInt("   ")).toBeNull();
  });
});
