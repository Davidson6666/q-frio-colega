/**
 * Brazilian phone helpers.
 *
 * Canonical storage format: digits only, with country code, e.g. "5544999998888".
 * That is exactly what `https://wa.me/<number>` expects.
 */

const COUNTRY_CODE = "55";

/** Returns the canonical number, or null when the input is not a valid BR phone. */
export function normalizeBrazilPhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");

  // Strip an optional leading country code (12-13 digits with 55 prefix).
  if (digits.length >= 12 && digits.startsWith(COUNTRY_CODE)) {
    digits = digits.slice(COUNTRY_CODE.length);
  }

  // DDD (2 digits) + landline (8) or mobile (9).
  if (digits.length !== 10 && digits.length !== 11) return null;

  const ddd = Number(digits.slice(0, 2));
  if (ddd < 11 || ddd > 99) return null;

  // Mobile numbers have 9 digits and always start with 9.
  if (digits.length === 11 && digits[2] !== "9") return null;
  // Landlines start with 2-5 (8-digit numbers).
  if (digits.length === 10 && !/[2-5]/.test(digits[2])) return null;

  return COUNTRY_CODE + digits;
}

/** "5544999998888" -> "(44) 99999-8888". Falls back to the raw value. */
export function formatBrazilPhone(canonical: string | null | undefined): string {
  if (!canonical) return "";
  const digits = canonical.replace(/\D/g, "");
  const national = digits.startsWith(COUNTRY_CODE) ? digits.slice(2) : digits;
  if (national.length === 11) {
    return `(${national.slice(0, 2)}) ${national.slice(2, 7)}-${national.slice(7)}`;
  }
  if (national.length === 10) {
    return `(${national.slice(0, 2)}) ${national.slice(2, 6)}-${national.slice(6)}`;
  }
  return canonical;
}

/** Builds a wa.me deep link. `phone` must be canonical. */
export function whatsappUrl(phone: string, text?: string): string {
  const base = `https://wa.me/${phone}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
