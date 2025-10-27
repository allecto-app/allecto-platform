const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
export const DEFAULT_FROM = process.env.EMAIL_FROM ?? "Convites Allecto <convites@allecto.app>";
const NODE_ENV = process.env.NODE_ENV ?? "development";

async function postResend(payload: Record<string, unknown>) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Resend error ${response.status}: ${text}`);
  }
  return response.json();
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  from = DEFAULT_FROM,
}: {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}) {
  if (!RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY missing; subject:", subject);
    if (NODE_ENV !== "production") {
      console.info("[email] payload", { to, subject, html, text });
    }
    return;
  }

  try {
    await postResend({
      to,
      subject,
      html,
      text,
      from,
    });
    if (NODE_ENV !== "production") {
      console.log("[email] sent", { to, subject });
    }
  } catch (error) {
    console.error("[email] Failed to send email", error);
    throw error;
  }
}
