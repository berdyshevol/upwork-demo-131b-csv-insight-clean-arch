import { NextResponse } from "next/server";
import { getSession } from "@/app/lib/session";
import { uploadDataset } from "@/composition";
import { UploadError } from "@/application";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file was uploaded." }, { status: 400 });
  }

  try {
    const dataset = await uploadDataset({
      userId: session.userId,
      ownerEmail: session.email,
      filename: file.name || "upload.csv",
      text: await file.text(),
    });

    return NextResponse.json({
      id: dataset.id,
      filename: dataset.filename,
      rowCount: dataset.rowCount,
      columns: dataset.columns,
    });
  } catch (err) {
    if (err instanceof UploadError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
