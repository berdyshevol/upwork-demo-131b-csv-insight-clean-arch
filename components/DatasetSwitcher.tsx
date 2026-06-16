"use client";

import { useRouter } from "next/navigation";

interface Option {
  id: string;
  filename: string;
  rowCount: number;
}

export default function DatasetSwitcher({
  datasets,
  current,
}: {
  datasets: Option[];
  current: string;
}) {
  const router = useRouter();

  return (
    <label className="flex items-center gap-2 text-sm text-slate-600">
      <span className="font-medium">Dataset</span>
      <select
        data-testid="dataset-select"
        value={current}
        onChange={(e) => router.push(`/dashboard?dataset=${e.target.value}`)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-accent"
      >
        {datasets.map((d) => (
          <option key={d.id} value={d.id}>
            {d.filename} ({d.rowCount} rows)
          </option>
        ))}
      </select>
    </label>
  );
}
