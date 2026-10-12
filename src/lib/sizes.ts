/** Numeric size equivalents shown next to the letter sizes. Display only — stored sizes stay "S", "M"… */
export const SIZE_NUMBERS: Record<string, number> = { S: 40, M: 42, L: 44, XL: 46, XXL: 48 };

export function sizeNumber(size: string): number | undefined {
  return SIZE_NUMBERS[size.trim().toUpperCase()];
}

/** "S" → "S (40)"; unknown sizes are returned unchanged. */
export function sizeLabel(size: string): string {
  const n = sizeNumber(size);
  return n ? `${size} (${n})` : size;
}
