import { promises as fs } from "fs";
import path from "path";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { isAdminAuthorized } from "@/lib/admin/auth";
import { withApiErrorHandling } from "@/lib/server/with-api-error-handling";
import { uid } from "@/lib/utils";

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;
const allowedMimeToExtension: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif"
};

function hasPrefix(bytes: Buffer, prefix: number[]) {
  return prefix.every((value, index) => bytes[index] === value);
}

function isValidImageSignature(bytes: Buffer, mimeType: string) {
  if (mimeType === "image/jpeg") {
    return hasPrefix(bytes, [0xff, 0xd8, 0xff]);
  }
  if (mimeType === "image/png") {
    return hasPrefix(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  }
  if (mimeType === "image/webp") {
    return hasPrefix(bytes, [0x52, 0x49, 0x46, 0x46]) && bytes.subarray(8, 12).toString() === "WEBP";
  }
  if (mimeType === "image/gif") {
    return bytes.subarray(0, 6).toString() === "GIF87a" || bytes.subarray(0, 6).toString() === "GIF89a";
  }
  return false;
}

export const POST = withApiErrorHandling(async (request: NextRequest) => {
  if (!(await isAdminAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File not found" }, { status: 400 });
  }

  if (file.size <= 0 || file.size > MAX_UPLOAD_SIZE) {
    return NextResponse.json({ error: "Invalid file size" }, { status: 400 });
  }

  if (!(file.type in allowedMimeToExtension)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!isValidImageSignature(bytes, file.type)) {
    return NextResponse.json({ error: "Invalid file signature" }, { status: 400 });
  }

  const ext = allowedMimeToExtension[file.type];
  const fileName = `${uid("media")}${ext}`;
  const outputDir = path.join(process.cwd(), "public", "uploads");
  const outputPath = path.join(outputDir, fileName);

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(outputPath, bytes);

  return NextResponse.json({
    url: `/uploads/${fileName}`
  });
});
