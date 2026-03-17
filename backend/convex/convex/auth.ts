// convex/auth.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import bcrypt from "bcryptjs";
import { internal } from "./_generated/api";
import { loadSession } from "./guards";
import { enforceRateLimit, recordSecurityEvent } from "./lib/security";

const GENERIC_AUTH_ERROR = "Invalid email or password";
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 5;
const RATE_LIMIT_LOCK_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS_PER_IP = 20;
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const SESSION_TOKEN_BYTES = 48;
const BCRYPT_COST = 12;
const FALLBACK_PASSWORD_HASH = "$2b$10$CwTycUXWue0Thq9StjUM0uJ8p6hX6YsJhBKt3vnDnN/SfXlBx/6C6";
const RESIDENT_ALLOWED_ROLES = new Set(["syndic", "manager", "resident", "council"]);
const SEND_OTP_TEMPLATE_ID = process.env.RESEND_TEMPLATE_SEND_OTP ?? "";
const OTP_RATE_WINDOW_MS = 15 * 60 * 1000;
const OTP_RATE_LIMIT_PER_EMAIL = 5;
const RESET_RATE_LIMIT_PER_EMAIL = 5;

async function sendOtpEmail(
    ctx: any,
    {
        to,
        subject,
        code,
        condoName,
        userName,
        fallbackHtml,
        fallbackText,
    }: {
        to: string;
        subject: string;
        code: string;
        condoName: string;
        userName: string;
        fallbackHtml: string;
        fallbackText: string;
    },
) {
    if (SEND_OTP_TEMPLATE_ID) {
        await ctx.scheduler.runAfter(0, internal.email.send, {
            to,
            subject,
            template: {
                id: SEND_OTP_TEMPLATE_ID,
                variables: {
                    OTP_CODE: code,
                    CONDO_NAME: condoName,
                    USER_NAME: userName,
                },
            },
        });
        return;
    }

    await ctx.scheduler.runAfter(0, internal.email.send, {
        to,
        subject,
        html: fallbackHtml,
        text: fallbackText,
    });
}

async function listResidentCondosForEmail(ctx: any, email: string, onlyRole?: string) {
    const cleanedEmail = email.trim().toLowerCase();
    if (!cleanedEmail) {
        return [];
    }

    const residents = await ctx.db
        .query("residents")
        .withIndex("byEmail", (q: any) => q.eq("email", cleanedEmail))
        .collect();

    const eligibleResidents = residents.filter((resident: any) => {
        if (resident.isActive === false) return false;
        if (onlyRole) {
            return resident.role === onlyRole;
        }
        return RESIDENT_ALLOWED_ROLES.has(resident.role);
    });
    if (eligibleResidents.length === 0) {
        return [];
    }

    const condoIds = Array.from(new Set(eligibleResidents.map((resident: any) => resident.condoId)));
    const condos = await Promise.all(condoIds.map((condoId) => ctx.db.get(condoId)));

    return condos
        .filter((condo): condo is NonNullable<typeof condo> => Boolean(condo))
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
        .map((condo) => ({
            _id: condo._id,
            _creationTime: condo._creationTime,
            name: condo.name,
            subdomain: condo.subdomain,
            condoId: condo._id,
            condoName: condo.name,
            condoSubdomain: condo.subdomain,
            branding: condo.branding,
            timezone: condo.timezone,
            isActive: condo.isActive,
            disabledAt: condo.disabledAt,
            billingTier: condo.billingTier,
            billingStatus: condo.billingStatus,
            onboardingTokenVersion: condo.onboardingTokenVersion,
            createdAt: condo.createdAt,
            updatedAt: condo.updatedAt,
        }));
}

const bytesToHex = (bytes: Uint8Array) =>
    Array.from(bytes)
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");

async function digestToken(token: string) {
    const data = new TextEncoder().encode(token);
    const buffer = await crypto.subtle.digest("SHA-256", data);
    return bytesToHex(new Uint8Array(buffer));
}

function generateSessionToken() {
    const bytes = new Uint8Array(SESSION_TOKEN_BYTES);
    crypto.getRandomValues(bytes);
    return bytesToHex(bytes);
}

function generateResetCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export const requestOtp = mutation({
    args: { condoId: v.id("condos"), email: v.optional(v.string()), phone: v.optional(v.string()) },
    handler: async (ctx, a) => {
        if (!a.email && !a.phone) throw new Error("Provide email or phone");
        const now = Date.now();
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = now + 15 * 60 * 1000;
        await ctx.db.insert("otps", {
            condoId: a.condoId,
            email: a.email,
            phone: a.phone,
            code,
            expiresAt,
            createdAt: now,
        });
        if (a.email) {
            const subject = "Seu código de acesso - Allecto";
            const html = `
              <div style="font-family: Arial, sans-serif; line-height: 1.5;">
                <p>Olá!</p>
                <p>Seu código de acesso é:</p>
                <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${code}</p>
                <p>Ele expira em 15 minutos.</p>
                <p>Se você não solicitou este acesso, ignore este email.</p>
              </div>
            `;
            const text = `Olá!

Seu código de acesso é: ${code}

Ele expira em 15 minutos.
Se você não solicitou este acesso, ignore este email.`;
            try {
                await sendOtpEmail(ctx, {
                    to: a.email,
                    subject,
                    code,
                    condoName: "Allecto",
                    userName: "Olá",
                    fallbackHtml: html,
                    fallbackText: text,
                });
            } catch (error) {
                console.error("Failed to send OTP email", error);
            }
        }
        return { ok: true, devCode: code };
    },
});

export const verifyOtp = mutation({
    args: {
        condoId: v.id("condos"),
        email: v.optional(v.string()),
        phone: v.optional(v.string()),
        code: v.string(),
    },
    handler: async (ctx, a) => {
        const now = Date.now();
        const otp = a.email
            ? await ctx.db
                .query("otps")
                .withIndex("byCondoEmail", (q) => q.eq("condoId", a.condoId).eq("email", a.email))
                .order("desc")
                .first()
            : await ctx.db
                .query("otps")
                .withIndex("byCondoPhone", (q) => q.eq("condoId", a.condoId).eq("phone", a.phone))
                .order("desc")
                .first();

        if (!otp || otp.code !== a.code) throw new Error("Invalid code");
        if (otp.expiresAt < now) throw new Error("Code expired");
        await ctx.db.patch(otp._id, { consumedAt: now });

        // Issue session/JWT in your edge/app layer as you prefer
        return { ok: true };
    },
});

export const listResidentCondosByEmail = mutation({
    args: { email: v.string() },
    handler: async (ctx, { email }) => {
        return await listResidentCondosForEmail(ctx, email);
    },
});

export const listResidentCondosForSession = query({
    args: { sessionToken: v.string() },
    handler: async (ctx, { sessionToken }) => {
        const session = await loadSession(ctx, sessionToken);
        if (session.type !== "resident" || !session.residentId) {
            throw new Error("Unauthorized");
        }

        const resident = await ctx.db.get(session.residentId);
        if (!resident || resident.isActive === false || resident.role !== "syndic" || !resident.email) {
            throw new Error("Forbidden");
        }

        return await listResidentCondosForEmail(ctx, resident.email, "syndic");
    },
});

