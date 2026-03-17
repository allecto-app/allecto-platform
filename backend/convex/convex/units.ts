import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireCondoRole, requirePlatformRole } from "./guards";
import { recordAdminAuditEvent } from "./lib/adminAudit";

async function requireUnitReadAccess(ctx: any, sessionToken: string | undefined, condoId: any) {
  if (!sessionToken) {
    return { actorType: "unknown" as const, actorId: undefined };
  }
  try {
    await requirePlatformRole(ctx, ["super_admin", "support", "ops"], sessionToken);
    return { actorType: "platform" as const, actorId: undefined };
  } catch {
    const auth = await requireCondoRole(ctx, condoId, ["syndic", "manager", "council"], sessionToken);
    return { actorType: "resident" as const, actorId: auth.resident?._id };
  }
}

async function requireUnitWriteAccess(ctx: any, sessionToken: string | undefined, condoId: any) {
  if (!sessionToken) {
    return { actorType: "unknown" as const, actorId: undefined };
  }
  try {
    const auth = await requirePlatformRole(ctx, ["super_admin", "ops", "support"], sessionToken);
    return { actorType: "platform" as const, actorId: auth.user._id };
  } catch {
    const auth = await requireCondoRole(ctx, condoId, ["syndic", "manager"], sessionToken);
    return { actorType: "resident" as const, actorId: auth.resident._id };
  }
}

export const upsert = mutation({
  args: {
    sessionToken: v.optional(v.string()),
    condoId: v.id("condos"),
    code: v.string(),
    block: v.optional(v.string()),
    floor: v.optional(v.string()),
  },
  handler: async (ctx, a) => {
    const actor = await requireUnitWriteAccess(ctx, a.sessionToken, a.condoId);
    const now = Date.now();
    const existing = await ctx.db
      .query("units")
      .withIndex("byCondoCode", (q) => q.eq("condoId", a.condoId).eq("code", a.code))
      .unique();
    if (existing && existing.deletedAt === undefined) {
      await ctx.db.patch(existing._id, { block: a.block, floor: a.floor, updatedAt: now });
      return existing._id;
    }
    const unitId = await ctx.db.insert("units", {
      condoId: a.condoId,
      code: a.code,
      block: a.block,
      floor: a.floor,
      deletedAt: undefined,
      anonymizedAt: undefined,
      createdAt: now,
      updatedAt: now,
    });

    await recordAdminAuditEvent(ctx, {
      action: "unit.created",
      actor: { type: actor.actorType, id: actor.actorId ? String(actor.actorId) : undefined },
      condoId: a.condoId,
      entityType: "unit",
      entityId: String(unitId),
    });
    return unitId;
  },
});

