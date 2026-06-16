// Use-cases: list datasets. Two variants — all (admin) and per-user (dashboard).

import type { Dataset } from "@/domain";
import type { DatasetRepository } from "./ports";

export function makeListAllDatasets(datasets: DatasetRepository) {
  return async function listAllDatasets(): Promise<Dataset[]> {
    return datasets.listAll();
  };
}

export function makeListDatasetsForUser(datasets: DatasetRepository) {
  return async function listDatasetsForUser(userId: string): Promise<Dataset[]> {
    return datasets.listForUser(userId);
  };
}

export type ListAllDatasets = ReturnType<typeof makeListAllDatasets>;
export type ListDatasetsForUser = ReturnType<typeof makeListDatasetsForUser>;