export const requestResidentOtp = mutation({
    args: {
        email: v.string(),
        condoId: v.optional(v.id("condos")),
        subdomain: v.optional(v.string()),
        ip: v.optional(v.string()),
    },
    handler: async (ctx, { condoId, subdomain, email, ip }) => {
        const cleanedEmail = email.trim().toLowerCase();
        const cleanedSubdomain = subdomain?.trim().toLowerCase() ?? "";
        if (!cleanedEmail || (!condoId && !cleanedSubdomain)) return { ok: true };

        const condo = condoId
            ? await ctx.db.get(condoId)
            : await ctx.db
                .query("condos")
                .withIndex("bySubdomain", (q) => q.eq("subdomain", cleanedSubdomain))
                .unique();
        if (!condo) return { ok: true };

        const resident = await ctx.db
            .query("residents")
            .withIndex("byCondoEmail", (q) => q.eq("condoId", condo._id).eq("email", cleanedEmail))
            .unique();
        if (!resident || !RESIDENT_ALLOWED_ROLES.has(resident.role) || resident.isActive === false) {
            return { ok: true };
        }

        const limiter = await enforceRateLimit(ctx, {
            scope: "resident_otp_request",
            key: `${condo._id}:${cleanedEmail}`,
            limit: OTP_RATE_LIMIT_PER_EMAIL,
            windowMs: OTP_RATE_WINDOW_MS,
        });
        if (limiter.limited) {
            await recordSecurityEvent(
                ctx,
                "resident_otp_rate_limited",
                cleanedEmail,
                { condoId: condo._id, ip: ip?.trim() || null },
                "warn",
            );
            return { ok: true };
        }

        const now = Date.now();
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = now + 15 * 60 * 1000;
        await ctx.db.insert("otps", {
            condoId: condo._id,
            email: cleanedEmail,
            code,
            expiresAt,
            createdAt: now,
        });

        const subject = `Seu código de acesso - ${condo.name}`;
        const html = `
          <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <p>Olá ${resident.name ?? "Síndico(a)"}!</p>
            <p>Seu código de acesso ao portal do condomínio <strong>${condo.name}</strong> é:</p>
            <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${code}</p>
            <p>Ele expira em 15 minutos. Não compartilhe este código com ninguém.</p>
            <p>Se você não solicitou este acesso, pode ignorar este email.</p>
            <p>Equipe Allecto</p>
          </div>
        `;
        const text = `Olá ${resident.name ?? "Síndico(a)"}!

Seu código de acesso ao portal do condomínio ${condo.name} é: ${code}

O código expira em 15 minutos. Não compartilhe este código com ninguém.
Se você não solicitou este acesso, ignore este email.

Equipe Allecto`;

        try {
            await sendOtpEmail(ctx, {
                to: cleanedEmail,
                subject,
                code,
                condoName: condo.name,
                userName: resident.name ?? "Síndico(a)",
                fallbackHtml: html,
                fallbackText: text,
            });
        } catch (error) {
            console.error("Failed to send resident OTP email", error);
        }

        await recordSecurityEvent(ctx, "resident_otp_requested", cleanedEmail, {
            condoId: condo._id,
            residentId: resident._id,
            ip: ip?.trim() || null,
        });

        const includeDevCode = process.env.NODE_ENV !== "production" || !process.env.RESEND_API_KEY;
        return { ok: true, devCode: includeDevCode ? code : undefined };
    },
});

export const residentSignIn = mutation({
    args: {
        email: v.string(),
        code: v.string(),
        ip: v.optional(v.string()),
        condoId: v.optional(v.id("condos")),
        subdomain: v.optional(v.string()),
    },
    handler: async (ctx, { condoId, subdomain, email, code, ip }) => {
        const now = Date.now();
        const cleanedSubdomain = subdomain?.trim().toLowerCase() ?? "";
        const cleanedEmail = email.trim().toLowerCase();
        const trimmedCode = code.trim();
        const clientIp = (ip?.trim() ?? "") || "unknown";

        if ((!condoId && !cleanedSubdomain) || !cleanedEmail || trimmedCode.length === 0) {
            throw new Error(GENERIC_AUTH_ERROR);
        }

        const condo = condoId
            ? await ctx.db.get(condoId)
            : await ctx.db
                .query("condos")
                .withIndex("bySubdomain", (q) => q.eq("subdomain", cleanedSubdomain))
                .unique();
        if (!condo) {
            await recordSecurityEvent(
                ctx,
                "resident_login_failed",
                cleanedEmail || "unknown",
                { reason: "condo_not_found", ip: clientIp },
                "warn",
            );
            throw new Error(GENERIC_AUTH_ERROR);
        }

        const limiter = await enforceRateLimit(ctx, {
            scope: "resident_login",
            key: `${condo._id}:${cleanedEmail}:${clientIp}`,
            limit: RATE_LIMIT_MAX_ATTEMPTS,
            windowMs: RATE_LIMIT_WINDOW_MS,
            blockMs: RATE_LIMIT_LOCK_MS,
        });
        if (limiter.limited) {
            await recordSecurityEvent(
                ctx,
                "resident_login_rate_limited",
                cleanedEmail,
                { condoId: condo._id, ip: clientIp },
                "warn",
            );
            throw new Error(GENERIC_AUTH_ERROR);
        }

        const resident = await ctx.db
            .query("residents")
            .withIndex("byCondoEmail", (q) => q.eq("condoId", condo._id).eq("email", cleanedEmail))
            .unique();
        if (!resident || !RESIDENT_ALLOWED_ROLES.has(resident.role) || resident.isActive === false) {
            await recordSecurityEvent(ctx, "resident_login_failed", cleanedEmail, {
                condoId: condo._id,
                reason: "resident_not_eligible",
                ip: clientIp,
            }, "warn");
            throw new Error(GENERIC_AUTH_ERROR);
        }

        const otp = await ctx.db
            .query("otps")
            .withIndex("byCondoEmail", (q) => q.eq("condoId", condo._id).eq("email", cleanedEmail))
            .order("desc")
            .first();
        if (!otp || otp.code !== trimmedCode) {
            await recordSecurityEvent(ctx, "resident_login_failed", cleanedEmail, {
                condoId: condo._id,
                reason: "otp_mismatch",
                ip: clientIp,
            }, "warn");
            throw new Error(GENERIC_AUTH_ERROR);
        }
        if (otp.expiresAt < now || otp.consumedAt) {
            await recordSecurityEvent(ctx, "resident_login_failed", cleanedEmail, {
                condoId: condo._id,
                reason: "otp_expired_or_used",
                ip: clientIp,
            }, "warn");
            throw new Error(GENERIC_AUTH_ERROR);
        }

        await ctx.db.patch(otp._id, { consumedAt: now });

        const rawToken = generateSessionToken();
        const tokenDigest = await digestToken(rawToken);
        const tokenHash = bcrypt.hashSync(rawToken, BCRYPT_COST);
        const expiresAt = now + SESSION_TTL_MS;

        await ctx.db.insert("sessions", {
            tokenDigest,
            tokenHash,
            type: "resident",
            residentId: resident._id,
            condoId: condo._id,
            roles: [resident.role],
            createdAt: now,
            expiresAt,
            lastUsedAt: now,
            ip: clientIp,
        });

        await recordSecurityEvent(ctx, "resident_login_success", cleanedEmail, {
            condoId: condo._id,
            residentId: resident._id,
            ip: clientIp,
        });

        return {
            success: true,
            token: rawToken,
            residentId: resident._id,
            condoId: condo._id,
            condo: { name: condo.name, subdomain: condo.subdomain },
            roles: [resident.role],
            name: resident.name,
            expiresAt,
        };
    },
});

