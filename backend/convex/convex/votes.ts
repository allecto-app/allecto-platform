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

export const listForMinute = query({
    args: { minuteId: v.id("minutes") },
    handler: async (ctx, { minuteId }) => {
        const votes = await ctx.db
            .query("votes")
            .withIndex("byMinute", (q) => q.eq("minuteId", minuteId))
            .collect();

        const residentIds = Array.from(new Set(votes.map((vote) => vote.residentId)));
        const unitIds = Array.from(new Set(votes.map((vote) => vote.unitId)));

        const residents = await Promise.all(residentIds.map((id) => ctx.db.get(id)));
        const units = await Promise.all(unitIds.map((id) => ctx.db.get(id)));

        const residentMap = new Map(residents.filter(Boolean).map((resident) => [resident!._id, resident!]));
        const unitMap = new Map(units.filter(Boolean).map((unit) => [unit!._id, unit!]));

        return votes
            .sort((a, b) => b.createdAt - a.createdAt)
            .map((vote) => {
                const resident = residentMap.get(vote.residentId);
                const unit = unitMap.get(vote.unitId);
                return {
                    _id: vote._id,
                    minuteId: vote.minuteId,
                    unitId: vote.unitId,
                    residentId: vote.residentId,
                    choice: vote.choice,
                    comment: vote.comment ?? null,
                    createdAt: vote.createdAt,
                    residentName: resident?.name ?? "Morador(a)",
                    residentRole: resident?.role ?? null,
                    unitCode: unit?.code ?? null,
                    unitBlock: unit?.block ?? null,
                    unitFloor: unit?.floor ?? null,
                };
            });
    },
});

export const statsByCondo = query({
    args: { condoId: v.id("condos") },
    handler: async (ctx, { condoId }) => {
        const minutes = await ctx.db
            .query("minutes")
            .withIndex("byCondo", (q) => q.eq("condoId", condoId))
            .collect();

        const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
        let votesToday = 0;
        const votingUnits = new Set<string>();

        for (const minute of minutes) {
            const minuteVotes = await ctx.db
                .query("votes")
                .withIndex("byMinute", (q) => q.eq("minuteId", minute._id))
                .collect();
            for (const vote of minuteVotes) {
                if (vote.createdAt >= dayAgo) {
                    votesToday += 1;
                }
                votingUnits.add(String(vote.unitId));
            }
        }

        const units = await ctx.db
            .query("units")
            .withIndex("byCondo", (q) => q.eq("condoId", condoId))
            .collect();

        const participationRate = units.length > 0 ? votingUnits.size / units.length : 0;

        return { votesToday, participationRate };
    },
});
