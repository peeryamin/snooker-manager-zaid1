export const TABLE_RATES: Record<number, { perMinute: number; flat: number }> = {
  1: { perMinute: 5, flat: 100 },
  2: { perMinute: 7, flat: 150 },
};

export function calcTableCharge(tableNo: number, activeSeconds: number): number {
  const rate = TABLE_RATES[tableNo];
  if (!rate) throw new Error("Invalid table number");
  const minutes = Math.ceil(Math.max(activeSeconds, 0) / 60);
  const perMinuteCharge = minutes * rate.perMinute;
  return Math.max(perMinuteCharge, rate.flat);
}

export function formatINR(amount: number): string {
  return `₹${amount.toFixed(2)}`;
}
