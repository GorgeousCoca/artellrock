import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { withApiErrorHandling } from "@/lib/server/with-api-error-handling";

export const GET = withApiErrorHandling(async (_request: NextRequest) => {
  return NextResponse.json(
    {
      ok: true,
      service: "kvartsevyy-aglomerat",
      timestamp: new Date().toISOString()
    },
    { status: 200 }
  );
});
