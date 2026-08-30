import { query } from "../../_generated/server";
import type { QueryCtx } from "../../_generated/server";
import { v } from "convex/values";
import { api } from "../../_generated/api";
import { resolveLimits, validateUnitsAgainstTier, type TierKey } from "../../billing/limits";
import { getAnnualBillingBucket, getAssemblyUsage } from "../../usage/helpers";
import type { Id } from "../../_generated/dataModel";

const billingApi = api.billing as any;

export const getUsageSummary = query({
  args: { tenantId: v.id("condos") },
  handler: async (ctx, { tenantId }) => {
    const entitlements = await ctx.runQuery(billingApi.entitlements, {
      tenantId,
    });

    const status = entitlements?.subscription?.status?.toLowerCase() ?? "";
    const isActive =
      entitlements?.active ||
      status === "active" ||
      status === "trialing";

    if (!isActive || !entitlements?.tierKey) {
      return {
        active: false,
        tierKey: null,
        limits: null,
        usage: {
          cycleKey: getAnnualBillingBucket().key,
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

    const { key: cycleKey } = getAnnualBillingBucket(
      entitlements.subscription?.billingCycleAnchor,
    );
    const usage = await getAssemblyUsage(ctx, tenantId, cycleKey);
    const unitsCount = await getUnitsCount(ctx, tenantId);
    const unitValidation = validateUnitsAgainstTier(unitsCount, tierKey);

    const remaining =
      Math.max(0, limits.assembliesPerYear - usage.count);

    return {
      active: true,
      tierKey,
      limits,
      usage: {
        cycleKey,
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
