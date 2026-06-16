// Use-case: assemble everything the dashboard needs to render one dataset —
// the metadata, the records, and the derived numeric series/total. Keeping the
// aggregation here (not in the React component) means the view rule is testable
// and framework-free.

import type { Dataset } from "@/domain";
import type { DatasetRepository } from "./ports";

export interface ChartDatum {
  name: string;
  value: number;
}

export interface DatasetView {
  dataset: Dataset;
  records: Record<string, string>[];
  series: ChartDatum[];
  numericTotal: number;
}

export function makeGetDatasetView(datasets: DatasetRepository) {
  return async function getDatasetView(
    datasetId: string,
  ): Promise<DatasetView | null> {
    const dataset = await datasets.findById(datasetId);
    if (!dataset) return null;

    const rows = await datasets.getRows(datasetId);
    const records = rows.map((r) => r.data);

    const numericColumns = dataset.columns.filter((c) => c.type === "number");
    let numericTotal = 0;
    const series: ChartDatum[] = numericColumns.map((c) => {
      let sum = 0;
      for (const r of records) {
        const n = Number(r[c.name]);
        if (Number.isFinite(n)) sum += n;
      }
      numericTotal += sum;
      return { name: c.name, value: sum };
    });

    return { dataset, records, series, numericTotal };
  };
}

export type GetDatasetView = ReturnType<typeof makeGetDatasetView>;
