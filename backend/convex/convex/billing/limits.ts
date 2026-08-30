export type TierKey = "avulso" | "essencial" | "gestao" | "administradora";

export interface TierLimits {
  tierKey: TierKey;
  assembliesPerYear: number;
  unitMax: number;
  condominiums: number;
  storageGb: number | null;
  assemblyDurationDays?: number;
}

const LIMITS: Record<TierKey, TierLimits> = {
  avulso: { tierKey: "avulso", assembliesPerYear: 1, unitMax: 100, condominiums: 1, storageGb: null, assemblyDurationDays: 15 },
  essencial: { tierKey: "essencial", assembliesPerYear: 6, unitMax: 100, condominiums: 1, storageGb: 5 },
  gestao: { tierKey: "gestao", assembliesPerYear: 18, unitMax: 300, condominiums: 1, storageGb: 20 },
  administradora: { tierKey: "administradora", assembliesPerYear: 60, unitMax: 1000, condominiums: 5, storageGb: 100 },
};

export function resolveLimits(tierKey: TierKey): TierLimits { return LIMITS[tierKey]; }

export function validateUnitsAgainstTier(unitsCount: number, tierKey: TierKey) {
  return unitsCount > LIMITS[tierKey].unitMax
    ? { ok: false as const, reason: "above_max" as const }
    : { ok: true as const };
}
