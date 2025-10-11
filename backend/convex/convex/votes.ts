// convex/votes.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const cast = mutation({
    args: {
        minuteId: v.id("minutes"),
        unitId: v.id("units"),
        residentId: v.id("residents"),
        choice: v.union(v.literal("agree"), v.literal("disagree")),
        comment: v.optional(v.string()),
    },
    handler: async (ctx, a) => {
        const now = Date.now();
        const minute = await ctx.db.get(a.minuteId);
        if (!minute) throw new Error("Minute not found");
        if (minute.status !== "open" || now > minute.closesAt) throw new Error("Voting is closed");

        const unit = await ctx.db.get(a.unitId);
        const resident = await ctx.db.get(a.residentId);
        if (!unit || !resident) throw new Error("Unit/Resident not found");
        if (resident.condoId !== minute.condoId || unit.condoId !== minute.condoId) {
            throw new Error("Cross-tenant vote not allowed");
        }

        const memberships = await ctx.db
            .query("memberships")
            .withIndex("byResident", (q) => q.eq("residentId", a.residentId))
            .collect();
        if (!memberships.find((m) => m.unitId === a.unitId)) {
            throw new Error("Resident is not associated to this unit");
        }

        const existing = await ctx.db
            .query("votes")
            .withIndex("byMinuteUnit", (q) => q.eq("minuteId", a.minuteId).eq("unitId", a.unitId))
            .unique();
        if (existing) throw new Error("This unit has already voted");

        await ctx.db.insert("votes", {
            minuteId: a.minuteId,
            unitId: a.unitId,
            residentId: a.residentId,
            choice: a.choice,
            comment: a.comment,
            createdAt: now,
        });
        return true;
    },
});

export const getMine = query({
    args: { residentId: v.id("residents"), minuteId: v.optional(v.id("minutes")) },
    handler: async (ctx, a) => {
        const all = await ctx.db
            .query("votes")
            .withIndex("byResidentMinute", (q) => q.eq("residentId", a.residentId))
            .collect();
        return a.minuteId ? all.filter((v) => v.minuteId === a.minuteId) : all;
    },
});

export const summary = query({
    args: { minuteId: v.id("minutes") },
    handler: async (ctx, { minuteId }) => {
        const votes = await ctx.db
            .query("votes")
            .withIndex("byMinute", (q) => q.eq("minuteId", minuteId))
            .collect();
        const total = votes.length;
        const agree = votes.filter((v) => v.choice === "agree").length;
        const disagree = total - agree;
        return { total, agree, disagree, agreePct: total ? agree / total : 0 };
    },
});
