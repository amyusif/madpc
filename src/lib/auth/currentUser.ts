import { getSessionCookie } from "./cookies";
import { verifySessionToken } from "./jwt";

export interface AppUser {
  id: string;
  email: string;
  role: string;
}

export async function getCurrentUserFromCookie(): Promise<AppUser | null> {
  const token = await getSessionCookie();
  if (!token) return null;

  try {
    const payload = verifySessionToken(token);
    return { id: payload.sub, email: payload.email, role: payload.role };
  } catch {
    return null;
  }
}

