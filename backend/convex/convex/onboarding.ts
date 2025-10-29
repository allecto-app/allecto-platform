import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { normalizeEmail, randomToken, sha256 } from "./_secu";

const PLAN_KEYS = ["essencial", "plus", "pro"] as const;
type TierKey = (typeof PLAN_KEYS)[number];

const SUBDOMAIN_REGEX = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

const DEFAULT_BRANDING = {
  displayName: undefined as string | undefined,
  primaryColor: "#042940",
  secondaryColor: "#9FC131",
  accentColor: "#005C53",
};

export const startTenantSignup = mutation({
  args: {
    tierKey: v.union(v.literal("essencial"), v.literal("plus"), v.literal("pro")),
    condoName: v.string(),
    subdomain: v.string(),
    adminName: v.string(),
    adminEmail: v.string(),
    adminPhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const tierKey = args.tierKey as TierKey;
    if (!PLAN_KEYS.includes(tierKey)) {
      throw new Error("INVALID_TIER");
    }

    const condoName = args.condoName.trim();
    if (condoName.length < 3) {
      throw new Error("INVALID_NAME");
    }

    const rawSubdomain = args.subdomain.trim().toLowerCase();
    if (!SUBDOMAIN_REGEX.test(rawSubdomain)) {
      throw new Error("INVALID_SUBDOMAIN");
    }

    const adminName = args.adminName.trim();
    if (!adminName) {
      throw new Error("ADMIN_NAME_REQUIRED");
    }

    const adminEmail = normalizeEmail(args.adminEmail);
    if (!adminEmail) {
      throw new Error("ADMIN_EMAIL_REQUIRED");
    }

    const adminPhone = args.adminPhone?.trim();

    const existingCondo = await ctx.db
      .query("condos")
      .withIndex("bySubdomain", (q) => q.eq("subdomain", rawSubdomain))
      .unique();
    if (existingCondo) {
      throw new Error("SUBDOMAIN_TAKEN");
    }

    const branding = { ...DEFAULT_BRANDING, displayName: condoName };

    const condoId = await ctx.db.insert("condos", {
      name: condoName,
      subdomain: rawSubdomain,
      branding,
      timezone: "America/Sao_Paulo",
      isActive: true,
      disabledAt: undefined,
      billingTier: tierKey,
      billingStatus: "pending_checkout",
      onboardingTokenVersion: 1,
      createdAt: now,
      updatedAt: now,
    });

    const residentId = await ctx.db.insert("residents", {
      condoId,
      name: adminName,
      email: adminEmail,
      phone: adminPhone,
      role: "syndic",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    const onboardingToken = randomToken(32);
    const tokenHash = await sha256(onboardingToken);

    const expiresAt = now + 60 * 60 * 1000; // 1 hour

    await ctx.db.insert("onboardingSessions", {
      tenantId: condoId,
      tierKey,
      email: adminEmail,
      tokenHash,
      status: "pending",
      createdAt: now,
      updatedAt: now,
      expiresAt,
      metadata: {
        adminName,
      },
    });

    return {
      tenantId: condoId,
      residentId,
      onboardingToken,
      expiresAt,
    };
  },
});
