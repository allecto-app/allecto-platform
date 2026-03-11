'use strict';

import { query } from "./_generated/server";
import { v } from "convex/values";
import { normalizeEmail } from "./_secu";

export const get = query({
  args: { residentId: v.optional(v.id("residents")), email: v.optional(v.string()) },
  handler: async (ctx, { residentId, email }) => {
    if (!residentId && !email) return null;

    const resident = residentId
      ? await ctx.db.get(residentId)
      : await ctx.db
          .query("residents")
          .withIndex("byEmail", (q) => q.eq("email", normalizeEmail(email!)))
          .first();

    if (!resident || resident.deletedAt !== undefined) return null;

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
