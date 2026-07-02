import { promises as fs } from "fs";
import path from "path";

const MAX_SIZE = 8 * 1024 * 1024;

const ALLOWED: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "application/pdf": ".pdf"
};

export async function saveLeadAttachment(
  leadId: string,
  file: File
): Promise<{ url: string; name: string; size: number } | null> {
  if (!file.size || file.size > MAX_SIZE) {
    return null;
  }

  const ext = ALLOWED[file.type];
  if (!ext) {
    return null;
  }

  const safeBase = file.name.replace(/[^\w.\-()а-яА-ЯёЁ ]+/gi, "_").slice(0, 80) || `file${ext}`;
  const fileName = `${Date.now()}-${safeBase}`;
  const dir = path.join(process.cwd(), "public", "uploads", "leads", leadId);
  const outputPath = path.join(dir, fileName);

  const bytes = Buffer.from(await file.arrayBuffer());
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(outputPath, bytes);

  return {
    url: `/uploads/leads/${leadId}/${fileName}`,
    name: file.name,
    size: file.size
  };
}
