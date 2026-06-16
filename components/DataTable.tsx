"use client";

import { useMemo, useState } from "react";
import type { Column } from "@/domain";

const PAGE_SIZE = 10;

export default function DataTable({
  columns,
  rows,
}: {
  columns: Column[];
  rows: Record<string, string>[];
}) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    const col = columns.find((c) => c.name === sortKey);
    const numeric = col?.type === "number";
    return [...rows].sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      const cmp = numeric
        ? (Number(av) || 0) - (Number(bv) || 0)
        : av.localeCompare(bv);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [rows, columns, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const visible = sorted.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  function toggleSort(name: string) {
    if (sortKey === name) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(name);
      setSortDir("asc");
    }
    setPage(0);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table data-testid="data-table" className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              {columns.map((c) => (
                <th key={c.name} className="px-4 py-2.5 font-semibold text-slate-600">
                  <button
                    type="button"
                    onClick={() => toggleSort(c.name)}
                    className="flex items-center gap-1 hover:text-accent"
                  >
                    {c.name}
                    <span className="text-xs text-slate-400">
                      {sortKey === c.name ? (sortDir === "asc" ? "▲" : "▼") : "↕"}
                    </span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row, i) => (
              <tr key={i} className="border-b border-slate-100 last:border-0">
                {columns.map((c) => (
                  <td key={c.name} className="px-4 py-2.5 text-slate-700">
                    {row[c.name]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm">
        <span data-testid="page-indicator" className="text-slate-500">
          Page {current + 1} of {pageCount}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={current === 0}
            className="rounded-md border border-slate-300 px-3 py-1 text-slate-600 disabled:opacity-40"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={current >= pageCount - 1}
            className="rounded-md border border-slate-300 px-3 py-1 text-slate-600 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
