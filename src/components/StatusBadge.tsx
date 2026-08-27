export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        status === "APPROVED"
          ? "bg-green-100 text-green-700"
          : status === "REJECTED"
          ? "bg-red-100 text-red-700"
          : "bg-amber-100 text-amber-700"
      }`}
    >
      {status}
    </span>
  );
}
