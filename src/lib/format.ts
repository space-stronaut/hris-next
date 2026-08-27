export function formatRupiah(value: number): string {
  return "Rp " + Math.round(value).toLocaleString("id-ID");
}

export function formatPeriod(period: string): string {
  const [y, m] = period.split("-");
  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  return `${monthNames[Number(m) - 1]} ${y}`;
}

export function currentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export const SALARY_TYPES: { value: string; label: string }[] = [
  { value: "BULAN", label: "Per Bulan" },
  { value: "MINGGU", label: "Per Minggu" },
  { value: "HARI", label: "Per Hari" },
  { value: "JAM", label: "Per Jam" },
  { value: "PROYEK", label: "Per Proyek" },
  { value: "BORONGAN", label: "Per Borongan" },
];

export function salaryTypeLabel(value: string): string {
  return (
    SALARY_TYPES.find((s) => s.value === value)?.label || value || "Per Bulan"
  );
}
