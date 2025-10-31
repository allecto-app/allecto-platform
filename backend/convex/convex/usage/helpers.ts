import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { api } from "../_generated/api";
import { getMonthlyBucket } from "../../../../packages/shared/date/period";
import {
  resolveLimits,
  validateUnitsAgainstTier,
  type TierKey,
} from "../billing/limits";

const billingApi = api.billing as any;
export const DEFAULT_USAGE_TIMEZONE = "America/Sao_Paulo";

const SUBSCRIPTION_REQUIRED_MESSAGE =
  "Sua assinatura não está ativa. Ative um plano para continuar.";

const UNIT_CAP_MESSAGES: Record<Exclude<TierKey, "pro">, string> = {
  essencial:
    "Seu plano Essencial permite até 99 unidades. Seu condomínio possui {{units}}. Faça upgrade para o plano Plus.",
  plus: "Seu plano Plus permite 100–300 unidades. Seu condomínio possui {{units}}. Faça upgrade para o plano Pró.",
};

const UNIT_CAP_BELOW_MIN_MESSAGES: Partial<Record<TierKey, string>> = {
  plus: "Seu plano Plus cobre entre 100 e 300 unidades. Seu condomínio possui {{units}}. Faça downgrade para o plano Essencial ou ajuste seu cadastro.",
};

const ASSEMBLY_QUOTA_MESSAGES: Partial<Record<TierKey, string>> = {
  essencial:
    "Você atingiu o limite de 2 assembleias neste mês. Faça upgrade para o plano Plus.",
  plus: "Você atingiu o limite de 5 assembleias neste mês. Faça upgrade para o plano Pró.",
};

type ReadCtx = QueryCtx | MutationCtx;

type UnitsValidationReason = "below_min" | "above_max";

export interface UsageGateResult {
  allowed: true;
  tierKey: TierKey;
  bucketKey: string;
  remaining: number | "unlimited";
  unitsCount: number;
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

export async function ensureCanCreateAssembly(
  ctx: MutationCtx,
  tenantId: Id<"condos">
): Promise<UsageGateResult> {
  const entitlements = await ctx.runQuery(billingApi.entitlements, {
    tenantId,
  });

  if (!entitlements?.active || !entitlements.tierKey) {
    throw new Error(SUBSCRIPTION_REQUIRED_MESSAGE);
  }

  const tierKey = entitlements.tierKey as TierKey;
  const limits = resolveLimits(tierKey);

  const tenant = await ctx.db.get(tenantId);
  const timezone = tenant?.timezone ?? DEFAULT_USAGE_TIMEZONE;

  const units = await ctx.db
    .query("units")
    .withIndex("byCondo", (q) => q.eq("condoId", tenantId))
    .collect();
  const unitsCount = units.length;

  const validation = validateUnitsAgainstTier(unitsCount, tierKey);
  if (!validation.ok) {
    if (tierKey === "pro" && validation.reason === "below_min") {
      // Pro plan is effectively unlimited; ignore low unit counts.
    } else {
      throw new Error(
        formatUnitCapMessage(tierKey, unitsCount, validation.reason)
      );
    }
  }

  const { key: bucketKey } = getMonthlyBucket(Date.now(), timezone);

  if (limits.monthlyAssembliesLimit === "unlimited") {
    return {
      allowed: true,
      tierKey,
      bucketKey,
      remaining: "unlimited",
      unitsCount,
    };
  }

  const usage = await getAssemblyUsage(ctx, tenantId, bucketKey);

  if (usage.count >= limits.monthlyAssembliesLimit) {
    throw new Error(formatAssemblyQuotaMessage(tierKey));
  }

  return {
    allowed: true,
    tierKey,
    bucketKey,
    remaining: Math.max(0, limits.monthlyAssembliesLimit - usage.count),
    unitsCount,
  };
}

function formatUnitCapMessage(
  tierKey: TierKey,
  unitsCount: number,
  reason?: UnitsValidationReason
) {
  const template =
    reason === "below_min"
      ? UNIT_CAP_BELOW_MIN_MESSAGES[tierKey]
      : UNIT_CAP_MESSAGES[tierKey as Exclude<TierKey, "pro">];

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
