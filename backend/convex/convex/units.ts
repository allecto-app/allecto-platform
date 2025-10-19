// convex/units.ts
import { mutation, query } from "./_generated/server";
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
  args: {
    residentId: v.id("residents"),
    unitId: v.id("units"),
    role: v.optional(v.union(v.literal("owner"), v.literal("tenant"))),
  },
  handler: async (ctx, a) => {
    const now = Date.now();

    const [unit, resident] = await Promise.all([
      ctx.db.get(a.unitId),
      ctx.db.get(a.residentId),
    ]);

    if (!unit) {
      throw new Error("Unit not found");
    }
    if (!resident) {
      throw new Error("Resident not found");
    }
    if (resident.condoId !== unit.condoId) {
      throw new Error("Resident and unit belong to different condos");
    }

    const existingMemberships = await ctx.db
      .query("memberships")
      .withIndex("byResident", (q) => q.eq("residentId", a.residentId))
      .collect();

    const existing = existingMemberships.find((m) => m.unitId === a.unitId);
    if (existing) {
      if (a.role && existing.role !== a.role) {
        await ctx.db.patch(existing._id, { role: a.role });
      }
      return existing._id;
    }

    return await ctx.db.insert("memberships", {
      residentId: a.residentId,
      unitId: a.unitId,
      role: a.role,
      createdAt: now,
    });
  },
});

export const updateMembershipRole = mutation({
  args: {
    membershipId: v.id("memberships"),
    role: v.union(v.literal("owner"), v.literal("tenant")),
  },
  handler: async (ctx, { membershipId, role }) => {
    const membership = await ctx.db.get(membershipId);
    if (!membership) {
      throw new Error("Membership not found");
    }

    await ctx.db.patch(membershipId, { role });
    return true;
  },
});

export const removeMembership = mutation({
  args: { membershipId: v.id("memberships") },
  handler: async (ctx, { membershipId }) => {
    const membership = await ctx.db.get(membershipId);
    if (!membership) {
      return false;
    }

    await ctx.db.delete(membershipId);
    return true;
  },
});

export const detail = query({
  args: { unitId: v.id("units") },
  handler: async (ctx, { unitId }) => {
    const unit = await ctx.db.get(unitId);
    if (!unit) {
      return null;
    }

    const condo = await ctx.db.get(unit.condoId);

    const memberships = await ctx.db
      .query("memberships")
      .withIndex("byUnit", (q) => q.eq("unitId", unitId))
      .collect();

    const membershipDetails = await Promise.all(
      memberships.map(async (membership) => {
        const resident = await ctx.db.get(membership.residentId);
        if (!resident) {
          return null;
        }
        return {
          membershipId: membership._id,
          resident: {
            id: resident._id,
            name: resident.name,
            email: resident.email ?? null,
            phone: resident.phone ?? null,
            role: resident.role,
            isActive: resident.isActive,
          },
          membershipRole: membership.role ?? null,
          linkedAt: membership.createdAt,
        };
      }),
    );

    const votes = await ctx.db
      .query("votes")
      .withIndex("byUnit", (q) => q.eq("unitId", unitId))
      .collect();

    const minuteIds = new Set(votes.map((vote) => vote.minuteId));
    const minutes = await Promise.all(Array.from(minuteIds).map((minuteId) => ctx.db.get(minuteId)));
    const minutesMap = new Map(minutes.filter(Boolean).map((minute) => [minute!._id, minute!]));

    return {
      unit: {
        id: unit._id,
        condoId: unit.condoId,
        code: unit.code,
        block: unit.block ?? null,
        floor: unit.floor ?? null,
        condoName: condo?.name ?? null,
        createdAt: unit.createdAt,
        updatedAt: unit.updatedAt,
      },
      memberships: membershipDetails.filter(Boolean),
      votes: votes
        .map((vote) => {
          const minute = minutesMap.get(vote.minuteId);
          return {
            id: vote._id,
            minuteId: vote.minuteId,
            minuteTitle: minute?.title ?? "Ata",
            minutePublishedAt: minute?.publishedAt ?? null,
            choice: vote.choice,
            comment: vote.comment ?? null,
            createdAt: vote.createdAt,
          };
        })
        .sort((a, b) => b.createdAt - a.createdAt),
    };
  },
});

export const listByCondo = query({
  args: { condoId: v.id("condos"), limit: v.optional(v.number()) },
  handler: async (ctx, { condoId, limit }) => {
    return await ctx.db
      .query("units")
      .withIndex("byCondo", (q) => q.eq("condoId", condoId))
      .take(limit ?? 500);
  },
});
