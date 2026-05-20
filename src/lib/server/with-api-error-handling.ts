import type { NextRequest } from "next/server";

import {
  createTraceId,
  internalServerErrorResponse,
  logServerInternalError
} from "@/lib/server/internal-error";

type ApiRouteHandler<TContext> = (request: NextRequest, context: TContext) => Promise<Response>;

/**
 * Wraps App Router route handlers: uncaught exceptions become a safe 500 JSON body
 * (no stack), with `X-Trace-Id` for support correlation and structured server logs.
 */
export function withApiErrorHandling<TContext = unknown>(handler: ApiRouteHandler<TContext>) {
  return async (request: NextRequest, context: TContext): Promise<Response> => {
    try {
      return await handler(request, context);
    } catch (error) {
      const traceId = createTraceId();
      let path: string | undefined;
      try {
        path = new URL(request.url).pathname;
      } catch {
        path = undefined;
      }
      logServerInternalError({
        traceId,
        source: "api-route",
        error,
        path,
        method: request.method
      });
      return internalServerErrorResponse(traceId);
    }
  };
}
