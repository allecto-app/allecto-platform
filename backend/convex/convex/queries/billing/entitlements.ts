import { query } from "../../_generated/server";
import { v } from "convex/values";
import { normalizeTierKey } from "../../actions/billing/helpers";

const ACTIVE_STATUSES = new Set(["active", "trialing"]);
const DUNNING_STATUSES = new Set(["past_due", "unpaid", "incomplete", "incomplete_expired"]);
const ALLOWED_TIERS = new Set(["essencial", "plus", "pro"]);

const PRICE_TO_TIER = new Map(
  (
    [
      ["PRICE_ID_ESSENCIAL_MONTHLY", "essencial"],
      ["PRICE_ID_PLUS_MONTHLY", "plus"],
      ["PRICE_ID_PRO_MONTHLY", "pro"],
    ] as const
  ).flatMap(([envKey, tier]) => {
    const value = process.env[envKey];
    return value ? ([[value, tier]] as const) : [];
  }),
);

function resolveTierKey(priceId: string | null | undefined) {
  if (!priceId) return null;
  return PRICE_TO_TIER.get(priceId) ?? null;
}

export const entitlements = query({
  args: { tenantId: v.id("condos") },
  handler: async (ctx, { tenantId }) => {
    const tenant = await ctx.db.get(tenantId);
    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("byTenant", (q: any) => q.eq("tenantId", tenantId))
      .collect();

    if (subscriptions.length === 0) {
      return {
        active: false,
        tierKey: null,
        subscription: null,
        inDunning: false,
      };
    }

    subscriptions.sort((a: any, b: any) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
    const current = subscriptions[0] as any;
    const now = Date.now();
    const isActive = ACTIVE_STATUSES.has(current.status) && (current.currentPeriodEnd ?? 0) >= now;
    const resolvedTier = resolveTierKey(current.priceId);
    const recordTier = normalizeTierKey(current.tierKey);
    const tenantTier = normalizeTierKey(tenant?.billingTier);
    const tierKey = (resolvedTier ?? recordTier ?? tenantTier ?? (isActive ? "essencial" : null)) as
      | "essencial"
      | "plus"
      | "pro"
      | null;
    const inDunning = DUNNING_STATUSES.has(current.status);

    return {
      active: isActive,
      tierKey: isActive ? tierKey : null,
      subscription: {
        status: current.status,
        priceId: current.priceId,
        productId: current.productId,
        currentPeriodStart: current.currentPeriodStart,
        currentPeriodEnd: current.currentPeriodEnd,
        cancelAt: current.cancelAt ?? null,
        cancelAtPeriodEnd: Boolean(current.cancelAtPeriodEnd),
        trialEnd: current.trialEnd ?? null,
        latestInvoiceId: current.latestInvoiceId ?? null,
        latestInvoiceStatus: current.latestInvoiceStatus ?? null,
        updatedAt: current.updatedAt,
      },
      inDunning,
    };
  },
});
