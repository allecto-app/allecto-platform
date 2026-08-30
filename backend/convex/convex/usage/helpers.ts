import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { api } from "../_generated/api";
import {
  resolveLimits,
  validateUnitsAgainstTier,
  type TierKey,
} from "../billing/limits";

const billingApi = api.billing as any;
export const DEFAULT_USAGE_TIMEZONE = "America/Sao_Paulo";

const SUBSCRIPTION_REQUIRED_MESSAGE =
  "Sua assinatura não está ativa. Ative um plano para continuar.";

const ACTIVE_STATUSES = new Set(["active", "trialing"]);

const UNIT_CAP_MESSAGES: Record<TierKey, string> = {
  avulso: "A oferta Avulso permite até 100 unidades. Seu condomínio possui {{units}}.",
  essencial: "O plano Essencial permite até 100 unidades. Seu condomínio possui {{units}}. Faça upgrade para Gestão.",
  gestao: "O plano Gestão permite até 300 unidades. Seu condomínio possui {{units}}. Fale conosco sobre o plano Administradora.",
  administradora: "O plano Administradora permite até 1.000 unidades. Seu cadastro possui {{units}}. Fale com vendas.",
};

const ASSEMBLY_QUOTA_MESSAGES: Partial<Record<TierKey, string>> = {
  avulso: "A assembleia avulsa contratada já foi utilizada.",
  essencial: "Você atingiu o limite de 6 assembleias neste ciclo anual. Faça upgrade para Gestão.",
  gestao: "Você atingiu o limite de 18 assembleias neste ciclo anual.",
  administradora: "Você atingiu o limite de 60 assembleias neste ciclo anual.",
};

type ReadCtx = QueryCtx | MutationCtx;

type UnitsValidationReason = "below_min" | "above_max";

export interface UsageGateResult {
  allowed: true;
  tierKey: TierKey;
  bucketKey: string;
  remaining: number | "unlimited";
  unitsCount: number;
  assemblyEntitlementId?: Id<"assemblyEntitlements">;
}

export async function getAssemblyUsage(
  ctx: ReadCtx,
  tenantId: Id<"condos">,
  bucketKey: string
) {
  const existing = await ctx.db
    .query("usages")
    .withIndex("byTenantTypeBucket", (q) =>
      q
        .eq("tenantId", tenantId)
        .eq("type", "assembly")
        .eq("bucketKey", bucketKey)
    )
    .unique();

  return { count: existing?.count ?? 0 };
}

export async function incrementAssemblyUsage(
  ctx: MutationCtx,
  tenantId: Id<"condos">,
  bucketKey: string
) {
  const now = Date.now();
  const existing = await ctx.db
    .query("usages")
    .withIndex("byTenantTypeBucket", (q) =>
      q
        .eq("tenantId", tenantId)
        .eq("type", "assembly")
        .eq("bucketKey", bucketKey)
    )
    .unique();

  if (existing) {
    await ctx.db.patch(existing._id, {
      count: existing.count + 1,
      updatedAt: now,
    });
    return existing.count + 1;
  }

  await ctx.db.insert("usages", {
    tenantId,
    type: "assembly",
    bucketKey,
    count: 1,
    updatedAt: now,
  });
  return 1;
}

export function getAnnualBillingBucket(billingCycleAnchor?: number | null) {
  const anchor = new Date(billingCycleAnchor ?? Date.now());
  const now = new Date();
  let cycleStart = Date.UTC(
    now.getUTCFullYear(),
    anchor.getUTCMonth(),
    anchor.getUTCDate(),
  );
  if (cycleStart > now.getTime()) {
    cycleStart = Date.UTC(
      now.getUTCFullYear() - 1,
      anchor.getUTCMonth(),
      anchor.getUTCDate(),
    );
  }
  return {
    key: `billing-year:${new Date(cycleStart).toISOString().slice(0, 10)}`,
    cycleStart,
  };
}

export async function ensureCanCreateAssembly(
  ctx: MutationCtx,
  tenantId: Id<"condos">
): Promise<UsageGateResult> {
  const entitlements = await ctx.runQuery(billingApi.entitlements, {
    tenantId,
  });

  const subscriptionStatus =
    entitlements?.subscription?.status?.toLowerCase() ?? "";
  const isSubscriptionActive =
    entitlements?.active ||
    ACTIVE_STATUSES.has(subscriptionStatus);

  if (!isSubscriptionActive || !entitlements?.tierKey) {
    throw new Error(SUBSCRIPTION_REQUIRED_MESSAGE);
  }

  const tierKey = entitlements.tierKey as TierKey;
  const limits = resolveLimits(tierKey);

  const units = await ctx.db
    .query("units")
    .withIndex("byCondo", (q) => q.eq("condoId", tenantId))
    .collect();
  const unitsCount = units.length;

  const validation = validateUnitsAgainstTier(unitsCount, tierKey);
  if (!validation.ok) {
    throw new Error(formatUnitCapMessage(tierKey, unitsCount, validation.reason));
  }

  const { key: bucketKey } = getAnnualBillingBucket(
    entitlements.subscription?.billingCycleAnchor,
  );

  const usage = await getAssemblyUsage(ctx, tenantId, bucketKey);

  if (usage.count >= limits.assembliesPerYear) {
    throw new Error(formatAssemblyQuotaMessage(tierKey));
  }

  return {
    allowed: true,
    tierKey,
    bucketKey,
    remaining: Math.max(0, limits.assembliesPerYear - usage.count),
    unitsCount,
    assemblyEntitlementId: entitlements.assemblyEntitlementId ?? undefined,
  };
}

function formatUnitCapMessage(
  tierKey: TierKey,
  unitsCount: number,
  reason?: UnitsValidationReason
) {
  const template =
    UNIT_CAP_MESSAGES[tierKey];

  if (!template) {
    return "Limite de unidades excedido. Ajuste seu plano.";
  }

  return template.replace("{{units}}", String(unitsCount));
}

function formatAssemblyQuotaMessage(tierKey: TierKey) {
  return (
    ASSEMBLY_QUOTA_MESSAGES[tierKey] ??
    "Você atingiu o limite de assembleias neste mês."
  );
}
