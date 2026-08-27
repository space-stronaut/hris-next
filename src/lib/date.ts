export function toDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "-";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(value: Date | string | null | undefined): string {
  if (!value) return "-";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateKey(value: string | Date): string {
  const d = typeof value === "string" ? new Date(`${value}T00:00:00`) : value;
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function formatDuration(
  checkIn: Date | string | null | undefined,
  checkOut: Date | string | null | undefined
): string {
  if (!checkIn || !checkOut) return "-";
  const start = typeof checkIn === "string" ? new Date(checkIn) : checkIn;
  const end = typeof checkOut === "string" ? new Date(checkOut) : checkOut;
  const ms = Math.max(0, end.getTime() - start.getTime());
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${hours}j ${minutes}m`;
}

export function workingDaysInMonth(period: string): number {
  const [y, m] = period.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  let count = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const day = new Date(y, m - 1, d).getDay();
    if (day !== 0 && day !== 6) count++;
  }
  return count;
}

export function workingDayKeys(period: string): string[] {
  const [y, m] = period.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const keys: string[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(y, m - 1, d);
    const day = date.getDay();
    if (day !== 0 && day !== 6) keys.push(toDateKey(date));
  }
  return keys;
}

export function daysBetween(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const ms = Math.max(0, end.getTime() - start.getTime());
  return Math.floor(ms / 86400000) + 1;
}

export function weekdayKeys(count: number, from = new Date()): string[] {
  const keys: string[] = [];
  const cursor = new Date(from);
  while (keys.length < count) {
    cursor.setDate(cursor.getDate() - 1);
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) keys.unshift(toDateKey(cursor));
  }
  return keys;
}
