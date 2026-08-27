type AccrualInput = {
  joinDate?: Date | string | null;
  accrual: number;
  period: string;
  now?: Date;
};

export function accruedLeave({
  joinDate,
  accrual,
  period,
  now = new Date(),
}: AccrualInput): number {
  if (!joinDate) return 0;
  const start = joinDate instanceof Date ? joinDate : new Date(joinDate);
  if (isNaN(start.getTime())) return 0;
  if (period === "YEARLY") {
    // Accrue once on each start-of-year (1 Jan) after the join year.
    return accrual * Math.max(0, now.getFullYear() - start.getFullYear());
  }
  // Accrue once on each start-of-month (1st) after the join month.
  const months =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth());
  return accrual * Math.max(0, months);
}

type BalanceInput = AccrualInput & {
  initial: number;
  used?: number;
};

export function leaveGranted({
  initial,
  joinDate,
  accrual,
  period,
  now,
}: BalanceInput): number {
  return initial + accruedLeave({ joinDate, accrual, period, now });
}

export function leaveBalance({
  initial,
  used,
  joinDate,
  accrual,
  period,
  now,
}: BalanceInput): number {
  return Math.max(0, leaveGranted({ initial, joinDate, accrual, period, now }) - (used ?? 0));
}