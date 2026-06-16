// Use-case: take raw CSV text + a filename, parse/sniff/build via the domain,
// validate the shape, and persist through the DatasetRepository port.
// Validation errors are surfaced as UploadError so the interface layer can map
// them to HTTP status codes without knowing the domain internals.

import { parseCsv, sniffTypes, buildRecords, type Dataset } from "@/domain";
import type { DatasetRepository } from "./ports";

export class UploadError extends Error {}

export interface UploadDatasetInput {
  userId: string;
  ownerEmail: string;
  filename: string;
  text: string;
}

export function makeUploadDataset(datasets: DatasetRepository) {
  return async function uploadDataset(input: UploadDatasetInput): Promise<Dataset> {
    const filename = input.filename || "upload.csv";
    if (!filename.toLowerCase().endsWith(".csv")) {
      throw new UploadError(
        "Only .csv files are supported. Please upload a CSV.",
      );
    }

    const { headers, rows } = parseCsv(input.text);

    if (headers.length === 0) {
      throw new UploadError("Could not detect a header row in this CSV.");
    }
    if (rows.length === 0) {
      throw new UploadError("This CSV has a header but no data rows.");
    }

    const columns = sniffTypes(headers, rows);
    const records = buildRecords(headers, rows);

    return datasets.create({
      userId: input.userId,
      ownerEmail: input.ownerEmail,
      filename,
      columns,
      records,
    });
  };
}

export type UploadDataset = ReturnType<typeof makeUploadDataset>;
