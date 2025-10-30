export type TierKey = "essencial" | "plus" | "pro";

export type MonthlyAssembliesLimit = number | "unlimited";

export interface TierLimits {
  tierKey: TierKey;
  monthlyAssembliesLimit: MonthlyAssembliesLimit;
  unitMin?: number;
  unitMax?: number;
}

export interface UnitsValidationResult {
  ok: boolean;
  reason?: "below_min" | "above_max";
}

export function resolveLimits(tierKey: TierKey): TierLimits {
  if (tierKey === "essencial") {
    return {
      tierKey,
      monthlyAssembliesLimit: 2,
      unitMax: 99,
    };
  }

  if (tierKey === "plus") {
    return {
      tierKey,
      monthlyAssembliesLimit: 5,
      unitMin: 100,
      unitMax: 300,
    };
  }

  return {
    tierKey: "pro",
    monthlyAssembliesLimit: "unlimited",
    unitMin: 301,
  };
}

export function validateUnitsAgainstTier(unitsCount: number, tierKey: TierKey): UnitsValidationResult {
  const limits = resolveLimits(tierKey);

  if (typeof limits.unitMin === "number" && unitsCount < limits.unitMin) {
    return { ok: false, reason: "below_min" };
  }

  if (typeof limits.unitMax === "number" && unitsCount > limits.unitMax) {
    return { ok: false, reason: "above_max" };
  }

  return { ok: true };
}
