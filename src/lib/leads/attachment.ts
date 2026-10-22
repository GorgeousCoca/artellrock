import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { inspectLeadAttachment } from "@/lib/leads/attachment-rules";

export type SavedLeadAttachment = {
  url: string;
  name: string;
  size: number;
  bytes: Buffer;
};

export async function saveLeadAttachment(file: File): Promise<SavedLeadAttachment> {
  const problem = inspectLeadAttachment(file);
  if (problem) {
    throw new Error(problem);
  }

  const extension = path.extname(file.name).toLowerCase();
  const storedName = `${randomUUID()}${extension}`;
  const directory = path.join(process.cwd(), "public", "uploads", "leads");
  const bytes = Buffer.from(await file.arrayBuffer());

  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, storedName), bytes);

  const original = path
    .basename(file.name)
    .replace(/[^\w.\- ()а-яА-ЯёЁ]+/gu, "_")
    .slice(0, 180);

  return {
    url: `/uploads/leads/${storedName}`,
    name: original || storedName,
    size: file.size,
    bytes
  };
}
