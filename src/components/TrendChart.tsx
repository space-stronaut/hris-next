export type TrendPoint = { dateKey: string; value: number };

export default function TrendChart({
  title,
  data,
  color = "bg-blue-500",
}: {
  title: string;
  data: TrendPoint[];
  color?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="rounded-2xl border border-slate-200 bg-surface shadow-sm">
      <div className="border-b border-slate-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="flex items-end gap-2 overflow-x-auto px-6 py-6">
        {data.map((d) => {
          const pct = Math.round((d.value / max) * 100);
          return (
            <div
              key={d.dateKey}
              className="flex min-w-[40px] flex-1 flex-col items-center gap-1"
            >
              <span className="text-xs font-medium text-slate-600">
                {d.value}
              </span>
              <div
                className={`w-full max-w-[36px] rounded-t-md ${color}`}
                style={{ height: `${Math.max(4, pct)}px` }}
              />
              <span className="text-[10px] text-slate-400">
                {d.dateKey.slice(8, 10)}/{d.dateKey.slice(5, 7)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}