export const requestPasswordReset = mutation({
    args: {
        email: v.string(),
    },
    handler: async (ctx, { email }) => {
        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail) {
            return { ok: true };
        }

        const limiter = await enforceRateLimit(ctx, {
            scope: "password_reset_request",
            key: normalizedEmail,
            limit: RESET_RATE_LIMIT_PER_EMAIL,
            windowMs: OTP_RATE_WINDOW_MS,
            blockMs: OTP_RATE_WINDOW_MS,
        });
        if (limiter.limited) {
            await recordSecurityEvent(ctx, "password_reset_rate_limited", normalizedEmail, undefined, "warn");
            return { ok: true };
        }

        const user = await ctx.db
            .query("platformUsers")
            .withIndex("byEmail", (q) => q.eq("email", normalizedEmail))
            .unique();

        if (!user || !user.passwordHash) {
            // Always respond success to avoid leaking account existence
            return { ok: true };
        }

        const now = Date.now();
        const code = generateResetCode();
        const codeHash = bcrypt.hashSync(code, BCRYPT_COST);
        const expiresAt = now + 15 * 60 * 1000;

        const existing = await ctx.db
            .query("passwordResets")
            .withIndex("byEmail", (q) => q.eq("email", normalizedEmail))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                codeHash,
                expiresAt,
                createdAt: now,
                usedAt: undefined,
            });
        } else {
            await ctx.db.insert("passwordResets", {
                email: normalizedEmail,
                codeHash,
                expiresAt,
                createdAt: now,
                usedAt: undefined,
            });
        }

        const subject = "Redefinição de senha - Allecto Admin";
        const html = `
          <p>Olá${user.name ? ` ${user.name}` : ""}!</p>
          <p>Recebemos uma solicitação para redefinir a sua senha do portal Allecto Admin.</p>
          <p>Use o código abaixo para continuar com a redefinição:</p>
          <p style="font-size:24px;font-weight:bold;letter-spacing:6px;">${code}</p>
          <p>O código expira em 15 minutos.</p>
          <p>Se você não solicitou esta ação, ignore este email.</p>
        `;
        const text = `Olá${user.name ? ` ${user.name}` : ""}!

Recebemos uma solicitação para redefinir a sua senha do portal Allecto Admin.

Use este código para continuar a redefinição: ${code}

O código expira em 15 minutos.
Se você não solicitou esta ação, basta ignorar esta mensagem.`;

        try {
            await ctx.scheduler.runAfter(0, internal.email.send, {
                to: normalizedEmail,
                subject,
                html,
                text,
            });
        } catch (error) {
            console.error("Failed to send password reset email", error);
        }

        await recordSecurityEvent(ctx, "password_reset_requested", normalizedEmail, {
            platformUserId: user._id,
        });

        const includeDevCode = process.env.NODE_ENV !== "production" || !process.env.RESEND_API_KEY;
        return { ok: true, devCode: includeDevCode ? code : undefined };
    },
});

