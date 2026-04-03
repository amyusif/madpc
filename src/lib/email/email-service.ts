import nodemailer, { Transporter } from "nodemailer";

type SendEmailOptions = {
  from?: string;
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{ filename: string; content: any; contentType?: string }>;
};

type SendEmailResult =
  | { success: true; messageId: string }
  | { success: false; error: string };

let cachedTransporter: Transporter | null = null;

function getBooleanEnv(value: string | undefined, fallback = false) {
  if (value === undefined) return fallback;
  return String(value).toLowerCase() === "true";
}

function buildTransporter(): Transporter {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST || "";
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = getBooleanEnv(process.env.SMTP_SECURE, false);
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";

  if (!host || !user || !pass) {
    throw new Error(
      "SMTP configuration missing: ensure SMTP_HOST, SMTP_USER, and SMTP_PASS are set"
    );
  }

  // Support common shorthand for Gmail
  const isGmail =
    host.toLowerCase() === "gmail" || host.toLowerCase() === "google";

  cachedTransporter = isGmail
    ? nodemailer.createTransport({
        service: "gmail",
        auth: {
          user,
          pass,
        },
      })
    : nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });

  return cachedTransporter;
}

export async function sendEmail(
  options: SendEmailOptions
): Promise<SendEmailResult> {
  try {
    const transporter = buildTransporter();
    const from =
      options.from || process.env.SMTP_FROM || process.env.SMTP_USER || "";
    if (!from)
      return {
        success: false,
        error: "Missing 'from' address (set SMTP_FROM or SMTP_USER)",
      };

    const info = await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      cc: options.cc,
      bcc: options.bcc,
      attachments: options.attachments,
    });

    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}
