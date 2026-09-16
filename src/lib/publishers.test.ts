import { describe, expect, it } from "vitest";
import { normalizePublisherLabel } from "./publishers";

describe("normalizePublisherLabel", () => {
  it("الحالة العادية: تُرجع الاسم بعد إزالة المسافات الطرفية", () => {
    expect(normalizePublisherLabel("  الامتحان  ")).toBe("الامتحان");
  });

  it("حالة الحد: مسافات فقط تُعامل كفراغ وتُرفض", () => {
    expect(() => normalizePublisherLabel("   ")).toThrow("اسم الناشر مطلوب");
  });

  it("حالة الفراغ: سلسلة فارغة تُرفض", () => {
    expect(() => normalizePublisherLabel("")).toThrow("اسم الناشر مطلوب");
  });
});
