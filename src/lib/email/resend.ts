import { Resend } from "resend";

// Normalize API key: trim whitespace and surrounding quotes if any
const rawKey = process.env.RESEND_API_KEY || "";
const apiKey = rawKey.trim().replace(/^['"]|['"]$/g, "");

export function getResend() {
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");
  return new Resend(apiKey);
}

export const EMAIL_FROM = process.env.EMAIL_FROM || "MADPC <no-reply@example.com>";

