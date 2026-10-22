/**
 * Сброс кэша работающего сайта из скрипта `payload run`.
 *
 * Скрипт — отдельный процесс и сам кэш Next сбросить не может: логинится и вызывает
 * `POST /api/materials/revalidate-cache` (эндпоинт сбрасывает материалы и остальные справочники калькулятора).
 *
 * Учётные данные по порядку: PRICES_ADMIN_EMAIL/PASSWORD, затем ADMIN_CREATE_*, затем ADMIN_EMAIL/ADMIN_PASSWORD.
 * Адрес сервера: IMPORT_BASE_URL, по умолчанию http://localhost:3000.
 */
export async function flushSiteCache(): Promise<string> {
  const base = (process.env.IMPORT_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const email = process.env.PRICES_ADMIN_EMAIL ?? process.env.ADMIN_CREATE_EMAIL ?? process.env.ADMIN_EMAIL;
  const password = process.env.PRICES_ADMIN_PASSWORD ?? process.env.ADMIN_CREATE_PASSWORD ?? process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    return "Кэш сайта НЕ сброшен: нет PRICES_ADMIN_EMAIL/PRICES_ADMIN_PASSWORD (или ADMIN_CREATE_*, ADMIN_EMAIL/ADMIN_PASSWORD). Перезапустите сервер или откройте «Цены на камни» и сохраните любую правку; иначе калькулятор обновится не позже чем через час.";
  }
  try {
    const login = await fetch(`${base}/api/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const { token } = (await login.json().catch(() => ({}))) as { token?: string };
    if (!login.ok || !token) throw new Error(`вход вернул ${login.status}`);

    const flush = await fetch(`${base}/api/materials/revalidate-cache`, {
      method: "POST",
      headers: { Authorization: `JWT ${token}` }
    });
    // Тело нужно прочитать: иначе сокет остаётся открытым и на Windows Node падает при выходе (libuv).
    await flush.text().catch(() => "");
    if (!flush.ok) throw new Error(`сброс кэша вернул ${flush.status}`);
    return `Кэш сайта сброшен через ${base}.`;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return `Кэш сайта НЕ сброшен (${base}: ${reason}). Перезапустите сервер или подождите до часа — тогда калькулятор покажет новые цены.`;
  }
}