export const addMembership = mutation({
  args: {
    sessionToken: v.optional(v.string()),
    residentId: v.id("residents"),
    unitId: v.id("units"),
    role: v.optional(v.union(v.literal("owner"), v.literal("tenant"))),
  },
  handler: async (ctx, a) => {
    const now = Date.now();

    const [unit, resident] = await Promise.all([ctx.db.get(a.unitId), ctx.db.get(a.residentId)]);

    if (!unit) {
      throw new Error("Unit not found");
    }
    if (unit.deletedAt !== undefined) {
      throw new Error("Unit was deleted");
    }
    if (!resident) {
      throw new Error("Resident not found");
    }

    await requireUnitWriteAccess(ctx, a.sessionToken, unit.condoId);

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

export const update = mutation({
  args: {
    sessionToken: v.optional(v.string()),
    unitId: v.id("units"),
    code: v.string(),
    block: v.optional(v.string()),
    floor: v.optional(v.string()),
  },
  handler: async (ctx, { sessionToken, unitId, code, block, floor }) => {
    const unit = await ctx.db.get(unitId);
    if (!unit) {
      throw new Error("Unit not found");
    }
    if (unit.deletedAt !== undefined) {
      throw new Error("Unit was deleted");
    }

    await requireUnitWriteAccess(ctx, sessionToken, unit.condoId);

    const trimmedCode = code.trim();
    if (!trimmedCode) {
      throw new Error("Unit code is required");
    }

    if (trimmedCode !== unit.code) {
      const duplicate = await ctx.db
        .query("units")
        .withIndex("byCondoCode", (q) => q.eq("condoId", unit.condoId).eq("code", trimmedCode))
        .unique();
      if (duplicate && duplicate.deletedAt === undefined) {
        throw new Error("Unit code already exists for this condo");
      }
    }

    const now = Date.now();
    await ctx.db.patch(unitId, {
      code: trimmedCode,
      block: block?.trim() ? block.trim() : undefined,
      floor: floor?.trim() ? floor.trim() : undefined,
      updatedAt: now,
    });

    const updated = await ctx.db.get(unitId);
    const condo = updated ? await ctx.db.get(updated.condoId) : null;

    if (!updated) {
      throw new Error("Failed to load updated unit");
    }

    return {
      id: updated._id,
      condoId: updated.condoId,
      code: updated.code,
      block: updated.block ?? null,
      floor: updated.floor ?? null,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      condoName: condo?.name ?? null,
    };
  },
});

export const remove = mutation({
  args: { sessionToken: v.optional(v.string()), unitId: v.id("units") },
  handler: async (ctx, { sessionToken, unitId }) => {
    const unit = await ctx.db.get(unitId);
    if (!unit) {
      return false;
    }
    if (unit.deletedAt !== undefined) {
      return true;
    }

    await requireUnitWriteAccess(ctx, sessionToken, unit.condoId);

    const now = Date.now();
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("byUnit", (q) => q.eq("unitId", unitId))
      .collect();
    if (memberships.length > 0) {
      throw new Error("Desvincule todos os moradores antes de excluir a unidade");
    }

    await ctx.db.patch(unitId, {
      code: `Unidade removida ${String(unitId).slice(-6)}`,
      block: undefined,
      floor: undefined,
      deletedAt: now,
      anonymizedAt: now,
      updatedAt: now,
    });
    return true;
  },
});

export const updateMembershipRole = mutation({
  args: {
    sessionToken: v.optional(v.string()),
    membershipId: v.id("memberships"),
    role: v.union(v.literal("owner"), v.literal("tenant")),
  },
  handler: async (ctx, { sessionToken, membershipId, role }) => {
    const membership = await ctx.db.get(membershipId);
    if (!membership) {
      throw new Error("Membership not found");
    }
    const unit = await ctx.db.get(membership.unitId);
    if (!unit) {
      throw new Error("Unit not found");
    }

    await requireUnitWriteAccess(ctx, sessionToken, unit.condoId);

    await ctx.db.patch(membershipId, { role });
    return true;
  },
});

export const removeMembership = mutation({
  args: { sessionToken: v.optional(v.string()), membershipId: v.id("memberships") },
  handler: async (ctx, { sessionToken, membershipId }) => {
    const membership = await ctx.db.get(membershipId);
    if (!membership) {
      return false;
    }
    const unit = await ctx.db.get(membership.unitId);
    if (!unit) {
      return false;
    }

    await requireUnitWriteAccess(ctx, sessionToken, unit.condoId);

    await ctx.db.delete(membershipId);
    return true;
  },
});

export const detail = query({
  args: { sessionToken: v.optional(v.string()), unitId: v.id("units") },
  handler: async (ctx, { sessionToken, unitId }) => {
    const unit = await ctx.db.get(unitId);
    if (!unit || unit.deletedAt !== undefined) {
      return null;
    }

    await requireUnitReadAccess(ctx, sessionToken, unit.condoId);

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
  args: { sessionToken: v.optional(v.string()), condoId: v.id("condos"), limit: v.optional(v.number()) },
  handler: async (ctx, { sessionToken, condoId, limit }) => {
    await requireUnitReadAccess(ctx, sessionToken, condoId);
    const units = await ctx.db
      .query("units")
      .withIndex("byCondo", (q) => q.eq("condoId", condoId))
      .take(limit ?? 500);
    return units.filter((unit) => unit.deletedAt === undefined);
  },
});
