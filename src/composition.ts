// COMPOSITION ROOT — the one place where the outer layers (infrastructure) are
// wired into the application's use-cases. This is the ONLY module in the app
// that is allowed to import from src/infrastructure. The interface layer (app/)
// imports use-cases from here and nothing else.
//
// To swap the persistence adapter (e.g. to an in-memory or a different DB),
// change only the two `new Postgres*Repository()` lines below — every use-case
// and every page stays untouched.

import {
  makeAuthenticate,
  makeUploadDataset,
  makeListAllDatasets,
  makeListDatasetsForUser,
  makeGetDatasetView,
  makeDeleteDataset,
} from "@/application";
import { PostgresUserRepository } from "@/infrastructure/postgres/PostgresUserRepository";
import { PostgresDatasetRepository } from "@/infrastructure/postgres/PostgresDatasetRepository";

const userRepository = new PostgresUserRepository();
const datasetRepository = new PostgresDatasetRepository();

export const authenticate = makeAuthenticate(userRepository);
export const uploadDataset = makeUploadDataset(datasetRepository);
export const listAllDatasets = makeListAllDatasets(datasetRepository);
export const listDatasetsForUser = makeListDatasetsForUser(datasetRepository);
export const getDatasetView = makeGetDatasetView(datasetRepository);
export const deleteDataset = makeDeleteDataset(datasetRepository);
