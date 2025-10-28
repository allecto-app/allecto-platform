'use node';
import { action } from "../../_generated/server";
import { v } from "convex/values";
import { getStripeClient, getOrCreateCustomer } from "../../stripe/client";
import {
  ensureAbsoluteUrl,
  getPriceIdFromEnv,
  markOnboardingSessionStatus,
  resolveBillingContext,
  tierKeyValidator,
} from "./helpers";

export const createCheckoutSession = action({
  args: {
    tenantId: v.id("condos"),
    tierKey: tierKeyValidator,
    successUrl: v.string(),
    cancelUrl: v.string(),
    sessionToken: v.optional(v.string()),
    onboardingToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { tenantId, tierKey } = args;
    const tenant = await ctx.db.get(tenantId);
    if (!tenant) {
      throw new Error("TENANT_NOT_FOUND");
    }

    const context = await resolveBillingContext(ctx, tenantId, {
      sessionToken: args.sessionToken ?? null,
      onboardingToken: args.onboardingToken ?? null,
      expectedTier: tierKey,
    });

    const email = context.email;
    if (!email) throw new Error("Billing email is required");

    const successUrl = ensureAbsoluteUrl("successUrl", args.successUrl);
    const cancelUrl = ensureAbsoluteUrl("cancelUrl", args.cancelUrl);

    const priceId = getPriceIdFromEnv(tierKey);
    const stripe = getStripeClient();
    const customerId = await getOrCreateCustomer(ctx, tenantId, email);

    const randomSuffix =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
    const idempotencyKey = `checkout_${tenantId}_${tierKey}_${randomSuffix}`;

    const session = await stripe.checkout.sessions.create(
      {
        mode: "subscription",
        customer: customerId,
        success_url: successUrl,
        cancel_url: cancelUrl,
        allow_promotion_codes: true,
        client_reference_id: tenantId.toString(),
        metadata: {
          tenantId: tenantId.toString(),
          tierKey,
        },
        subscription_data: {
          metadata: {
            tenantId: tenantId.toString(),
            tierKey,
          },
        },
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
      },
      { idempotencyKey },
    );

    if (!session.url) {
      throw new Error("Failed to create Stripe Checkout session");
    }

    if (context.source === "onboarding") {
      await markOnboardingSessionStatus(ctx, context.onboardingSessionId, "checkout_started");
      await ctx.db.patch(tenantId, {
        billingTier: tierKey,
        billingStatus: "pending_checkout",
        updatedAt: Date.now(),
      });
    }

    return { url: session.url };
  },
});