export const resetPassword = mutation({
    args: {
        email: v.string(),
        code: v.string(),
        newPassword: v.string(),
    },
    handler: async (ctx, { email, code, newPassword }) => {
        const normalizedEmail = email.trim().toLowerCase();
        const trimmedCode = code.trim();
        const sanitizedPassword = newPassword.trim();

        const limiter = await enforceRateLimit(ctx, {
            scope: "password_reset_confirm",
            key: normalizedEmail,
            limit: RATE_LIMIT_MAX_ATTEMPTS,
            windowMs: OTP_RATE_WINDOW_MS,
            blockMs: OTP_RATE_WINDOW_MS,
        });
        if (limiter.limited) {
            await recordSecurityEvent(ctx, "password_reset_confirm_rate_limited", normalizedEmail, undefined, "warn");
            throw new Error("INVALID_CODE");
        }

        if (!normalizedEmail || trimmedCode.length === 0 || sanitizedPassword.length === 0) {
            throw new Error("INVALID_CODE");
        }
        if (sanitizedPassword.length < 8) {
            throw new Error("WEAK_PASSWORD");
        }

        const resetRecord = await ctx.db
            .query("passwordResets")
            .withIndex("byEmail", (q) => q.eq("email", normalizedEmail))
            .first();

        if (
            !resetRecord ||
            resetRecord.usedAt ||
            resetRecord.expiresAt <= Date.now()
        ) {
            await recordSecurityEvent(ctx, "password_reset_failed", normalizedEmail, {
                reason: "reset_record_invalid",
            }, "warn");
            throw new Error("INVALID_CODE");
        }

        const validCode = bcrypt.compareSync(trimmedCode, resetRecord.codeHash);
        if (!validCode) {
            await recordSecurityEvent(ctx, "password_reset_failed", normalizedEmail, {
                reason: "invalid_code",
            }, "warn");
            throw new Error("INVALID_CODE");
        }

        const user = await ctx.db
            .query("platformUsers")
            .withIndex("byEmail", (q) => q.eq("email", normalizedEmail))
            .unique();
        if (!user) {
            await recordSecurityEvent(ctx, "password_reset_failed", normalizedEmail, {
                reason: "user_not_found",
            }, "warn");
            throw new Error("INVALID_CODE");
        }

        const newHash = bcrypt.hashSync(sanitizedPassword, BCRYPT_COST);
        await ctx.db.patch(user._id, { passwordHash: newHash });

        await ctx.db.patch(resetRecord._id, { usedAt: Date.now() });

        await recordSecurityEvent(ctx, "password_reset_success", normalizedEmail, {
            platformUserId: user._id,
        });

        return { ok: true };
    },
});

