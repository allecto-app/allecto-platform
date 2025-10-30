import { describe, expect, it } from "vitest";
import { resolveLimits, validateUnitsAgainstTier } from "../convex/billing/limits";

describe("resolveLimits", () => {
  it("returns limits for Essencial", () => {
    expect(resolveLimits("essencial")).toEqual({
      tierKey: "essencial",
      monthlyAssembliesLimit: 2,
      unitMax: 99,
    });
  });

  it("returns limits for Plus", () => {
    expect(resolveLimits("plus")).toEqual({
      tierKey: "plus",
      monthlyAssembliesLimit: 5,
      unitMin: 100,
      unitMax: 300,
    });
  });

  it("returns limits for Pro", () => {
    expect(resolveLimits("pro")).toEqual({
      tierKey: "pro",
      monthlyAssembliesLimit: "unlimited",
      unitMin: 301,
    });
  });
});

describe("validateUnitsAgainstTier", () => {
  it("accepts Essencial within cap", () => {
    expect(validateUnitsAgainstTier(50, "essencial")).toEqual({ ok: true });
  });

  it("rejects Essencial above max", () => {
    expect(validateUnitsAgainstTier(120, "essencial")).toEqual({
      ok: false,
      reason: "above_max",
    });
  });

  it("flags Plus below minimum", () => {
    expect(validateUnitsAgainstTier(80, "plus")).toEqual({
      ok: false,
      reason: "below_min",
    });
  });

  it("accepts Plus within range", () => {
    expect(validateUnitsAgainstTier(200, "plus")).toEqual({ ok: true });
  });

  it("rejects Plus above max", () => {
    expect(validateUnitsAgainstTier(400, "plus")).toEqual({
      ok: false,
      reason: "above_max",
    });
  });

  it("accepts Pro with high unit count", () => {
    expect(validateUnitsAgainstTier(450, "pro")).toEqual({ ok: true });
  });

  it("flags Pro below minimum threshold", () => {
    expect(validateUnitsAgainstTier(200, "pro")).toEqual({
      ok: false,
      reason: "below_min",
    });
  });
});
