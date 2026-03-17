import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { loadSession, requireCondoRole, requirePlatformRole, requireResidentMembership } from "./guards";
import { recordSecurityEvent } from "./lib/security";

async function requireVoteReadAccess(ctx: any, sessionToken: string | undefined, condoId: any) {
  if (!sessionToken) {
    return;
  }
  try {
    await requirePlatformRole(ctx, ["super_admin", "support", "ops"], sessionToken);
    return;
  } catch {
    await requireCondoRole(ctx, condoId, ["syndic", "manager", "council"], sessionToken);
  }
}

export const cast = mutation({
  args: {
    sessionToken: v.optional(v.string()),
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

    if (a.sessionToken) {
      const { resident: sessionResident, membership } = await requireResidentMembership(
        ctx,
        a.sessionToken,
        minute.condoId,
        a.unitId,
      );
      if (sessionResident._id !== a.residentId) {
        throw new Error("Forbidden");
      }
      if (membership.role !== "owner") {
        throw new Error("Somente proprietários podem registrar votos");
      }
    } else {
      const memberships = await ctx.db
        .query("memberships")
        .withIndex("byResident", (q) => q.eq("residentId", a.residentId))
        .collect();
      const membership = memberships.find((m) => m.unitId === a.unitId);
      if (!membership || membership.role !== "owner") {
        throw new Error("Somente proprietários podem registrar votos");
      }
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

    await recordSecurityEvent(ctx, "vote_cast", String(a.residentId), {
      minuteId: String(a.minuteId),
      unitId: String(a.unitId),
      condoId: String(minute.condoId),
      choice: a.choice,
    });

    return true;
  },
});

export const getMine = query({
  args: {
    sessionToken: v.optional(v.string()),
    residentId: v.id("residents"),
    minuteId: v.optional(v.id("minutes")),
  },
  handler: async (ctx, a) => {
    const resident = await ctx.db.get(a.residentId);
    if (!resident) return [];
    if (a.sessionToken) {
      const session = await loadSession(ctx, a.sessionToken);
      if (session.type === "resident" && session.residentId) {
        if (session.residentId !== a.residentId || session.condoId !== resident.condoId) {
          throw new Error("Forbidden");
        }
      } else {
        await requireVoteReadAccess(ctx, a.sessionToken, resident.condoId);
      }
    }

    const all = await ctx.db
      .query("votes")
      .withIndex("byResidentMinute", (q) => q.eq("residentId", a.residentId))
      .collect();
    return a.minuteId ? all.filter((v) => v.minuteId === a.minuteId) : all;
  },
});

export const summary = query({
  args: { sessionToken: v.optional(v.string()), minuteId: v.id("minutes") },
  handler: async (ctx, { sessionToken, minuteId }) => {
    const minute = await ctx.db.get(minuteId);
    if (!minute) {
      throw new Error("Minute not found");
    }
    await requireVoteReadAccess(ctx, sessionToken, minute.condoId);

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
  args: { sessionToken: v.optional(v.string()), minuteId: v.id("minutes") },
  handler: async (ctx, { sessionToken, minuteId }) => {
    const minute = await ctx.db.get(minuteId);
    if (!minute) {
      throw new Error("Minute not found");
    }
    await requireVoteReadAccess(ctx, sessionToken, minute.condoId);

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
  args: { sessionToken: v.optional(v.string()), condoId: v.id("condos") },
  handler: async (ctx, { sessionToken, condoId }) => {
    await requireVoteReadAccess(ctx, sessionToken, condoId);

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
