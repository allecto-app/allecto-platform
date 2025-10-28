'use node';

import { action } from "../../_generated/server";
import { v } from "convex/values";
import { getStripeClient, getOrCreateCustomer } from "../../stripe/client";
import { ensureAbsoluteUrl, resolveBillingContext } from "./helpers";

export const createPortalSession = action({
  args: {
    tenantId: v.id("condos"),
    returnUrl: v.string(),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tenant = await ctx.db.get(args.tenantId);
    if (!tenant) {
      throw new Error("TENANT_NOT_FOUND");
    }

    const context = await resolveBillingContext(ctx, args.tenantId, {
      sessionToken: args.sessionToken ?? null,
    });

    const email = context.email;
    const stripe = getStripeClient();
    const customerId = await getOrCreateCustomer(ctx, args.tenantId, email);
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
