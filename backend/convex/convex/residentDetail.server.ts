'use strict';

import { query } from "./_generated/server";
import { v } from "convex/values";
import { normalizeEmail } from "./_secu";
import { loadSession } from "./guards";

export const get = query({
  args: {
    sessionToken: v.optional(v.string()),
    residentId: v.optional(v.id("residents")),
    email: v.optional(v.string()),
  },
  handler: async (ctx, { sessionToken, residentId, email }) => {
    if (!residentId && !email) return null;

    const resident = residentId
      ? await ctx.db.get(residentId)
      : await ctx.db
          .query("residents")
          .withIndex("byEmail", (q) => q.eq("email", normalizeEmail(email!)))
          .first();

    if (!resident || resident.deletedAt !== undefined) return null;

    if (sessionToken) {
      const session = await loadSession(ctx, sessionToken);

      if (session.type === "platform" && session.platformUserId) {
        const user = await ctx.db.get(session.platformUserId);
        const allowed = user?.roles?.some((role: string) =>
          ["super_admin", "ops", "support"].includes(role),
        );
        if (!allowed) {
          throw new Error("Forbidden");
        }
      } else if (session.type === "resident" && session.residentId) {
        const requester = await ctx.db.get(session.residentId);
        if (!requester || requester.deletedAt !== undefined) {
          throw new Error("Forbidden");
        }

        const canManageCondoResident =
          requester.condoId === resident.condoId &&
          ["syndic", "manager", "council"].includes(requester.role);
        const isSelf = requester._id === resident._id;

        if (!canManageCondoResident && !isSelf) {
          throw new Error("Forbidden");
        }
      } else {
        throw new Error("Forbidden");
      }
    }

    const condo = await ctx.db.get(resident.condoId);

    const memberships = await ctx.db
      .query("memberships")
      .withIndex("byResident", (q) => q.eq("residentId", resident._id))
      .collect();

    const unitDetails = await Promise.all(
      memberships.map(async (membership) => {
        const unit = await ctx.db.get(membership.unitId);
        if (!unit) return null;
        return {
          membershipId: membership._id,
          unitId: unit._id,
          code: unit.code,
          block: unit.block ?? null,
          role: membership.role ?? null,
        };
      }),
    );

    const activities = await ctx.db
      .query("notificationLogs")
      .withIndex("byCondo", (q) => q.eq("condoId", resident.condoId))
      .take(50);

    const sortedActivities = activities.sort((a, b) => b.createdAt - a.createdAt);

    return {
      resident: {
        id: resident._id,
        name: resident.name,
        email: resident.email ?? null,
        phone: resident.phone ?? null,
        role: resident.role,
        isActive: resident.isActive,
        condoId: resident.condoId,
        condoName: condo?.name ?? null,
        condoSubdomain: condo?.subdomain ?? null,
        createdAt: resident.createdAt,
        updatedAt: resident.updatedAt,
      },
      units: unitDetails.filter(Boolean),
      activities: sortedActivities.map((log) => ({
        id: log._id,
        type: log.template,
        channel: log.channel,
        description: log.meta?.note ?? null,
        createdAt: log.createdAt,
      })),
    };
  },
});
