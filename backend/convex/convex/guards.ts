// convex/guards.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export function assert(cond: any, msg: string) { if (!cond) throw new Error(msg); }

// Example: read user identity (wire your provider later)
export async function requirePlatformRole(ctx: any, allowed: string[]) {
    const ident = ctx.auth.getUserIdentity(); // if you connected a provider
    assert(ident, "Unauthorized");
    // Lookup in platformUsers by email
    const p = await ctx.db.query("platformUsers")
        .filter(q => q.eq(q.field("email"), ident!.email))
        .first();
    assert(p && p.roles.some((r: string) => allowed.includes(r)), "Forbidden");
    return p;
}

export async function requireCondoRole(ctx: any, condoId: string, allowed: string[]) {
    const ident = ctx.auth.getUserIdentity();
    assert(ident, "Unauthorized");
    // Find resident by email in this condo
    const r = await ctx.db.query("residents")
        .withIndex("byCondoEmail", q => q.eq("condoId", condoId).eq("email", ident!.email))
        .unique();
    assert(r && allowed.includes(r.role), "Forbidden");
    return r;
}
