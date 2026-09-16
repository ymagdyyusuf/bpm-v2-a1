import { normalizeDigitsForParsing } from "./numerals";

export function parsePobPrice(raw: string): number | null {
  const trimmed = normalizeDigitsForParsing(raw.trim());
  if (!trimmed) return null;

  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("السعر يجب أن يكون رقماً موجباً أو فارغاً");
  }
  return value;
}
