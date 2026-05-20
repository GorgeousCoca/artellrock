import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { clearAdminSession } from "@/lib/admin/auth";
import { withApiErrorHandling } from "@/lib/server/with-api-error-handling";

export const POST = withApiErrorHandling(async (_request: NextRequest) => {
  await clearAdminSession();
  return NextResponse.json({ ok: true });
});
