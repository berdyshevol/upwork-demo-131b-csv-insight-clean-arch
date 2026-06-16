import Link from "next/link";
import { getSession } from "@/app/lib/session";
import { listDatasetsForUser, getDatasetView } from "@/composition";
import DataTable from "@/components/DataTable";
import BarChart from "@/components/BarChart";
import DatasetSwitcher from "@/components/DatasetSwitcher";

export const dynamic = "force-dynamic";

function StatCard({
  label,
  value,
  testid,
}: {
  label: string;
  value: string;
  testid: string;
}) {
  return (
    <div
      data-testid={testid}
      className="rounded-2xl border border-slate-200 bg-white p-5"
    >
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-ink tabular-nums">{value}</p>
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ dataset?: string }>;
}) {
  const session = await getSession();
  // The protected layout already guarantees a session; this satisfies types.
  if (!session) return null;

  const datasets = await listDatasetsForUser(session.userId);

  if (datasets.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-base font-semibold text-ink">No datasets yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Upload your first CSV to see stat cards, a chart and a sortable table.
          </p>
          <Link
            href="/upload"
            className="mt-4 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Upload a CSV
          </Link>
        </div>
      </div>
    );
  }

  const sp = await searchParams;
  const selected =
    (sp.dataset && datasets.find((d) => d.id === sp.dataset)) || datasets[0];
  const view = await getDatasetView(selected.id);
  // The protected layout + non-empty datasets guarantee this resolves.
  if (!view) return null;
  const { dataset, records, series, numericTotal } = view;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Exploring <span className="font-medium text-slate-700">{dataset.filename}</span>
          </p>
        </div>
        <DatasetSwitcher
          datasets={datasets.map((d) => ({
            id: d.id,
            filename: d.filename,
            rowCount: d.rowCount,
          }))}
          current={dataset.id}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard testid="stat-rows" label="Rows" value={dataset.rowCount.toLocaleString()} />
        <StatCard
          testid="stat-columns"
          label="Columns"
          value={dataset.columns.length.toLocaleString()}
        />
        <StatCard
          testid="stat-numeric"
          label="Numeric total"
          value={numericTotal.toLocaleString()}
        />
      </div>

      <BarChart series={series} />

      <DataTable columns={dataset.columns} rows={records} />
    </div>
  );
}
