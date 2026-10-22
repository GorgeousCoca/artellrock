/**
 * IP клиента из заголовков прокси. Принимает и `request.headers`, и результат `await headers()` из next/headers.
 *
 * ДОВЕРИЕ К ЗАГОЛОВКАМ: X-Forwarded-For берётся как есть, поэтому приложение должно быть доступно ТОЛЬКО через
 * наш прокси (Caddy перезаписывает заголовок реальным адресом клиента). Если порт Next открыт наружу, любой
 * клиент подставит свой X-Forwarded-For и обойдёт лимит заявок (rate-limit.ts). См. комментарий у `ports` в
 * docker-compose.yml: порт web привязан к 127.0.0.1.
 */
export function getClientIpFromHeaders(headers: Pick<Headers, "get">) {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) {
      return firstIp;
    }
  }

  const realIp = headers.get("x-real-ip")?.trim();
  return realIp || "unknown";
}

export function getClientIp(request: Request) {
  return getClientIpFromHeaders(request.headers);
}
