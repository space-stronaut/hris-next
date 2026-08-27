"use client";

export function Pagination({
  total,
  page,
  pageSize,
  onPageChange,
}: {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);

  return (
    <div className="flex flex-col gap-2 border-t border-slate-200 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-slate-500">
        Menampilkan {start}–{end} dari {total}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Sebelumnya
        </button>
        <span className="text-xs text-slate-600">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Berikutnya
        </button>
      </div>
    </div>
  );
}