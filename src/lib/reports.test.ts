import { describe, expect, it } from "vitest";
import { isOverdue, daysSinceLastEvent, computeRowVisibility } from "./reports";
import type { ComponentStatus } from "./events";

function status(overrides: Partial<ComponentStatus> = {}): ComponentStatus {
  return {
    progress: "جارٍ",
    isBlocked: false,
    blockReason: null,
    lastAction: "دخول",
    lastProofNumber: null,
    lastDateExpected: null,
    lastDateActual: null,
    ...overrides,
  };
}

describe("isOverdue", () => {
  it("الحالة العادية: ميعاد متوقع مضى وبلا فعلي → متأخر", () => {
    expect(isOverdue(status({ lastDateExpected: "2026-09-01" }), "2026-09-17")).toBe(true);
  });

  it("حالة الحد: ميعاد متوقع اليوم بالظبط → ليس متأخراً (لسه ما فاتش)", () => {
    expect(isOverdue(status({ lastDateExpected: "2026-09-17" }), "2026-09-17")).toBe(false);
  });

  it("حالة الفراغ: بلا ميعاد متوقع أصلاً → ليس متأخراً", () => {
    expect(isOverdue(status({}), "2026-09-17")).toBe(false);
  });

  it("ميعاد متوقع مضى لكن معه ميعاد فعلي → ليس متأخراً (حصل فعلاً)", () => {
    expect(isOverdue(status({ lastDateExpected: "2026-09-01", lastDateActual: "2026-09-05" }), "2026-09-17")).toBe(
      false
    );
  });
});

describe("daysSinceLastEvent", () => {
  it("الحالة العادية: فرق أيام صحيح من الميعاد الفعلي إن وُجد", () => {
    expect(daysSinceLastEvent(status({ lastDateActual: "2026-09-10" }), "2026-09-17")).toBe(7);
  });

  it("حالة الحد: نفس اليوم → صفر", () => {
    expect(daysSinceLastEvent(status({ lastDateActual: "2026-09-17" }), "2026-09-17")).toBe(0);
  });

  it("حالة الفراغ: بلا أي تاريخ → null", () => {
    expect(daysSinceLastEvent(status({}), "2026-09-17")).toBeNull();
  });
});

describe("computeRowVisibility", () => {
  it("الحالة العادية: مرحلة وحزمة متكرّرتان في صفوف متتالية → تُخفَيان من الثاني", () => {
    const result = computeRowVisibility([
      { stageLabel: "أولى ابتدائي", pobLabel: "الرياضيات" },
      { stageLabel: "أولى ابتدائي", pobLabel: "الرياضيات" },
      { stageLabel: "أولى ابتدائي", pobLabel: "الرياضيات" },
    ]);
    expect(result).toEqual([
      { showStage: true, showPob: true },
      { showStage: false, showPob: false },
      { showStage: false, showPob: false },
    ]);
  });

  it("حالة الحد: نفس المرحلة وحزمة جديدة → المرحلة تُخفى والحزمة تظهر؛ وتغيّر المرحلة يُظهر الاثنين حتى لو تطابق نص الحزمة", () => {
    const result = computeRowVisibility([
      { stageLabel: "أولى ابتدائي", pobLabel: "الرياضيات" },
      { stageLabel: "أولى ابتدائي", pobLabel: "العلوم" },
      { stageLabel: "تانية ابتدائي", pobLabel: "العلوم" },
    ]);
    expect(result).toEqual([
      { showStage: true, showPob: true },
      { showStage: false, showPob: true },
      { showStage: true, showPob: true },
    ]);
  });

  it("حالة الفراغ: بلا صفوف → مصفوفة فاضية", () => {
    expect(computeRowVisibility([])).toEqual([]);
  });
});
