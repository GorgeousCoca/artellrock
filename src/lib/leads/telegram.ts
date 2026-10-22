/** Имя пользователя Telegram: 5–32 символа, начинается с буквы. */
const USERNAME = /^[A-Za-z][A-Za-z0-9_]{4,31}$/;

/**
 * Пустая строка — поле не заполнено.
 * `@username` — нормальная ссылка или ник.
 * `null` — в поле что-то есть, но это не Telegram.
 */
export function normalizeTelegram(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const link = trimmed.match(/^(?:https?:\/\/)?(?:t\.me|telegram\.me)\/(@?[A-Za-z0-9_]{5,32})\/?$/i);
  const body = (link ? link[1] : trimmed).replace(/^@/, "");
  if (!USERNAME.test(body)) return null;
  return `@${body}`;
}
