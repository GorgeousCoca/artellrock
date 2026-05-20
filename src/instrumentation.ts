import { createTraceId, logServerInternalError } from "@/lib/server/internal-error";

/**
 * Runs once per server process (Node). Use for OpenTelemetry, Sentry server SDK, etc.
 *
 * --- Sentry (пример) ---
 * npm i @sentry/nextjs && npx @sentry/wizard@latest -i nextjs
 * Затем в register():
 *   const Sentry = await import("@sentry/nextjs");
 *   Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1 });
 *
 * --- LogRocket (в основном клиент) ---
 * В client-компоненте или `instrumentation-client.ts` (если включите в Next):
 *   import LogRocket from "logrocket";
 *   LogRocket.init("your-app/id");
 * Серверные ошибки — через onRequestError ниже: отправляйте в ваш backend или Sentry.
 */
export function register() {
  // Intentionally empty: add APM/Sentry init when keys are present.
}

export async function onRequestError(
  error: unknown,
  errorRequest: Readonly<{
    path: string;
    method: string;
    headers: NodeJS.Dict<string | string[]>;
  }>,
  errorContext: Readonly<{
    routerKind: "Pages Router" | "App Router";
    routePath: string;
    routeType: "render" | "route" | "action" | "proxy";
    renderSource?: "react-server-components" | "react-server-components-payload" | "server-rendering";
    revalidateReason: "on-demand" | "stale" | undefined;
  }>
) {
  const traceId = createTraceId();
  logServerInternalError({
    traceId,
    source: "request-lifecycle",
    error,
    path: errorRequest.path,
    method: errorRequest.method,
    routePath: errorContext.routePath,
    routeType: errorContext.routeType,
    renderSource: errorContext.renderSource
  });

  // Пример: await Sentry.captureException(error, { tags: { traceId }, extra: { ...errorRequest } });
}
