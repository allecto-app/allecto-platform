// convex/guards.ts
import bcrypt from "bcryptjs";

export function assert(cond: any, msg: string) {
    if (!cond) throw new Error(msg);
}

const UNAUTHORIZED = "Unauthorized";
const FORBIDDEN = "Forbidden";

const bytesToHex = (bytes: Uint8Array) =>
    Array.from(bytes)
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");

async function digestToken(token: string) {
    const data = new TextEncoder().encode(token);
    const buffer = await crypto.subtle.digest("SHA-256", data);
    return bytesToHex(new Uint8Array(buffer));
}

export async function loadSession(ctx: any, sessionToken: string | null | undefined) {
    if (typeof sessionToken !== "string" || sessionToken.length < 32) {
        throw new Error(UNAUTHORIZED);
    }
    const digest = await digestToken(sessionToken);
    const session = await ctx.db
        .query("sessions")
        .withIndex("byDigest", (q: any) => q.eq("tokenDigest", digest))
        .unique();
    assert(session, UNAUTHORIZED);
    if (session.revokedAt || session.expiresAt <= Date.now()) {
        throw new Error(UNAUTHORIZED);
    }

    const matches = bcrypt.compareSync(sessionToken, session.tokenHash);
    assert(matches, UNAUTHORIZED);

    if (typeof ctx.db.patch === "function") {
        await ctx.db.patch(session._id, { lastUsedAt: Date.now() });
    }
    return session;
}

export async function requirePlatformRole(ctx: any, allowed: string[], sessionToken: string) {
    return requirePlatformRoleForToken(ctx, sessionToken, allowed);
}

export async function requireCondoRole(ctx: any, condoId: string, allowed: string[], sessionToken: string) {
    return requireCondoRoleForToken(ctx, sessionToken, condoId, allowed);
}

export async function requirePlatformRoleForToken(
    ctx: any,
    sessionToken: string,
    allowedRoles: string[],
) {
    const session = await loadSession(ctx, sessionToken);
    assert(session.type === "platform" && session.platformUserId, UNAUTHORIZED);

    const user = await ctx.db.get(session.platformUserId);
    assert(user, UNAUTHORIZED);

    const hasRole = user.roles.some((r: string) => allowedRoles.includes(r));
    assert(hasRole, FORBIDDEN);

    return { user, session };
}

export async function requireCondoRoleForToken(
    ctx: any,
    sessionToken: string,
    condoId: string,
    allowedRoles: string[],
) {
    const session = await loadSession(ctx, sessionToken);

    if (session.type === "resident" && session.residentId) {
        const resident = await ctx.db.get(session.residentId);
        assert(resident && resident.condoId === condoId, FORBIDDEN);
        assert(allowedRoles.includes(resident.role), FORBIDDEN);
        return { resident, session };
    }

    if (session.type === "platform" && session.platformUserId) {
        const user = await ctx.db.get(session.platformUserId);
        assert(user, UNAUTHORIZED);
        const hasRole = user.roles.some((r: string) => allowedRoles.includes(r));
        assert(hasRole, FORBIDDEN);
        return { user, session };
    }

    throw new Error(FORBIDDEN);
}

export async function requireResidentMembership(
    ctx: any,
    sessionToken: string,
    condoId: string,
    unitId: string,
) {
    const session = await loadSession(ctx, sessionToken);
    assert(session.type === "resident" && session.residentId, FORBIDDEN);

    const resident = await ctx.db.get(session.residentId);
    assert(resident && resident.condoId === condoId && resident.deletedAt === undefined, FORBIDDEN);
    assert(resident.isActive !== false, FORBIDDEN);

    const memberships = await ctx.db
        .query("memberships")
        .withIndex("byResident", (q: any) => q.eq("residentId", resident._id))
        .collect();
    const membership = memberships.find((item: any) => item.unitId === unitId);
    assert(membership, FORBIDDEN);

    return { session, resident, membership };
}
