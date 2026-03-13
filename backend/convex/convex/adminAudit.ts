import { query } from "./_generated/server";
import { v } from "convex/values";
import { requirePlatformRole } from "./guards";

export const listEvents = query({
  args: {
    token: v.string(),
    action: v.optional(v.string()),
    condoId: v.optional(v.id("condos")),
    actorKey: v.optional(v.string()),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (
    ctx,
    { token, action, condoId, actorKey, dateFrom, dateTo, search, limit },
  ) => {
    await requirePlatformRole(ctx, ["super_admin"], token);

    const scanLimit = Math.max((limit ?? 200) * 5, 500);
    const rows = await ctx.db
      .query("adminAuditEvents")
      .withIndex("byCreatedAt", (q) => q.gte("createdAt", 0))
      .order("desc")
      .take(scanLimit);

    const normalizedSearch = search?.trim().toLowerCase() ?? "";

    const filtered = rows.filter((row: any) => {
      if (action && row.action !== action) return false;
      if (condoId && row.condoId !== condoId) return false;
      if (actorKey && row.actorKey !== actorKey) return false;
      if (dateFrom && row.createdAt < dateFrom) return false;
      if (dateTo && row.createdAt > dateTo) return false;
      if (!normalizedSearch) return true;

      const haystack = [
        row.action,
        row.actorType,
        row.actorId,
        row.actorKey,
        row.entityType,
        row.entityId,
        row.metadata ? JSON.stringify(row.metadata) : "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedSearch);
    });

    return filtered.slice(0, limit ?? 200);
  },
});
