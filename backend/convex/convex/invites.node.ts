'use node';

import { action } from "./_generated/server";
import { v } from "convex/values";
import { normalizeEmail, randomToken, sha256 } from "./_secu";
import { resend as resendClient, FROM } from "./_email";
import { inviteError, DEFAULT_TTL_HOURS } from "./invites.shared";
import { internal } from "./_generated/api";

export const createAndEmail = action({
  args: {
    token: v.string(),
    condoId: v.id("condos"),
    email: v.string(),
    name: v.optional(v.string()),
    role: v.optional(v.string()),
    ttlHours: v.optional(v.number()),
    acceptBaseUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const { token, condoId, email, name, ttlHours, acceptBaseUrl } = args;
    const normalizedEmail = normalizeEmail(email);
    const trimmedName = name?.trim() || undefined;

    const authResult = await ctx.runMutation(internal.invites._authorizeInviteCreator, {
      token,
      condoId,
    });

    const now = Date.now();
    const ttlMs = (ttlHours ?? DEFAULT_TTL_HOURS) * 3600 * 1000;
    const expiresAt = now + ttlMs;

    const rawToken = randomToken(32);
    const tokenHash = await sha256(rawToken);

    const { inviteId } = await ctx.runMutation(internal.invites._createInviteRecord, {
      condoId,
      email: normalizedEmail,
      name: trimmedName,
      tokenHash,
      expiresAt,
      createdBy: authResult.createdBy,
      now,
    });

    let acceptUrl: string;
    try {
      const url = new URL(acceptBaseUrl);
      url.searchParams.set("token", rawToken);
      acceptUrl = url.toString();
    } catch {
      await ctx.runMutation(internal.invites._markInviteRevoked, { inviteId });
      throw inviteError();
    }

    try {
      const displayName = trimmedName ?? normalizedEmail;
      const subject = "Convite para ser Síndico no Allecto";
      const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <p>Olá ${displayName},</p>
          <p>Você foi convidado para assumir o papel de síndico no Allecto.</p>
          <p>Clique no botão abaixo para aceitar o convite:</p>
          <p>
            <a href="${acceptUrl}" style="display:inline-block;background:#0b5fff;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;">
              Aceitar convite
            </a>
          </p>
          <p>Se você não solicitou este convite, ignore esta mensagem.</p>
          <p>Abraços,<br/>Equipe Allecto</p>
        </div>
      `;
      const text = `Olá ${displayName},

Você foi convidado para assumir o papel de síndico no Allecto.

Use o link abaixo para aceitar o convite:
${acceptUrl}

Se você não solicitou este convite, ignore esta mensagem.

Abraços,
Equipe Allecto`;

      if (!process.env.RESEND_API_KEY) {
        console.warn(
          "[invites.createAndEmail] RESEND_API_KEY not configured; skipping email send.",
        );
        console.info(
          "[invites.createAndEmail] Accept URL for manual testing:",
          acceptUrl,
        );
      } else {
        await resendClient.emails.send({
          from: FROM,
          to: normalizedEmail,
          subject,
          html,
          text,
        });
      }
    } catch (error) {
      console.error("Failed to send invite email", error);
      await ctx.runMutation(internal.invites._markInviteRevoked, { inviteId });
      throw inviteError();
    }

    await ctx.runMutation(internal.invites._logSecurityEvent, {
      type: "invite_create",
      key: normalizedEmail,
      meta: { condoId, inviteId },
    });

    return { inviteId, sent: true };
  },
});

export const resend = action({
  args: {
    token: v.string(),
    inviteId: v.id("invites"),
  },
  handler: async () => {
    throw inviteError();
  },
});