export const adminSignIn = mutation({
    args: {
        email: v.string(),
        password: v.string(),
        ip: v.optional(v.string()),
    },
    handler: async (ctx, { email, password, ip }) => {
        const now = Date.now();
        const normalizedEmail = email.trim().toLowerCase();
        const clientIp = (ip?.trim() ?? "") || "unknown";

        const attemptRecord = await ctx.db
            .query("loginAttempts")
            .withIndex("byEmailIp", (q) => q.eq("email", normalizedEmail).eq("ip", clientIp))
            .unique();

        if (attemptRecord?.blockedUntil && attemptRecord.blockedUntil > now) {
            await recordSecurityEvent(ctx, "platform_login_rate_limited", normalizedEmail, {
                ip: clientIp,
                blockedUntil: attemptRecord.blockedUntil,
            }, "warn");
            throw new Error(GENERIC_AUTH_ERROR);
        }

        // Global IP-based throttling (aggregated within window)
        const ipAttempts = await ctx.db
            .query("loginAttempts")
            .withIndex("byIp", (q) => q.eq("ip", clientIp))
            .collect();
        let recentIpAttempts = 0;
        for (const attempt of ipAttempts) {
            if (now - attempt.lastAttemptAt <= RATE_LIMIT_WINDOW_MS) {
                recentIpAttempts += attempt.attempts;
            }
        }
        if (recentIpAttempts >= RATE_LIMIT_MAX_ATTEMPTS_PER_IP) {
            await recordSecurityEvent(ctx, "platform_login_rate_limited", normalizedEmail, {
                ip: clientIp,
                reason: "ip_throttle",
            }, "warn");
            throw new Error(GENERIC_AUTH_ERROR);
        }

        const user = await ctx.db
            .query("platformUsers")
            .withIndex("byEmail", (q) => q.eq("email", normalizedEmail))
            .unique();

        const passwordHash = user?.passwordHash ?? null;
        const hashToCompare = passwordHash ?? FALLBACK_PASSWORD_HASH;
        const passwordMatches = bcrypt.compareSync(password, hashToCompare);
        const authenticated = Boolean(user && passwordHash && passwordMatches);

        if (!authenticated) {
            let attempts = 0;
            let firstAttemptAt = now;
            if (attemptRecord) {
                const withinWindow = now - attemptRecord.lastAttemptAt <= RATE_LIMIT_WINDOW_MS;
                attempts = withinWindow ? attemptRecord.attempts : 0;
                firstAttemptAt = withinWindow ? attemptRecord.firstAttemptAt : now;
            }
            attempts += 1;
            const blockedUntil = attempts >= RATE_LIMIT_MAX_ATTEMPTS ? now + RATE_LIMIT_LOCK_MS : undefined;

            if (attemptRecord) {
                await ctx.db.patch(attemptRecord._id, {
                    attempts,
                    firstAttemptAt,
                    lastAttemptAt: now,
                    blockedUntil,
                });
            } else {
                await ctx.db.insert("loginAttempts", {
                    email: normalizedEmail,
                    ip: clientIp,
                    attempts,
                    firstAttemptAt,
                    lastAttemptAt: now,
                    blockedUntil,
                });
            }
            await recordSecurityEvent(ctx, "platform_login_failed", normalizedEmail, {
                ip: clientIp,
                attempts,
            }, attempts >= RATE_LIMIT_MAX_ATTEMPTS ? "warn" : "info");
            throw new Error(GENERIC_AUTH_ERROR);
        }

        if (!user) {
            throw new Error(GENERIC_AUTH_ERROR);
        }

        if (attemptRecord) {
            await ctx.db.delete(attemptRecord._id);
        }

        await ctx.db.patch(user._id, {
            lastLoginAt: now,
        });

        const rawToken = generateSessionToken();
        const tokenDigest = await digestToken(rawToken);
        const tokenHash = bcrypt.hashSync(rawToken, BCRYPT_COST);
        const expiresAt = now + SESSION_TTL_MS;

        await ctx.db.insert("sessions", {
            tokenDigest,
            tokenHash,
            type: "platform",
            platformUserId: user._id,
            roles: user.roles,
            createdAt: now,
            expiresAt,
            lastUsedAt: now,
            ip: clientIp,
        });

        await recordSecurityEvent(ctx, "platform_login_success", normalizedEmail, {
            platformUserId: user._id,
            roles: user.roles,
            ip: clientIp,
        });

        return {
            success: true,
            token: rawToken,
            userId: user._id,
            roles: user.roles,
            name: user.name ?? "",
            expiresAt,
        };
    },
});


export const logout = mutation({
    args: { token: v.string() },
    handler: async (ctx, { token }) => {
        if (!token || token.length < 32) return { success: true };
        const digest = await digestToken(token);
        const session = await ctx.db
            .query("sessions")
            .withIndex("byDigest", (q) => q.eq("tokenDigest", digest))
            .unique();
        if (!session) return { success: true };
        await ctx.db.patch(session._id, {
            revokedAt: Date.now(),
        });
        await recordSecurityEvent(ctx, "session_logout", String(session.platformUserId ?? session.residentId ?? "unknown"), {
            sessionType: session.type,
            condoId: session.condoId ?? null,
        });
        return { success: true };
    },
});
