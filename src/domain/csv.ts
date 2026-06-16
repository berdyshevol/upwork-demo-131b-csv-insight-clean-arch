// Dependency-free CSV parsing + type sniffing — the core domain rules of the
// product. Pure module (no Node APIs, no framework) so it is safe to import from
// any layer. Logic moved here UNCHANGED from the original lib/csv.ts.

import type { Column } from "./entities";

export type { Column, ColType } from "./entities";

/**
 * Parse CSV text into a header row + data rows.
 * Handles quoted fields, escaped quotes ("") and newlines inside quotes.
 */
export function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const cells: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  const endField = () => {
    row.push(field);
    field = "";
  };
  const endRow = () => {
    endField();
    cells.push(row);
    row = [];
  };

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i++;
    } else if (ch === ",") {
      endField();
      i++;
    } else if (ch === "\r") {
      i++;
    } else if (ch === "\n") {
      endRow();
      i++;
    } else {
      field += ch;
      i++;
    }
  }

  // Flush whatever is left on the final (unterminated) line.
  if (field.length > 0 || row.length > 0) endRow();

  // Drop blank lines (a single empty cell).
  const nonEmpty = cells.filter((r) => !(r.length === 1 && r[0].trim() === ""));
  const headers = (nonEmpty.shift() ?? []).map((h) => h.trim());

  return { headers, rows: nonEmpty };
}

function isNumeric(value: string): boolean {
  if (value === "") return false;
  return Number.isFinite(Number(value));
}

/**
 * Infer a type per column: "number" if every non-empty value in the column
 * parses as a finite number, otherwise "string".
 */
export function sniffTypes(headers: string[], rows: string[][]): Column[] {
  return headers.map((name, idx) => {
    let sawValue = false;
    let allNumeric = true;
    for (const r of rows) {
      const v = (r[idx] ?? "").trim();
      if (v === "") continue;
      sawValue = true;
      if (!isNumeric(v)) {
        allNumeric = false;
        break;
      }
    }
    return { name, type: sawValue && allNumeric ? "number" : "string" };
  });
}

/** Zip rows into records keyed by header name. */
export function buildRecords(
  headers: string[],
  rows: string[][],
): Record<string, string>[] {
  return rows.map((r) => {
    const record: Record<string, string> = {};
    headers.forEach((h, i) => {
      record[h] = (r[i] ?? "").trim();
    });
    return record;
  });
}
