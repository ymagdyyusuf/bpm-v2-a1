import { normalizeDigitsForParsing } from "./numerals";

export function parseOptionalNonNegativeInt(raw: string, fieldLabel: string): number | null {
  const trimmed = normalizeDigitsForParsing(raw.trim());
  if (!trimmed) return null;

  const value = Number(trimmed);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${fieldLabel}: يجب أن يكون رقماً صحيحاً موجباً أو فارغاً`);
  }
  return value;
}

export function parseOptionalNonNegativeDecimal(raw: string, fieldLabel: string): number | null {
  const trimmed = normalizeDigitsForParsing(raw.trim());
  if (!trimmed) return null;

  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${fieldLabel}: يجب أن يكون رقماً موجباً أو فارغاً`);
  }
  return value;
}
