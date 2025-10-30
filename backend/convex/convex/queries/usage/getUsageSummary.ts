import { query } from "../../_generated/server";
import type { QueryCtx } from "../../_generated/server";
import { v } from "convex/values";
import { api } from "../../_generated/api";
import { getMonthlyBucket } from "../../../../../packages/shared/date/period";
import { resolveLimits, validateUnitsAgainstTier, type TierKey } from "../../billing/limits";
import { DEFAULT_USAGE_TIMEZONE, getAssemblyUsage } from "../../usage/helpers";
import type { Id } from "../../_generated/dataModel";

const billingApi = api.billing as any;

export const getUsageSummary = query({
  args: { tenantId: v.id("condos") },
  handler: async (ctx, { tenantId }) => {
    const tenant = await ctx.db.get(tenantId);
    const timezone = tenant?.timezone ?? DEFAULT_USAGE_TIMEZONE;

    const entitlements = await ctx.runQuery(billingApi.entitlements, {
      tenantId,
    });

    if (!entitlements?.active || !entitlements.tierKey) {
      return {
        active: false,
        tierKey: null,
        limits: null,
        usage: {
          monthKey: getMonthlyBucket(Date.now(), timezone).key,
          assembliesCount: 0,
        },
        remaining: null,
        unitsCount: await getUnitsCount(ctx, tenantId),
        unitsOk: false,
        unitValidationReason: null,
      } as const;
    }

    const tierKey = entitlements.tierKey as TierKey;
    const limits = resolveLimits(tierKey);

    const { key: monthKey } = getMonthlyBucket(Date.now(), timezone);
    const usage = await getAssemblyUsage(ctx, tenantId, monthKey);
    const unitsCount = await getUnitsCount(ctx, tenantId);
    const unitValidation = validateUnitsAgainstTier(unitsCount, tierKey);

    const remaining =
      limits.monthlyAssembliesLimit === "unlimited"
        ? "unlimited"
        : Math.max(0, limits.monthlyAssembliesLimit - usage.count);

    return {
      active: true,
      tierKey,
      limits,
      usage: {
        monthKey,
        assembliesCount: usage.count,
      },
      remaining,
      unitsCount,
      unitsOk: unitValidation.ok,
      unitValidationReason: unitValidation.reason ?? null,
    };
  },
});

async function getUnitsCount(ctx: QueryCtx, tenantId: Id<"condos">) {
  const units = await ctx.db
    .query("units")
    .withIndex("byCondo", (q) => q.eq("condoId", tenantId))
    .collect();
  return units.length;
}
