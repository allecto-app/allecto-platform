'use node';

import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";

const FALLBACK_RESEND = new Resend(RESEND_API_KEY);
export const resend = FALLBACK_RESEND;
export const FROM =
    process.env.EMAIL_FROM ?? "Convites Allecto <convites@allecto.app>";

const isProduction = process.env.NODE_ENV === "production";

export async function sendEmail(args: Parameters<typeof Resend.prototype.emails.send>[0]) {
    if (!RESEND_API_KEY) {
        console.warn("[email] RESEND_API_KEY not configured; skipping email send.");
        return;
    }

    if (!isProduction) {
        console.log("[email] sending", {
            to: args.to,
            subject: args.subject,
        });
    }

    try {
        await resend.emails.send(args);
    } catch (error) {
        console.error("Failed to send email", error);
        if (!isProduction) {
            console.error("[email] payload", args);
        }
        throw error;
    }
}
