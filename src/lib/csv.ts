/** Spreadsheet-safe CSV helpers. */

// A cell that starts with = + - @ can be run as a formula by Excel/Sheets. Customer-typed text
// (names, addresses, notes) must never be able to do that, so such cells get a leading quote.
// Real phone numbers (digits, optional leading +) are left alone.
export function safeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let s = String(value);
  if (/^[=@\t\r]/.test(s) || (/^[+-]/.test(s) && !/^\+?\d[\d\s-]*$/.test(s))) s = `'${s}`;
  return s;
}

export function csvEscape(value: unknown): string {
  const s = safeCell(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** UTF-8 with a BOM so Excel shows ₹, accents and Hindi names correctly; CRLF line endings. */
export function toCsv(rows: unknown[][]): string {
  return "﻿" + rows.map((r) => r.map(csvEscape).join(",")).join("\r\n") + "\r\n";
}
