export function getTodayLocalDate() {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60_000;

  return new Date(now.getTime() - timezoneOffset).toISOString().split("T")[0];
}

export function isFutureDate(date: string) {
  return date > getTodayLocalDate();
}
