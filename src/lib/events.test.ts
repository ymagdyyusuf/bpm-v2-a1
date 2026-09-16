import { describe, expect, it } from "vitest";
import { resolveEventInput, computeStatus, computeComponentStatus, type EventFormInput, type EventForStatus } from "./events";

function baseInput(overrides: Partial<EventFormInput> = {}): EventFormInput {
  return {
    actionRequiresNumber: false,
    proofNumber: "",
    dateExpected: "",
    dateActual: "",
    isBlocked: false,
    blockReason: "",
    ...overrides,
  };
}

describe("resolveEventInput — رقم البروفة", () => {
  it("الحالة العادية: إجراء يتطلب رقماً ومُعطى → يُقبل", () => {
    const result = resolveEventInput(
      baseInput({ actionRequiresNumber: true, proofNumber: "1", dateExpected: "2026-09-17" })
    );
    expect(result.proofNumber).toBe(1);
  });

  it("حالة الحد: إجراء يتطلب رقماً ومُعطى بأرقام عربية → يتحول صحيحاً", () => {
    const result = resolveEventInput(
      baseInput({ actionRequiresNumber: true, proofNumber: "٢", dateExpected: "2026-09-17" })
    );
    expect(result.proofNumber).toBe(2);
  });

  it("حالة الفراغ: إجراء يتطلب رقماً بلا رقم → يُرفض", () => {
    expect(() =>
      resolveEventInput(baseInput({ actionRequiresNumber: true, dateExpected: "2026-09-17" }))
    ).toThrow("رقم البروفة:");
  });
});

describe("resolveEventInput — سبب التعطيل", () => {
  it("الحالة العادية: معطَّل بسبب مكتوب → يُقبل", () => {
    const result = resolveEventInput(
      baseInput({ isBlocked: true, blockReason: "متوقف على كتاب الوزارة", dateExpected: "2026-09-17" })
    );
    expect(result.blockReason).toBe("متوقف على كتاب الوزارة");
  });

  it("حالة الحد: معطَّل بسبب كله مسافات → يُعامل كفراغ ويُرفض", () => {
    expect(() =>
      resolveEventInput(baseInput({ isBlocked: true, blockReason: "   ", dateExpected: "2026-09-17" }))
    ).toThrow("سبب التعطيل:");
  });

  it("حالة الفراغ: غير معطَّل بلا سبب → يمر بلا اعتراض", () => {
    const result = resolveEventInput(baseInput({ dateExpected: "2026-09-17" }));
    expect(result.blockReason).toBeNull();
  });
});

describe("resolveEventInput — D-29 تاريخ افتراضي", () => {
  it("الحالة العادية: ميعاد متوقع بلا فعلي → يبقيان كما هما", () => {
    const result = resolveEventInput(baseInput({ dateExpected: "2026-09-17" }));
    expect(result.dateExpected).toBe("2026-09-17");
    expect(result.dateActual).toBeNull();
  });

  it("حالة الحد: ميعاد فعلي بلا متوقع → يبقى كما هو من غير افتراض", () => {
    const result = resolveEventInput(baseInput({ dateActual: "2026-09-10" }));
    expect(result.dateActual).toBe("2026-09-10");
    expect(result.dateExpected).toBeNull();
  });

  it("حالة الفراغ: الاتنين فاضيين → date_actual يفترض اليوم", () => {
    const result = resolveEventInput(baseInput());
    expect(result.dateActual).toBe(new Date().toISOString().slice(0, 10));
  });
});

describe("computeStatus", () => {
  const blocked: EventForStatus = {
    action_label: "تعديلات",
    action_is_terminal: false,
    date_expected: "2026-09-01",
    date_actual: null,
    created_at: "2026-09-01T10:00:00Z",
    is_blocked: true,
    block_reason: "متوقف على المراجعة",
  };
  const unblockedLater: EventForStatus = {
    action_label: "دخول",
    action_is_terminal: false,
    date_expected: null,
    date_actual: "2026-09-05",
    created_at: "2026-09-05T10:00:00Z",
    is_blocked: false,
    block_reason: null,
  };
  const finished: EventForStatus = {
    action_label: "تم الانتهاء",
    action_is_terminal: true,
    date_expected: null,
    date_actual: "2026-09-10",
    created_at: "2026-09-10T10:00:00Z",
    is_blocked: false,
    block_reason: null,
  };

  it("الحالة العادية: آخر حدث بروفة بميعاد متوقع بلا فعلي → جارٍ", () => {
    const proof: EventForStatus = {
      action_label: "بروفة",
      action_is_terminal: false,
      date_expected: "2026-09-17",
      date_actual: null,
      created_at: "2026-09-17T09:00:00Z",
      is_blocked: false,
      block_reason: null,
    };
    expect(computeStatus([proof]).progress).toBe("جارٍ");
  });

  it("حالة الحد: حدث معطِّل ثم حدث أحدث غير معطِّل → يفكّ التعطيل، وآخر حدث تم الانتهاء → منتهية", () => {
    const status = computeStatus([blocked, unblockedLater, finished]);
    expect(status.progress).toBe("منتهية");
    expect(status.isBlocked).toBe(false);
  });

  it("حالة الفراغ: بلا أحداث → لم يبدأ وغير معطَّل", () => {
    const status = computeStatus([]);
    expect(status.progress).toBe("لم يبدأ");
    expect(status.isBlocked).toBe(false);
  });
});

