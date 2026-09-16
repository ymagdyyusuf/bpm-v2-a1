export function normalizePublisherLabel(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) {
    throw new Error("اسم الناشر مطلوب");
  }
  return trimmed;
}
