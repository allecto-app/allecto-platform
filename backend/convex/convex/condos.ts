// convex/condos.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const Branding = v.object({
    logoUrl: v.optional(v.string()),
    primaryColor: v.optional(v.string()),
    secondaryColor: v.optional(v.string()),
    displayName: v.optional(v.string()),
});

export const create = mutation({
    args: { name: v.string(), subdomain: v.string(), branding: Branding },
    handler: async (ctx, args) => {
        const now = Date.now();
        const dup = await ctx.db
            .query("condos")
            .withIndex("bySubdomain", (q) => q.eq("subdomain", args.subdomain))
            .unique();
        if (dup) throw new Error("Subdomain already in use");
        return await ctx.db.insert("condos", {
            name: args.name,
            subdomain: args.subdomain,
            branding: args.branding,
            createdAt: now,
            updatedAt: now,
        });
    },
});

export const getBySubdomain = query({
    args: { subdomain: v.string() },
    handler: async (ctx, { subdomain }) => {
        return await ctx.db
            .query("condos")
            .withIndex("bySubdomain", (q) => q.eq("subdomain", subdomain))
            .unique();
    },
});

export const updateBranding = mutation({
    args: { condoId: v.id("condos"), branding: Branding },
    handler: async (ctx, { condoId, branding }) => {
        const condo = await ctx.db.get(condoId);
        if (!condo) throw new Error("Condo not found");
        await ctx.db.patch(condoId, { branding, updatedAt: Date.now() });
        return true;
    },
});
