/**
 * Transactional email for Poor Man Protection certificates.
 * Prefers RESEND_API_KEY + RESEND_FROM_EMAIL env (ziontpiper production).
 */
export async function sendProtectionEmail(opts: {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{ filename: string; content: Buffer; contentType: string }>;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.RESEND_FROM_EMAIL?.trim() ||
    process.env.EMAIL_FROM?.trim() ||
    "ZZAI Protection <onboarding@resend.dev>";

  if (!apiKey) {
    return {
      ok: false,
      error:
        "Email delivery is not configured (RESEND_API_KEY). Download the court PDF pack instead, or ask an admin to set Resend.",
    };
  }

  try {
    const body: Record<string, unknown> = {
      from,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
    };
    if (opts.attachments?.length) {
      body.attachments = opts.attachments.map((a) => ({
        filename: a.filename,
        content: a.content.toString("base64"),
        content_type: a.contentType,
      }));
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as { id?: string; message?: string };
    if (!res.ok) return { ok: false, error: data.message || `HTTP ${res.status}` };
    return { ok: true, id: data.id };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export function buildCertificateEmailHtml(opts: {
  title: string;
  attestationId: string;
  contentHash: string;
  verifyUrl?: string;
  recipientName?: string;
}): string {
  const greet = opts.recipientName ? `Hi ${opts.recipientName},` : "Hello,";
  return `<!doctype html><html><body style="font-family:Georgia,serif;background:#0b1220;color:#e8eef6;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#121a2b;border:1px solid #5B8DA855;border-radius:16px;padding:28px">
    <p style="color:#5B8DA8;letter-spacing:.2em;font-size:11px;text-transform:uppercase">zzai zzai · Poor Man Protection</p>
    <h1 style="font-size:22px;margin:8px 0 16px">Your evidentiary package is sealed</h1>
    <p>${greet}</p>
    <p>This email is an official delivery channel for your ZZAI protection package regarding <strong>${escapeHtml(opts.title)}</strong>.</p>
    <ul>
      <li>Attestation ID: <code>${escapeHtml(opts.attestationId)}</code></li>
      <li>Content SHA-256: <code style="word-break:break-all">${escapeHtml(opts.contentHash)}</code></li>
    </ul>
    <p>Attached (when available): court PDF evidence pack. Keep this email — message headers provide an independent timestamped trail.</p>
    ${
      opts.verifyUrl
        ? `<p><a href="${escapeHtml(opts.verifyUrl)}" style="color:#5B8DA8">Open public verify page</a></p>`
        : ""
    }
    <p style="font-size:12px;color:#9aa7b8;margin-top:24px">Not a government copyright/patent registration. Retain originals offline. Consult IP counsel for litigation strategy.</p>
  </div></body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
