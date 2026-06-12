export function hasMoreThanTwoDecimals(value: string) {
  return /^\d+(\.\d{3,})$/.test(value.trim());
}
