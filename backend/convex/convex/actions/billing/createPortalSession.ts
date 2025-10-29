'use node';

import { action } from "../../_generated/server";
import { v } from "convex/values";
import { api } from "../../_generated/api";
import { getStripeClient } from "../../stripe/client";
import { normalizeEmail } from "../../_secu";
import { ensureAbsoluteUrl } from "./helpers";

export const createPortalSession = action({
  args: {
    tenantId: v.id("condos"),
    returnUrl: v.string(),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const context = await ctx.runQuery(api.billing.resolveBillingContext, {
      tenantId: args.tenantId,
      sessionToken: args.sessionToken ?? undefined,
    });

    const email = context.email;
    if (!email) {
      throw new Error("Billing email is required");
    }

    const normalizedEmail = normalizeEmail(email);

    const existingRecord = await ctx.runQuery(api.billing.findStripeCustomerRecord, {
      tenantId: args.tenantId,
      email: normalizedEmail,
    });

    const stripe = getStripeClient();
    let customerId = existingRecord?.stripeCustomerId ?? null;

    if (customerId) {
      if (existingRecord?.email !== normalizedEmail) {
        await stripe.customers.update(customerId, { email: normalizedEmail });
      }
      await ctx.runMutation(api.billing.saveStripeCustomerRecord, {
        tenantId: args.tenantId,
        stripeCustomerId: customerId,
        email: normalizedEmail,
        recordId: existingRecord?._id,
      });
    } else {
      const customer = await stripe.customers.create({
        email: normalizedEmail,
        metadata: {
          tenantId: args.tenantId.toString(),
        },
      });
      customerId = customer.id;
      await ctx.runMutation(api.billing.saveStripeCustomerRecord, {
        tenantId: args.tenantId,
        stripeCustomerId: customerId,
        email: normalizedEmail,
      });
    }

    const returnUrl = ensureAbsoluteUrl("returnUrl", args.returnUrl);

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    if (!session.url) {
      throw new Error("Failed to create Stripe billing portal session");
    }

    return { url: session.url };
  },
});
