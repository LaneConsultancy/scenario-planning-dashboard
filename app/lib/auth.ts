import { createHmac, timingSafeEqual } from "node:crypto";

export const AUTH_COOKIE_NAME = "dashboard-auth";
export const DEFAULT_SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

function sign(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function safeCompare(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function createDashboardSessionValue(
  secret: string,
  now: Date = new Date(),
  maxAgeSeconds: number = DEFAULT_SESSION_MAX_AGE_SECONDS
): string {
  const payload = Buffer.from(
    JSON.stringify({
      exp: Math.floor(now.getTime() / 1000) + maxAgeSeconds,
      iat: Math.floor(now.getTime() / 1000),
    })
  ).toString("base64url");

  return `${payload}.${sign(payload, secret)}`;
}

export function verifyDashboardSessionValue(
  value: string | undefined,
  secret: string | undefined,
  now: Date = new Date()
): boolean {
  if (!value || !secret) {
    return false;
  }

  const [payload, signature, extra] = value.split(".");
  if (!payload || !signature || extra) {
    return false;
  }

  const expectedSignature = sign(payload, secret);
  if (!safeCompare(signature, expectedSignature)) {
    return false;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as { exp?: unknown };
    if (typeof parsed.exp !== "number") {
      return false;
    }

    return parsed.exp > Math.floor(now.getTime() / 1000);
  } catch {
    return false;
  }
}

export function isAuthorizedCronRequest(
  authorizationHeader: string | null,
  configuredSecret: string | undefined
): boolean {
  if (!configuredSecret) {
    return false;
  }

  return authorizationHeader === `Bearer ${configuredSecret}`;
}
