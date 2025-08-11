export function buildNotificationHtml(opts: { subject: string; message: string; orgName?: string }) {
  const { subject, message, orgName = "MADPC" } = opts;
  // Very simple HTML template with inline-safe styles
  return `
  <div style="font-family: Arial, sans-serif; background:#f6f9fc; padding:24px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e6eaf1;">
      <tr>
        <td style="background:#0f62fe;color:#ffffff;padding:16px 20px;font-size:18px;font-weight:600;">
          ${escapeHtml(orgName)} Notification
        </td>
      </tr>
      <tr>
        <td style="padding:20px;">
          <h1 style="margin:0 0 12px 0;font-size:18px;color:#111827;">${escapeHtml(subject)}</h1>
          <div style="font-size:14px;line-height:1.6;color:#374151;white-space:pre-wrap;">${nl2br(escapeHtml(message))}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 20px;color:#6b7280;font-size:12px;background:#f9fafb;border-top:1px solid #e6eaf1;">
          This email was sent by ${escapeHtml(orgName)}. Please do not share sensitive information over email.
        </td>
      </tr>
    </table>
  </div>
  `;
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function nl2br(str: string) {
  return str.replace(/\r?\n/g, "<br/>");
}

