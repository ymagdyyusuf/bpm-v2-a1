const ARABIC_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
const WESTERN_BY_ARABIC: Record<string, string> = {
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
  "٫": ".",
};

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

/**
 * عكس toArabicDigits — تُستخدم عند قراءة رقم مُدخَل من مستخدم (الواجهة كلها
 * تعرض أرقاماً عربية، فمن الطبيعي أن يكتبها كذلك). كل دالة تحوّل نصاً لرقم
 * تمرّ عليه أولاً قبل Number()/parseInt، مهما كان مصدر الإدخال.
 */
export function normalizeDigitsForParsing(input: string): string {
  return input.replace(/[٠-٩٫]/g, (d) => WESTERN_BY_ARABIC[d] ?? d);
}
