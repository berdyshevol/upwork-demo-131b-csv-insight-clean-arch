export interface ChartDatum {
  name: string;
  value: number;
}

// A dependency-free horizontal bar chart — one bar per numeric column total.
export default function BarChart({ series }: { series: ChartDatum[] }) {
  const max = Math.max(1, ...series.map((s) => s.value));

  return (
    <div
      data-testid="chart"
      className="rounded-2xl border border-slate-200 bg-white p-6"
    >
      <h2 className="text-sm font-semibold text-slate-600">Totals by numeric column</h2>
      {series.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">
          No numeric columns detected in this dataset.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {series.map((s) => (
            <li key={s.name}>
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-medium">{s.name}</span>
                <span className="tabular-nums">{s.value.toLocaleString()}</span>
              </div>
              <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${Math.max(2, (s.value / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
