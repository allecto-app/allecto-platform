// convex/units.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const upsert = mutation({
    args: {
        condoId: v.id("condos"),
        code: v.string(),
        block: v.optional(v.string()),
        floor: v.optional(v.string()),
    },
    handler: async (ctx, a) => {
        const now = Date.now();
        const existing = await ctx.db
            .query("units")
            .withIndex("byCondoCode", (q) => q.eq("condoId", a.condoId).eq("code", a.code))
            .unique();
        if (existing) {
            await ctx.db.patch(existing._id, { block: a.block, floor: a.floor, updatedAt: now });
            return existing._id;
        }
        return await ctx.db.insert("units", {
            condoId: a.condoId,
            code: a.code,
            block: a.block,
            floor: a.floor,
            createdAt: now,
            updatedAt: now,
        });
    },
});

export const addMembership = mutation({
    args: { residentId: v.id("residents"), unitId: v.id("units"), role: v.optional(v.string()) },
    handler: async (ctx, a) => {
        const now = Date.now();
        const dup = await ctx.db
            .query("memberships")
            .withIndex("byResident", (q) => q.eq("residentId", a.residentId))
            .collect();
        if (dup.find((m) => m.unitId === a.unitId)) return true;
        await ctx.db.insert("memberships", {
            residentId: a.residentId,
            unitId: a.unitId,
            role: a.role,
            createdAt: now,
        });
        return true;
    },
});
