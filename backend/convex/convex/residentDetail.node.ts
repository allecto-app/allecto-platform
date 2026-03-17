'use node';

import { action } from "./_generated/server";
import { v } from "convex/values";
import { sendEmail, DEFAULT_FROM } from "./lib/email";
import { normalizeEmail } from "./_secu";
import { requireCondoRole, requirePlatformRole } from "./guards";

const SEND_OTP_TEMPLATE_ID = process.env.RESEND_TEMPLATE_SEND_OTP ?? "";

export const resendOtp = action({
  args: { sessionToken: v.optional(v.string()), residentId: v.id("residents") },
  handler: async (ctx: any, { sessionToken, residentId }) => {
    const resident = await ctx.db.get(residentId);
    if (!resident?.email) {
      throw new Error("Residente sem email cadastrado");
    }
    if (sessionToken) {
      try {
        await requirePlatformRole(ctx, ["super_admin", "ops", "support"], sessionToken);
      } catch {
        await requireCondoRole(ctx, resident.condoId, ["syndic", "manager"], sessionToken);
      }
    }

    const condo = await ctx.db.get(resident.condoId);
    if (!condo?.subdomain) {
      throw new Error("Condomínio sem subdomínio cadastrado");
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const now = Date.now();
    const expiresAt = now + 15 * 60 * 1000;

    await ctx.db.insert("otps", {
      condoId: resident.condoId,
      email: normalizeEmail(resident.email),
      code,
      expiresAt,
      createdAt: now,
    });

    const subject = `Seu código de acesso - ${condo.name ?? "Allecto"}`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <p>Olá ${resident.name ?? "Síndico(a)"}!</p>
        <p>Seu código de acesso ao portal do condomínio <strong>${condo.name ?? ""}</strong> é:</p>
        <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${code}</p>
        <p>Ele expira em 15 minutos. Não compartilhe este código com ninguém.</p>
        <p>Se você não solicitou este acesso, pode ignorar este email.</p>
        <p>Equipe Allecto</p>
      </div>
    `;
    const text = `Olá ${resident.name ?? "Síndico(a)"}!

Seu código de acesso ao portal do condomínio ${condo.name ?? ""} é: ${code}

O código expira em 15 minutos. Não compartilhe este código com ninguém.
Se você não solicitou este acesso, ignore este email.

Equipe Allecto`;

    try {
      await sendEmail(
        SEND_OTP_TEMPLATE_ID
          ? {
              to: resident.email,
              subject,
              template: {
                id: SEND_OTP_TEMPLATE_ID,
                variables: {
                  OTP_CODE: code,
                  CONDO_NAME: condo.name ?? "Allecto",
                  USER_NAME: resident.name ?? "Síndico(a)",
                },
              },
              from: DEFAULT_FROM,
            }
          : {
              to: resident.email,
              subject,
              html,
              text,
              from: DEFAULT_FROM,
            },
      );
    } catch (error) {
      console.error("[residentDetail.resendOtp] Failed to send OTP email", error);
    }

    return { ok: true };
  },
});
