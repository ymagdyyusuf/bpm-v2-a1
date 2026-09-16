import { describe, expect, it } from "vitest";
import { parsePobPrice } from "./pobs";

describe("parsePobPrice", () => {
  it("الحالة العادية: رقم عشري صحيح يُقبل", () => {
    expect(parsePobPrice("199.50")).toBe(199.5);
  });

  it("حالة الحد: صفر مقبول، وسالب يُرفض", () => {
    expect(parsePobPrice("0")).toBe(0);
    expect(() => parsePobPrice("-1")).toThrow("السعر يجب أن يكون رقماً موجباً أو فارغاً");
  });

  it("حالة الفراغ: سلسلة فارغة تُرجع null (بلا سعر)", () => {
    expect(parsePobPrice("")).toBeNull();
    expect(parsePobPrice("   ")).toBeNull();
  });
});
