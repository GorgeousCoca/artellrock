import { cookies } from "next/headers";
import { createHash, timingSafeEqual } from "crypto";
import { SignJWT, jwtVerify } from "jose";

const ADMIN_COOKIE = "admin_session";
const SESSION_ISSUER = "kvartsevyy-aglomerat";
const SESSION_AUDIENCE = "admin";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

function getSessionSecret() {
  const configuredSecret = process.env.ADMIN_SESSION_SECRET?.trim();
  const fallbackSecret = `${process.env.ADMIN_EMAIL ?? ""}:${process.env.ADMIN_PASSWORD ?? ""}`.trim();
  const baseSecret =
    configuredSecret || (process.env.NODE_ENV === "development" ? fallbackSecret : "");

  if (!baseSecret.trim()) {
    return null;
  }

  return createHash("sha256").update(baseSecret).digest();
}

function safeEqual(expected: string | undefined, received: string) {
  if (!expected) {
    return false;
  }

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

function normalizeEmail(value: string | undefined) {
  return (value ?? "").trim().toLowerCase();
}

export async function isAdminAuthorized() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) {
    return false;
  }

  const secret = getSessionSecret();
  if (!secret) {
    return false;
  }

  try {
    await jwtVerify(token, secret, {
      issuer: SESSION_ISSUER,
      audience: SESSION_AUDIENCE
    });
    return true;
  } catch {
    return false;
  }
}

export async function createAdminSession() {
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error("Admin session secret is not configured");
  }

  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(SESSION_ISSUER)
    .setAudience(SESSION_AUDIENCE)
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_SECONDS
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete({ name: ADMIN_COOKIE, path: "/" });
}

export async function validateAdminCredentials(email: string, password: string) {
  return (
    safeEqual(normalizeEmail(process.env.ADMIN_EMAIL), normalizeEmail(email)) &&
    safeEqual(process.env.ADMIN_PASSWORD, password.trim())
  );
}
