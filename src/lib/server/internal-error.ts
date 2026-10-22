import { NextResponse } from "next/server";

export const INTERNAL_SERVER_ERROR_MESSAGE = "Внутренняя ошибка сервера" as const;

export function createTraceId(): string {
  return crypto.randomUUID();
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }
  return { message: String(error) };
}

/**
 * Server-only log: stack and details never go to the client.
 * Hook Sentry/OTel here by replacing this function or wrapping it.
 */
export function logServerInternalError(params: {
  traceId: string;
  source: "api-route" | "request-lifecycle" | "server-action";
  error: unknown;
  path?: string;
  method?: string;
  routePath?: string;
  routeType?: string;
  renderSource?: string;
}) {
  const { traceId, source, error, path, method, routePath, routeType, renderSource } = params;
  const payload = {
    level: "error" as const,
    traceId,
    source,
    path: path ?? routePath,
    method,
    routeType,
    renderSource,
    error: serializeError(error),
    time: new Date().toISOString()
  };
  console.error(JSON.stringify(payload));
}

export function internalServerErrorResponse(traceId: string) {
  return NextResponse.json(
    { error: INTERNAL_SERVER_ERROR_MESSAGE },
    {
      status: 500,
      headers: {
        "Cache-Control": "no-store",
        "X-Trace-Id": traceId
      }
    }
  );
}
