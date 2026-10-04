/** Nepal / Indian-style grouping: 12,00,000 */

export function formatRs(amount: number): string {
  const negative = amount < 0;
  const n = Math.round(Math.abs(amount));
  const s = String(n);
  if (s.length <= 3) {
    return `${negative ? "-" : ""}Rs. ${s}`;
  }

  const last3 = s.slice(-3);
  let rest = s.slice(0, -3);
  const parts: string[] = [];
  while (rest.length > 2) {
    parts.unshift(rest.slice(-2));
    rest = rest.slice(0, -2);
  }
  if (rest) parts.unshift(rest);

  return `${negative ? "-" : ""}Rs. ${parts.join(",")},${last3}`;
}

export function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}
