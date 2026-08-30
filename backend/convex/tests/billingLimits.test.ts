import { describe, expect, it } from "vitest";
import { resolveLimits, validateUnitsAgainstTier } from "../convex/billing/limits";
import { checkoutModeForTier, LEGACY_TIER_ALIASES, normalizeTierKey } from "../convex/actions/billing/helpers";

describe("commercial plan limits", () => {
  it.each([
    ["avulso", 1, 100, null],
    ["essencial", 6, 100, 5],
    ["gestao", 18, 300, 20],
    ["administradora", 60, 1000, 100],
  ] as const)("returns annual limits for %s", (tier, assemblies, units, storage) => {
    expect(resolveLimits(tier)).toMatchObject({
      tierKey: tier,
      assembliesPerYear: assemblies,
      unitMax: units,
      storageGb: storage,
    });
  });

  it("enforces each unit ceiling", () => {
    expect(validateUnitsAgainstTier(100, "essencial")).toEqual({ ok: true });
    expect(validateUnitsAgainstTier(101, "essencial")).toEqual({ ok: false, reason: "above_max" });
    expect(validateUnitsAgainstTier(301, "gestao")).toEqual({ ok: false, reason: "above_max" });
  });

  it("maps legacy keys without changing their external identifiers", () => {
    expect(LEGACY_TIER_ALIASES).toEqual({ plus: "gestao", pro: "administradora" });
    expect(normalizeTierKey("plus")).toBe("gestao");
    expect(normalizeTierKey("pro")).toBe("administradora");
  });

  it("rejects invalid tier keys", () => {
    expect(normalizeTierKey("enterprise")).toBeNull();
    expect(normalizeTierKey("invalid")).toBeNull();
  });

  it("uses payment mode only for Avulso", () => {
    expect(checkoutModeForTier("avulso")).toBe("payment");
    expect(checkoutModeForTier("essencial")).toBe("subscription");
    expect(checkoutModeForTier("gestao")).toBe("subscription");
    expect(checkoutModeForTier("administradora")).toBe("subscription");
  });
});
