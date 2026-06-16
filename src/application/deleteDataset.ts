// Use-case: delete a dataset (and, via the adapter's cascade, its rows).

import type { DatasetRepository } from "./ports";

export function makeDeleteDataset(datasets: DatasetRepository) {
  return async function deleteDataset(datasetId: string): Promise<boolean> {
    return datasets.delete(datasetId);
  };
}

export type DeleteDataset = ReturnType<typeof makeDeleteDataset>;
