"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/app/lib/session";
import { deleteDataset } from "@/composition";

export async function deleteDatasetAction(formData: FormData) {
  const session = await getSession();
  if (session?.role !== "admin") return;

  const id = String(formData.get("id") ?? "");
  if (id) await deleteDataset(id);

  revalidatePath("/admin");
  revalidatePath("/dashboard");
}
