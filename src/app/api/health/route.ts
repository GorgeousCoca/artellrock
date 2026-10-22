import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { pingDatabase } from "@/lib/cms/store";
import { withApiErrorHandling } from "@/lib/server/with-api-error-handling";

/**
 * GET /api/health          — liveness: процесс жив (для Docker healthcheck / балансировщика).
 * GET /api/health?deep=1   — readiness: дополнительно проверяет БД (Payload → Postgres) и отдаёт время ответа.
 */
export const GET = withApiErrorHandling(async (request: NextRequest) => {
  const base = {
    service: "kvartsevyy-aglomerat",
    timestamp: new Date().toISOString()
  };

  if (request.nextUrl.searchParams.get("deep") !== "1") {
    return NextResponse.json({ ok: true, ...base }, { status: 200 });
  }

  const startedAt = Date.now();
  try {
    await pingDatabase();
    return NextResponse.json(
      { ok: true, ...base, checks: { database: { ok: true, latencyMs: Date.now() - startedAt } } },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { ok: false, ...base, checks: { database: { ok: false, latencyMs: Date.now() - startedAt } } },
      { status: 503 }
    );
  }
});
