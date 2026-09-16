const ARABIC_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

/**
 * D-31: الأرقام تُعرض عربية دائماً؛ التخزين والفلترة والترتيب تبقى إنجليزية.
 * دالة عرض فقط — لا تُستخدم أبداً على قيمة قبل تخزينها أو مقارنتها.
 */
export function toArabicDigits(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/[0-9]/g, (d) => ARABIC_DIGITS[Number(d)])
    .replace(".", "٫");
}
