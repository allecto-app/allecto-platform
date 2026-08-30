import { useMemo } from "react";
import { useQuery } from "convex/react";
import { Billing } from "@allecto-app/contracts";
import { api, type Id } from "../lib/convexGenerated";

export type EntitlementsResult = {
  active: boolean;
  tierKey: Billing.BillingTierKey | null;
  subscription: {
    status: string;
    priceId: string;
    productId: string;
    currentPeriodStart: number;
    currentPeriodEnd: number;
    billingCycleAnchor: number;
    cancelAt: number | null;
    cancelAtPeriodEnd: boolean;
    trialEnd: number | null;
    latestInvoiceId: string | null;
    latestInvoiceStatus: string | null;
    updatedAt: number;
  } | null;
  assemblyEntitlementId: Id<"assemblyEntitlements"> | null;
  inDunning: boolean;
};

export function useEntitlements(tenantId: Id<"condos"> | null | undefined) {
  const result = useQuery(
    api.billing.entitlements,
    tenantId ? { tenantId } : "skip",
  ) as EntitlementsResult | undefined;

  const isLoading = tenantId != null && result === undefined;

  const currentPlan = useMemo(() => {
    if (!result?.tierKey) return null;
    const normalized = Billing.normalizeBillingTierKey(result.tierKey);
    if (!normalized) return null;
    return Billing.BILLING_PLAN_BY_TIER.get(normalized) ?? null;
  }, [result?.tierKey]);

  return {
    data: result,
    isLoading,
    currentPlan,
  };
}
