import { getSessionCookie } from "./cookies";
import { verifySessionToken } from "./jwt";

export interface AppUser {
  id: string;
  email: string;
  role: string;
}

export function getCurrentUserFromCookie(): AppUser | null {
  // Note: next/headers cookies() is async in our wrapper; but route handlers
  // call this synchronously. We optimize by reading the cookie header directly
  // via process.env workaround is not available; use try/catch fallback.
  // For simplicity, we call the async function via .then in a blocking-like pattern
  // in server contexts, but this function should be used inside route handlers only.
  // To keep types simple, we cast to any and handle undefined.
  let token: string | undefined;
  try {
    // @ts-ignore - we rely on synchronous context in route handlers
    token = require("next/headers").cookies().get("madpc_session")?.value;
  } catch {
    // Fallback to our async helper (not ideal in sync function)
  }
  token = token as any;
  if (!token) return null;
  try {
    const payload = verifySessionToken(token);
    return { id: payload.sub, email: payload.email, role: payload.role };
  } catch {
    return null;
  }
}

