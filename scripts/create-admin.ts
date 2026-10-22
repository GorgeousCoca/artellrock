/**
 * Создаёт (или обновляет пароль у) администратора Payload.
 *
 *   $env:ADMIN_CREATE_EMAIL="admin@artellrock.local"; $env:ADMIN_CREATE_PASSWORD="..."; npm run admin:create
 */
import { existsSync } from "node:fs";
import path from "node:path";

import { getPayload } from "payload";

import config from "../src/payload.config";

const envPath = path.resolve(process.cwd(), ".env");
if (existsSync(envPath)) {
  try {
    process.loadEnvFile(envPath);
  } catch {
    // переменные уже заданы окружением
  }
}

const email = process.env.ADMIN_CREATE_EMAIL?.trim();
const password = process.env.ADMIN_CREATE_PASSWORD;

if (!email || !password) {
  console.error("Задайте ADMIN_CREATE_EMAIL и ADMIN_CREATE_PASSWORD.");
  process.exit(1);
}

try {
  const payload = await getPayload({ config });
  const existing = await payload.find({
    collection: "users",
    where: { email: { equals: email } },
    limit: 1
  });

  if (existing.docs[0]) {
    await payload.update({ collection: "users", id: existing.docs[0].id, data: { password } });
    console.log(`Пароль обновлён: ${email}`);
  } else {
    await payload.create({ collection: "users", data: { email, password } });
    console.log(`Создан администратор: ${email}`);
  }
  process.exit(0);
} catch (error) {
  console.error(error);
  process.exit(1);
}
