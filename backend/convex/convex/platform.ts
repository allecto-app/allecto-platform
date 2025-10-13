// convex/platform.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requirePlatformRole } from "./guards";

export const listCondos = query({
    args: {
        sessionToken: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, a) => {
        await requirePlatformRole(ctx, ["super_admin", "ops", "support"], a.sessionToken);
        return ctx.db.query("condos").take(a.limit ?? 200);
    },
});

export const createCondo = mutation({
    args: {
        sessionToken: v.string(),
        name: v.string(),
        subdomain: v.string(),
        branding: v.object({
            logoUrl: v.optional(v.string()),
            primaryColor: v.optional(v.string()),
            secondaryColor: v.optional(v.string()),
            displayName: v.optional(v.string()),
        }),
        syndicEmail: v.string(),
        syndicName: v.string(),
    },
    handler: async (ctx, a) => {
        await requirePlatformRole(ctx, ["super_admin", "ops"], a.sessionToken);
        const now = Date.now();
        const condoId = await ctx.db.insert("condos", {
            name: a.name,
            subdomain: a.subdomain,
            branding: a.branding,
            createdAt: now, updatedAt: now,
        });
        const syndicId = await ctx.db.insert("residents", {
            condoId, name: a.syndicName, email: a.syndicEmail,
            role: "syndic", isActive: true, createdAt: now, updatedAt: now,
        });
        return { condoId, syndicId };
    },
});
