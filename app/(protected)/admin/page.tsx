import { redirect } from "next/navigation";
import { getSession } from "@/app/lib/session";
import { listAllDatasets } from "@/composition";
import { deleteDatasetAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard");

  const datasets = await listAllDatasets();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Admin</h1>
        <p className="mt-1 text-sm text-slate-500">
          Every uploaded dataset across all users. Deleting one removes it from the
          dashboard immediately.
        </p>
      </div>

      {datasets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          No datasets have been uploaded yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Filename</th>
                <th className="px-4 py-2.5 font-semibold">Owner</th>
                <th className="px-4 py-2.5 font-semibold">Rows</th>
                <th className="px-4 py-2.5 font-semibold">Columns</th>
                <th className="px-4 py-2.5 font-semibold">Uploaded</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {datasets.map((d) => (
                <tr
                  key={d.id}
                  data-testid="admin-row"
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="px-4 py-2.5 font-medium text-ink">{d.filename}</td>
                  <td className="px-4 py-2.5 text-slate-600">{d.ownerEmail}</td>
                  <td className="px-4 py-2.5 tabular-nums text-slate-600">{d.rowCount}</td>
                  <td className="px-4 py-2.5 tabular-nums text-slate-600">
                    {d.columns.length}
                  </td>
                  <td className="px-4 py-2.5 text-slate-500">
                    {new Date(d.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <form action={deleteDatasetAction}>
                      <input type="hidden" name="id" value={d.id} />
                      <button
                        type="submit"
                        className="rounded-md border border-rose-300 px-3 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
                      >
                        Delete
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
