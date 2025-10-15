// convex/auth.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import bcrypt from "bcryptjs";

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
        // TODO send via provider
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
