import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { isAdminAuthorized } from "@/lib/admin/auth";
import { updateCompanySettings } from "@/lib/cms/store";
import { withApiErrorHandling } from "@/lib/server/with-api-error-handling";
import type { CompanySettings } from "@/types/content";

const allowedMapHosts = new Set(["www.google.com", "google.com", "yandex.ru", "yandex.com", "yandex.kz"]);

const settingsSchema = z
  .object({
    mapEmbedUrl: z.url()
  })
  .passthrough();

function isAllowedMapEmbedUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && allowedMapHosts.has(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

export const PUT = withApiErrorHandling(async (request: NextRequest) => {
  if (!(await isAdminAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success || !isAllowedMapEmbedUrl(parsed.data.mapEmbedUrl)) {
    return NextResponse.json({ error: "Invalid map embed URL" }, { status: 400 });
  }

  const settings = await updateCompanySettings(parsed.data as CompanySettings);
  return NextResponse.json(settings);
});
