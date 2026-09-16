import { normalizeDigitsForParsing } from "./numerals";

export function parseOptionalNonNegativeInt(raw: string): number | null {
  const trimmed = normalizeDigitsForParsing(raw.trim());
  if (!trimmed) return null;

  const value = Number(trimmed);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error("القيمة يجب أن تكون رقماً صحيحاً موجباً أو فارغة");
  }
  return value;
}

export function parseOptionalNonNegativeDecimal(raw: string): number | null {
  const trimmed = normalizeDigitsForParsing(raw.trim());
  if (!trimmed) return null;

  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("القيمة يجب أن تكون رقماً موجباً أو فارغة");
  }
  return value;
}
