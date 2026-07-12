export function getTodayLocalDate() {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60_000;

  return new Date(now.getTime() - timezoneOffset).toISOString().split("T")[0];
}

export function isFutureDate(date: string) {
  return date > getTodayLocalDate();
}

const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
const timezonePattern = /(Z|[+-]\d{2}:?\d{2})$/i;

function parseDateOnly(date: string) {
  const [year, month, day] = date.split("-").map(Number);

  return new Date(year, month - 1, day, 12);
}

export function normalizeBackendDate(value?: string | null) {
  if (!value) return null;

  if (dateOnlyPattern.test(value)) {
    return parseDateOnly(value);
  }

  const normalizedValue =
    value.includes("T") && !timezonePattern.test(value) ? `${value}Z` : value;
  const date = new Date(normalizedValue);

  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatBackendDate(value?: string | null, fallback = "-") {
  const date = normalizeBackendDate(value);

  return date ? date.toLocaleDateString("es-MX") : fallback;
}

export function getBackendDateTime(value?: string | null) {
  return normalizeBackendDate(value)?.getTime() ?? null;
}

export function toDateInputValue(value?: string | null) {
  if (!value) return "";

  if (dateOnlyPattern.test(value)) return value;

  const date = normalizeBackendDate(value);

  if (!date) return "";

  const timezoneOffset = date.getTimezoneOffset() * 60_000;

  return new Date(date.getTime() - timezoneOffset).toISOString().split("T")[0];
}

