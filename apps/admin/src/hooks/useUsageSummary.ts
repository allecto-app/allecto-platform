import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api, Id } from "../lib/convexGenerated";

export type TierKey = "avulso" | "essencial" | "gestao" | "administradora";

type BaseUsageSummary = {
  usage: {
    cycleKey: string;
    assembliesCount: number;
  };
  unitsCount: number;
  unitValidationReason: "below_min" | "above_max" | null;
};

type InactiveSummary = BaseUsageSummary & {
  active: false;
  tierKey: null;
  limits: null;
  remaining: null;
  unitsOk: false;
};

type ActiveSummary = BaseUsageSummary & {
  active: true;
  tierKey: TierKey;
  limits: {
    tierKey: TierKey;
    assembliesPerYear: number;
    unitMax: number;
    condominiums: number;
    storageGb: number | null;
    assemblyDurationDays?: number;
  };
  remaining: number;
  unitsOk: boolean;
};

type UsageSummary = InactiveSummary | ActiveSummary;

export type AssemblyBlockReason = {
  code:
    | "subscription_required"
    | "unit_cap_exceeded"
    | "assembly_quota_exceeded";
  message: string;
  tierKey?: TierKey | null;
  meta?: Record<string, unknown>;
};

const SUBSCRIPTION_REQUIRED_MESSAGE =
  "Sua assinatura não está ativa. Ative um plano para continuar.";

const UNIT_CAP_MESSAGES: Record<TierKey, string> = {
  avulso: "A oferta Avulso permite até 100 unidades. Seu condomínio possui {{units}}.",
  essencial: "Seu plano Essencial permite até 100 unidades. Seu condomínio possui {{units}}. Faça upgrade para Gestão.",
  gestao: "Seu plano Gestão permite até 300 unidades. Seu condomínio possui {{units}}.",
  administradora: "Seu plano Administradora permite até 1.000 unidades. Seu cadastro possui {{units}}.",
};

const UNIT_CAP_BELOW_MIN_MESSAGES: Partial<Record<TierKey, string>> = {};

const ASSEMBLY_QUOTA_MESSAGES: Partial<Record<TierKey, string>> = {
  avulso: "A assembleia avulsa contratada já foi utilizada.",
  essencial: "Você atingiu o limite de 6 assembleias neste ciclo anual. Faça upgrade para Gestão.",
  gestao: "Você atingiu o limite de 18 assembleias neste ciclo anual.",
  administradora: "Você atingiu o limite de 60 assembleias neste ciclo anual.",
};

export function useUsageSummary(tenantId: Id<"condos"> | null) {
  const summary = useQuery(
    api.usage.getUsageSummary,
    tenantId ? { tenantId } : "skip"
  ) as UsageSummary | undefined;

  const isLoading = tenantId !== null && summary === undefined;

  const blockReason = useMemo(
    () => resolveBlockReason(summary ?? null),
    [summary]
  );
  const remainingLabel = useMemo(
    () => buildRemainingLabel(summary ?? null),
    [summary]
  );

  return {
    summary: summary ?? null,
    isLoading,
    blockReason,
    canCreate: !isLoading && blockReason === null,
    remainingLabel,
  };
}

export function assertCanCreateAssembly(summary: UsageSummary | null) {
  const block = resolveBlockReason(summary);
  if (block) {
    throw block;
  }
}

function resolveBlockReason(
  summary: UsageSummary | null
): AssemblyBlockReason | null {
  if (!summary) return null;

  if (!summary.active) {
    return {
      code: "subscription_required",
      message: SUBSCRIPTION_REQUIRED_MESSAGE,
      tierKey: null,
    };
  }

  if (!summary.unitsOk) {
    const template =
      (summary.unitValidationReason === "below_min"
        ? UNIT_CAP_BELOW_MIN_MESSAGES[summary.tierKey]
        : UNIT_CAP_MESSAGES[summary.tierKey]) ??
      "Limite de unidades excedido. Ajuste seu plano.";

    return {
      code: "unit_cap_exceeded",
      message: template.replace("{{units}}", String(summary.unitsCount)),
      tierKey: summary.tierKey,
      meta: {
        units: summary.unitsCount,
        reason: summary.unitValidationReason,
      },
    };
  }

  if (summary.remaining <= 0) {
    const message =
      ASSEMBLY_QUOTA_MESSAGES[summary.tierKey] ??
      "Você atingiu o limite de assembleias neste ciclo anual.";
    return {
      code: "assembly_quota_exceeded",
      message,
      tierKey: summary.tierKey,
    };
  }

  return null;
}

function buildRemainingLabel(summary: UsageSummary | null) {
  if (!summary || !summary.active) {
    return null;
  }

  const planLabel = `Plano ${capitalize(summary.tierKey)}`;

  if (!summary.unitsOk) {
    return `${planLabel} · ${summary.unitsCount} unidades cadastradas`;
  }

  const count = summary.remaining;
  const suffix = count === 1 ? "assembleia restante" : "assembleias restantes";
  return `${planLabel} · ${count} ${suffix} neste ciclo anual`;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
