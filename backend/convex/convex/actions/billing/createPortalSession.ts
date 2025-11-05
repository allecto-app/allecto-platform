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
    const billingApi = api.billing as any;

    let context: { email: string | null } | null = null;
    try {
      context = await ctx.runQuery(billingApi.resolveBillingContext, {
        tenantId: args.tenantId,
        sessionToken: args.sessionToken ?? undefined,
      });
    } catch (error) {
      console.warn("[billing.portal] Failed to resolve billing context", error);
    }

    let email = context?.email ?? null;

    if (!email) {
      const residents = (await ctx.runQuery(api.residents.list, {
        condoId: args.tenantId,
      })) as Array<{ email?: string | null; role?: string }>;

      const eligible = residents.find(
        (resident) => resident?.role === "syndic" || resident?.role === "manager",
      );
      const fallback = eligible ?? residents[0] ?? null;
      email = fallback?.email ?? null;
    }

    if (!email) {
      throw new Error("Não encontramos um e-mail para abrir o portal de pagamento deste condomínio.");
    }

    const normalizedEmail = normalizeEmail(email);

    const existingRecord = await ctx.runQuery(billingApi.findStripeCustomerRecord, {
      tenantId: args.tenantId,
      email: normalizedEmail,
    });

    const stripe = getStripeClient();
    let customerId = existingRecord?.stripeCustomerId ?? null;

    if (customerId) {
      if (existingRecord?.email !== normalizedEmail) {
        await stripe.customers.update(customerId, { email: normalizedEmail });
      }
      await ctx.runMutation(billingApi.saveStripeCustomerRecord, {
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
      await ctx.runMutation(billingApi.saveStripeCustomerRecord, {
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
