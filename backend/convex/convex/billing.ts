import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import {
  tierKeyValidator,
  resolveBillingContext as resolveBillingContextHelper,
  markOnboardingSessionStatus,
  updateTenantBillingState,
  normalizeTierKey,
} from "./actions/billing/helpers";

const subscriptionStatusValidator = v.union(
  v.literal("active"),
  v.literal("trialing"),
  v.literal("past_due"),
  v.literal("canceled"),
  v.literal("unpaid"),
  v.literal("incomplete"),
  v.literal("incomplete_expired"),
);

export { createCheckoutSession } from "./actions/billing/createCheckoutSession";
export { createPortalSession } from "./actions/billing/createPortalSession";
export { entitlements } from "./queries/billing/entitlements";
export { handleStripeWebhook } from "./actions/billing/handleStripeWebhook";
export { sendOnboardingSuccessEmail } from "./actions/billing/sendOnboardingSuccessEmail";
export { refreshTenantUsage } from "./actions/billing/refreshTenantUsage";

export const resolveBillingContext = query({
  args: {
    tenantId: v.id("condos"),
    sessionToken: v.optional(v.string()),
    onboardingToken: v.optional(v.string()),
    expectedTier: v.optional(tierKeyValidator),
  },
  handler: async (ctx, args) => {
    const tenant = await ctx.db.get(args.tenantId);
    if (!tenant) {
      throw new Error("TENANT_NOT_FOUND");
    }

    const context = await resolveBillingContextHelper(ctx, args.tenantId, {
      sessionToken: args.sessionToken ?? null,
      onboardingToken: args.onboardingToken ?? null,
      expectedTier: args.expectedTier ?? undefined,
    });

    return {
      email: context.email,
      source: context.source,
      onboardingSessionId:
        context.source === "onboarding" ? context.onboardingSessionId : undefined,
      tierKey: context.source === "onboarding" ? context.tierKey : undefined,
    };
  },
});

export const getTenantIfExists = query({
  args: {
    tenantId: v.id("condos"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.tenantId);
  },
});

export const findStripeCustomerRecord = query({
  args: {
    tenantId: v.id("condos"),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.trim().toLowerCase();
    const byEmail = await ctx.db
      .query("stripeCustomers")
      .withIndex("byEmail", (q) => q.eq("email", normalizedEmail))
      .first();
    if (byEmail) {
      return byEmail;
    }
    const byTenant = await ctx.db
      .query("stripeCustomers")
      .withIndex("byTenant", (q) => q.eq("tenantId", args.tenantId))
      .first();
    return byTenant ?? null;
  },
});

export const findStripeCustomerById = query({
  args: {
    stripeCustomerId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("stripeCustomers")
      .withIndex("byStripeCustomerId", (q) => q.eq("stripeCustomerId", args.stripeCustomerId))
      .first();
  },
});

export const saveStripeCustomerRecord = mutation({
  args: {
    tenantId: v.id("condos"),
    stripeCustomerId: v.string(),
    email: v.string(),
    recordId: v.optional(v.id("stripeCustomers")),
  },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.trim().toLowerCase();
    const now = Date.now();
    if (args.recordId) {
      await ctx.db.patch(args.recordId, {
        tenantId: args.tenantId,
        stripeCustomerId: args.stripeCustomerId,
        email: normalizedEmail,
        updatedAt: now,
      });
      return args.recordId;
    }
    return await ctx.db.insert("stripeCustomers", {
      tenantId: args.tenantId,
      stripeCustomerId: args.stripeCustomerId,
      email: normalizedEmail,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const markCheckoutInitiated = mutation({
  args: {
    tenantId: v.id("condos"),
    onboardingSessionId: v.optional(v.id("onboardingSessions")),
    tierKey: v.optional(tierKeyValidator),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const updates: Record<string, unknown> = {
      updatedAt: now,
    };
    if (args.tierKey) {
      updates.billingTier = args.tierKey;
      updates.billingStatus = "pending_checkout";
    }
    await ctx.db.patch(args.tenantId, updates);
    if (args.onboardingSessionId) {
      await markOnboardingSessionStatus(ctx, args.onboardingSessionId, "checkout_started");
    }
  },
});

export const upsertStripeSubscriptionRecord = mutation({
  args: {
    tenantId: v.id("condos"),
    data: v.object({
      stripeSubscriptionId: v.string(),
      productId: v.string(),
      priceId: v.string(),
      status: subscriptionStatusValidator,
      currentPeriodStart: v.number(),
      currentPeriodEnd: v.number(),
      cancelAt: v.optional(v.number()),
      cancelAtPeriodEnd: v.optional(v.boolean()),
      trialEnd: v.optional(v.number()),
      latestInvoiceId: v.optional(v.string()),
      latestInvoiceStatus: v.optional(v.string()),
      tierKey: v.optional(v.union(v.literal("essencial"), v.literal("plus"), v.literal("pro"))),
    }),
    statusOverride: v.optional(subscriptionStatusValidator),
  },
  handler: async (ctx, args) => {
    const payload = args.data;
    const status = args.statusOverride ?? payload.status;
    const now = Date.now();

    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("byStripeSubscriptionId", (q) => q.eq("stripeSubscriptionId", payload.stripeSubscriptionId))
      .first();

    const record = {
      tenantId: args.tenantId,
      stripeSubscriptionId: payload.stripeSubscriptionId,
      productId: payload.productId,
      priceId: payload.priceId,
      status,
      currentPeriodStart: payload.currentPeriodStart,
      currentPeriodEnd: payload.currentPeriodEnd,
      cancelAt: payload.cancelAt,
      cancelAtPeriodEnd: payload.cancelAtPeriodEnd,
      trialEnd: payload.trialEnd,
      latestInvoiceId: payload.latestInvoiceId,
      latestInvoiceStatus: payload.latestInvoiceStatus,
      tierKey: payload.tierKey ?? existing?.tierKey,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, record);
    } else {
      await ctx.db.insert("subscriptions", {
        ...record,
        tenantId: args.tenantId,
      });
    }

    const tierHint = normalizeTierKey(payload.tierKey ?? existing?.tierKey ?? null);
    await updateTenantBillingState(ctx, args.tenantId, status, payload.priceId, tierHint);
  },
});
