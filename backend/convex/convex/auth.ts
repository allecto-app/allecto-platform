// convex/auth.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import bcrypt from "bcryptjs";
import { FROM, sendEmail } from "./_email";

const GENERIC_AUTH_ERROR = "Invalid email or password";
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 5;
const RATE_LIMIT_LOCK_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS_PER_IP = 20;
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const SESSION_TOKEN_BYTES = 48;
const BCRYPT_COST = 12;
const FALLBACK_PASSWORD_HASH = "$2b$10$CwTycUXWue0Thq9StjUM0uJ8p6hX6YsJhBKt3vnDnN/SfXlBx/6C6";

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
            await sendEmail({
                from: FROM,
                to: a.email,
                subject,
                html,
                text,
            });
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

export const requestResidentOtp = mutation({
    args: { subdomain: v.string(), email: v.string() },
    handler: async (ctx, { subdomain, email }) => {
        const cleanedSubdomain = subdomain.trim().toLowerCase();
        const cleanedEmail = email.trim().toLowerCase();
        if (!cleanedSubdomain || !cleanedEmail) return { ok: true };

        const condo = await ctx.db
            .query("condos")
            .withIndex("bySubdomain", (q) => q.eq("subdomain", cleanedSubdomain))
            .unique();
        if (!condo) return { ok: true };

        const resident = await ctx.db
            .query("residents")
            .withIndex("byCondoEmail", (q) => q.eq("condoId", condo._id).eq("email", cleanedEmail))
            .unique();
        if (!resident || !["syndic", "manager"].includes(resident.role)) {
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

        await sendEmail({
            from: FROM,
            to: cleanedEmail,
            subject,
            html,
            text,
        });

        return { ok: true, devCode: code };
    },
});

export const residentSignIn = mutation({
    args: {
        subdomain: v.string(),
        email: v.string(),
        code: v.string(),
        ip: v.optional(v.string()),
    },
    handler: async (ctx, { subdomain, email, code, ip }) => {
        const now = Date.now();
        const cleanedSubdomain = subdomain.trim().toLowerCase();
        const cleanedEmail = email.trim().toLowerCase();
        const trimmedCode = code.trim();

        if (!cleanedSubdomain || !cleanedEmail || trimmedCode.length === 0) {
            throw new Error(GENERIC_AUTH_ERROR);
        }

        const condo = await ctx.db
            .query("condos")
            .withIndex("bySubdomain", (q) => q.eq("subdomain", cleanedSubdomain))
            .unique();
        if (!condo) {
            throw new Error(GENERIC_AUTH_ERROR);
        }

        const resident = await ctx.db
            .query("residents")
            .withIndex("byCondoEmail", (q) => q.eq("condoId", condo._id).eq("email", cleanedEmail))
            .unique();
        if (!resident || !["syndic", "manager"].includes(resident.role)) {
            throw new Error(GENERIC_AUTH_ERROR);
        }

        const otp = await ctx.db
            .query("otps")
            .withIndex("byCondoEmail", (q) => q.eq("condoId", condo._id).eq("email", cleanedEmail))
            .order("desc")
            .first();
        if (!otp || otp.code !== trimmedCode) {
            throw new Error(GENERIC_AUTH_ERROR);
        }
        if (otp.expiresAt < now || otp.consumedAt) {
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
            ip: (ip?.trim() ?? "") || "unknown",
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

        await sendEmail({
            from: FROM,
            to: normalizedEmail,
            subject,
            html,
            text,
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
            throw new Error("INVALID_CODE");
        }

        const validCode = bcrypt.compareSync(trimmedCode, resetRecord.codeHash);
        if (!validCode) {
            throw new Error("INVALID_CODE");
        }

        const user = await ctx.db
            .query("platformUsers")
            .withIndex("byEmail", (q) => q.eq("email", normalizedEmail))
            .unique();
        if (!user) {
            throw new Error("INVALID_CODE");
        }

        const newHash = bcrypt.hashSync(sanitizedPassword, BCRYPT_COST);
        await ctx.db.patch(user._id, { passwordHash: newHash });

        await ctx.db.patch(resetRecord._id, { usedAt: Date.now() });

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
        return { success: true };
    },
});
