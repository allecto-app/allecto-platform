'use node';
import { action } from "../../_generated/server";
import { v } from "convex/values";
import { api } from "../../_generated/api";
import { getStripeClient } from "../../stripe/client";
import { normalizeEmail } from "../../_secu";
import { ensureAbsoluteUrl, getPriceIdFromEnv, tierKeyValidator } from "./helpers";

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
    const context = await ctx.runQuery(api.billing.resolveBillingContext, {
      tenantId,
      sessionToken: args.sessionToken ?? undefined,
      onboardingToken: args.onboardingToken ?? undefined,
      expectedTier: tierKey,
    });

    const email = context.email;
    if (!email) {
      throw new Error("Billing email is required");
    }

    const normalizedEmail = normalizeEmail(email);

    const existingRecord = await ctx.runQuery(api.billing.findStripeCustomerRecord, {
      tenantId,
      email: normalizedEmail,
    });

    const successUrl = ensureAbsoluteUrl("successUrl", args.successUrl);
    const cancelUrl = ensureAbsoluteUrl("cancelUrl", args.cancelUrl);

    const priceId = getPriceIdFromEnv(tierKey);
    const stripe = getStripeClient();
    let customerId = existingRecord?.stripeCustomerId ?? null;

    if (customerId) {
      if (existingRecord?.email !== normalizedEmail) {
        await stripe.customers.update(customerId, { email: normalizedEmail });
      }
      await ctx.runMutation(api.billing.saveStripeCustomerRecord, {
        tenantId,
        stripeCustomerId: customerId,
        email: normalizedEmail,
        recordId: existingRecord?._id,
      });
    } else {
      const customer = await stripe.customers.create({
        email: normalizedEmail,
        metadata: {
          tenantId: tenantId.toString(),
        },
      });
      customerId = customer.id;
      await ctx.runMutation(api.billing.saveStripeCustomerRecord, {
        tenantId,
        stripeCustomerId: customerId,
        email: normalizedEmail,
      });
    }

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
      await ctx.runMutation(api.billing.markCheckoutInitiated, {
        tenantId,
        onboardingSessionId: context.onboardingSessionId,
        tierKey,
      });
    }

    return { url: session.url };
  },
});
