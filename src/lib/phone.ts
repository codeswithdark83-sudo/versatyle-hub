/**
 * Phone helpers shared by the browser and the server.
 * Numbers are stored in international format, e.g. "+919876543210".
 */

export const PHONE_HINT =
  "10-digit mobile number, e.g. 98765 43210. For numbers outside India, start with + and the country code.";

export const PHONE_ERROR =
  "Please enter a valid phone number (10-digit mobile, or start with + and the country code).";

/** Returns the number in "+<country code><number>" form, or null if it isn't valid. */
export function normalizePhone(raw: string, country = "India"): string | null {
  let s = (raw ?? "").trim().replace(/[\s().-]/g, "");
  if (!s) return null;
  if (s.startsWith("00")) s = "+" + s.slice(2);

  if (s.startsWith("+")) {
    const d = s.slice(1);
    if (!/^[1-9]\d{7,14}$/.test(d)) return null;
    // +91 is India: must be followed by a 10-digit mobile number starting 6-9.
    if (d.startsWith("91")) return /^91[6-9]\d{9}$/.test(d) ? `+${d}` : null;
    return `+${d}`;
  }

  if (!/^\d+$/.test(s)) return null;
  const c = country.trim().toLowerCase();
  if (c === "india" || c === "in") {
    let d = s;
    if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
    else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
    return /^[6-9]\d{9}$/.test(d) ? `+91${d}` : null;
  }
  return null;
}

/** Friendly display: "+91 98765 43210". Falls back to the raw text for unusual numbers. */
export function formatPhone(p: string | null | undefined): string {
  if (!p) return "";
  const m = /^\+91([6-9]\d{4})(\d{5})$/.exec(p);
  return m ? `+91 ${m[1]} ${m[2]}` : p;
}

/** Best-effort normalisation for numbers saved before validation existed. */
function best(p: string): string | null {
  return normalizePhone(p, "India");
}

export function telHref(p: string | null | undefined): string | null {
  if (!p) return null;
  const n = best(p) ?? p.replace(/[^\d+]/g, "");
  return n ? `tel:${n}` : null;
}

export function whatsappHref(p: string | null | undefined, text?: string): string | null {
  if (!p) return null;
  const n = best(p);
  if (!n) return null;
  const q = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${n.slice(1)}${q}`;
}
