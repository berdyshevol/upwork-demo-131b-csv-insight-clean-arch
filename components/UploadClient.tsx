"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { Column } from "@/domain";

interface UploadResult {
  id: string;
  filename: string;
  rowCount: number;
  columns: Column[];
}

export default function UploadClient() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Upload failed.");
      } else {
        setResult(json as UploadResult);
      }
    } catch {
      setError("Something went wrong while uploading.");
    } finally {
      setBusy(false);
    }
  }

  function onPick(files: FileList | null) {
    const file = files?.[0];
    if (file) void upload(file);
  }

  return (
    <div className="space-y-6">
      <div
        data-testid="dropzone"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          onPick(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center transition ${
          dragging ? "border-accent bg-indigo-50" : "border-slate-300 bg-white"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => onPick(e.target.files)}
        />
        <p className="text-base font-semibold text-ink">
          {busy ? "Parsing…" : "Drag & drop your CSV here"}
        </p>
        <p className="mt-1 text-sm text-slate-500">or click to browse your files</p>
        <a
          href="/sample.csv"
          download
          onClick={(e) => e.stopPropagation()}
          className="mt-4 text-xs font-medium text-accent hover:underline"
        >
          Download a sample CSV
        </a>
      </div>

      {error ? (
        <p
          data-testid="upload-error"
          className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {error}
        </p>
      ) : null}

      {result ? (
        <div
          data-testid="upload-result"
          className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6"
        >
          <h2 className="text-lg font-semibold text-emerald-900">
            Parsed “{result.filename}”
          </h2>
          <p className="mt-1 text-sm text-emerald-800">Rows parsed: {result.rowCount}</p>
          <p className="mt-1 text-sm text-emerald-800">
            Detected {result.columns.length} columns:
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {result.columns.map((c) => (
              <li
                key={c.name}
                className="rounded-full border border-emerald-300 bg-white px-3 py-1 text-xs text-emerald-900"
              >
                {c.name}
                <span className="ml-1 text-emerald-500">· {c.type}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/dashboard"
            className="mt-5 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            View it on the dashboard →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
