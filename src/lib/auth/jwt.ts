import jwt from "jsonwebtoken";

const DEFAULT_EXP_SECONDS = 60 * 60 * 8; // 8 hours

const AUTH_SECRET = process.env.AUTH_SECRET;
if (!AUTH_SECRET) {
  // We don't throw at import time to avoid build-time crashes in some environments
  // Runtime checks will throw if used without a secret
}

export interface SessionTokenPayload {
  sub: string; // user id
  email: string;
  role: string;
}

export function signSessionToken(payload: SessionTokenPayload, expSeconds = DEFAULT_EXP_SECONDS) {
  if (!AUTH_SECRET) throw new Error("AUTH_SECRET is not set");
  return jwt.sign(payload, AUTH_SECRET, { algorithm: "HS256", expiresIn: expSeconds });
}

export function verifySessionToken(token: string): SessionTokenPayload & { iat: number; exp: number } {
  if (!AUTH_SECRET) throw new Error("AUTH_SECRET is not set");
  return jwt.verify(token, AUTH_SECRET) as any;
}