describe("computeStatus — الربط بالمعرّف لا بالاسم (معيار الكود #٤)", () => {
  it("إعادة تسمية إجراء 'تم الانتهاء' لا تغيّر الموقف — العلم هو الحاكم، لا النص", () => {
    const renamedButTerminal: EventForStatus = {
      action_label: "الإجراء اتغيّر اسمه من الشاشة",
      action_is_terminal: true,
      date_expected: null,
      date_actual: "2026-09-17",
      created_at: "2026-09-17T09:00:00Z",
      is_blocked: false,
      block_reason: null,
    };
    expect(computeStatus([renamedButTerminal]).progress).toBe("منتهية");
  });

  it("إجراء باسم يشبه 'تم الانتهاء' لكن علمه غير مُنهٍ → جارٍ لا منتهية", () => {
    const lookalikeNotTerminal: EventForStatus = {
      action_label: "تم الانتهاء", // نص مطابق تماماً، بالمصادفة أو بغلطة إدخال — لازم يتجاهله
      action_is_terminal: false,
      date_expected: null,
      date_actual: "2026-09-17",
      created_at: "2026-09-17T09:00:00Z",
      is_blocked: false,
      block_reason: null,
    };
    expect(computeStatus([lookalikeNotTerminal]).progress).toBe("جارٍ");
  });
});

describe("computeComponentStatus — D-49 (موقف المكوّن = أحداثه الخاصة + أحداث حزمته)", () => {
  const pobEventOld: EventForStatus = {
    action_label: "دخول",
    action_is_terminal: false,
    date_expected: null,
    date_actual: "2026-09-01",
    created_at: "2026-09-01T09:00:00Z",
    is_blocked: false,
    block_reason: null,
  };
  const pobEventNew: EventForStatus = {
    action_label: "تم الانتهاء",
    action_is_terminal: true,
    date_expected: null,
    date_actual: "2026-09-20",
    created_at: "2026-09-20T09:00:00Z",
    is_blocked: false,
    block_reason: null,
  };
  const componentEventOld: EventForStatus = {
    action_label: "بروفة",
    action_is_terminal: false,
    date_expected: "2026-09-05",
    date_actual: null,
    created_at: "2026-09-05T09:00:00Z",
    is_blocked: false,
    block_reason: null,
  };
  const componentEventNew: EventForStatus = {
    action_label: "تم الانتهاء",
    action_is_terminal: true,
    date_expected: null,
    date_actual: "2026-09-15",
    created_at: "2026-09-15T09:00:00Z",
    is_blocked: false,
    block_reason: null,
  };
  const pobBlockEvent: EventForStatus = {
    action_label: "تعديلات",
    action_is_terminal: false,
    date_expected: null,
    date_actual: "2026-09-25",
    created_at: "2026-09-25T09:00:00Z",
    is_blocked: true,
    block_reason: "متوقف على موافقة الوزارة",
  };

  it("حدث حزمة وحده (المكوّن بلا أحداث خاصة) → كل المكوّنات تأخذه", () => {
    const status = computeComponentStatus([], [pobEventNew]);
    expect(status.progress).toBe("منتهية");
  });

  it("حدث مكوّن أحدث من حدث الحزمة → يغلب حدث المكوّن", () => {
    const status = computeComponentStatus([componentEventNew], [pobEventOld]);
    expect(status.progress).toBe("منتهية");
    expect(status.lastAction).toBe("تم الانتهاء");
  });

  it("حدث حزمة أحدث من حدث المكوّن → يغلب حدث الحزمة", () => {
    const status = computeComponentStatus([componentEventOld], [pobEventNew]);
    expect(status.progress).toBe("منتهية");
    expect(status.lastAction).toBe("تم الانتهاء");
  });

  it("حزمة بلا أحداث وبلا أحداث خاصة للمكوّن → لم يبدأ", () => {
    const status = computeComponentStatus([], []);
    expect(status.progress).toBe("لم يبدأ");
  });

  it("تعطيل على الحزمة أحدث من آخر حدث مكوّن → المكوّن يظهر معطَّلاً بنفس السبب", () => {
    const status = computeComponentStatus([componentEventNew], [pobBlockEvent]);
    expect(status.isBlocked).toBe(true);
    expect(status.blockReason).toBe("متوقف على موافقة الوزارة");
  });
});
