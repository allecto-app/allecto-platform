'use node';

import type Stripe from "stripe";
import { internalAction } from "../../_generated/server";
import { v } from "convex/values";
import type { Id } from "../../_generated/dataModel";
import { api, internal } from "../../_generated/api";
import { getStripeClient } from "../../stripe/client";
import { normalizeEmail } from "../../_secu";
import { normalizeTierKey, type TierKey } from "./helpers";

const RELEVANT_EVENTS = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.payment_succeeded",
  "invoice.payment_failed",
]);

function toMillis(value: number | null | undefined): number | undefined {
  return typeof value === "number" ? value * 1000 : undefined;
}

function extractTenantId(metadata?: Stripe.Metadata | null, fallback?: string | null): string | null {
  if (metadata) {
    const direct = metadata.tenantId ?? metadata.tenant_id ?? metadata.tenantID;
    if (direct) return direct;
  }
  return fallback ?? null;
}

function resolveCustomerEmail(customer: unknown): string | null {
  if (
    customer &&
    typeof customer === "object" &&
    "email" in customer &&
    !("deleted" in customer)
  ) {
    return (customer as { email?: string | null }).email ?? null;
  }
  return null;
}

function extractPriceInfo(subscription: Stripe.Subscription) {
  const item = subscription.items?.data?.[0];
  const price = item?.price;
  const priceId = typeof price === "string" ? price : price?.id;
  let productId: string | undefined;
  let tierKey: TierKey | undefined;
  if (price && typeof price !== "string") {
    productId = typeof price.product === "string" ? price.product : price.product?.id;
    if (price.metadata && typeof price.metadata.tierKey === "string") {
      const normalized = normalizeTierKey(price.metadata.tierKey);
      if (normalized && normalized !== "avulso") {
        tierKey = normalized;
      }
    }
  }
  return { priceId, productId, tierKey };
}

async function resolveTenantId(
  ctx: any,
  explicitTenantId: Id<"condos"> | null,
  stripeCustomerId: string,
): Promise<Id<"condos"> | null> {
  if (explicitTenantId) {
    const tenant = await ctx.runQuery(api.billing.getTenantIfExists, {
      tenantId: explicitTenantId,
    });
    if (tenant) {
      return explicitTenantId;
    }
  }

  const record = await ctx.runQuery(api.billing.findStripeCustomerById, {
    stripeCustomerId,
  });
  return record ? (record.tenantId as Id<"condos">) : null;
}

async function saveCustomerRecord(
  ctx: any,
  tenantId: Id<"condos">,
  stripeCustomerId: string,
  email: string | null | undefined,
) {
  const normalized = email ? normalizeEmail(email) : null;
  const existing = await ctx.runQuery(api.billing.findStripeCustomerById, {
    stripeCustomerId,
  });
  const emailToPersist = normalized ?? existing?.email ?? "";
  await ctx.runMutation(api.billing.saveStripeCustomerRecord, {
    tenantId,
    stripeCustomerId,
    email: emailToPersist,
    recordId: existing?._id,
  });
}

function buildSubscriptionPayload(subscription: Stripe.Subscription) {
  const { priceId, productId, tierKey } = extractPriceInfo(subscription);
  const now = Date.now();
  const latestInvoiceId =
    typeof subscription.latest_invoice === "string"
      ? subscription.latest_invoice
      : subscription.latest_invoice?.id;
  const latestInvoiceStatus =
    typeof subscription.latest_invoice === "object"
      ? subscription.latest_invoice?.status ?? undefined
      : undefined;

  return {
    stripeSubscriptionId: subscription.id,
    productId: productId ?? "",
    priceId: priceId ?? "",
    status: subscription.status,
    currentPeriodStart: toMillis(subscription.current_period_start) ?? now,
    currentPeriodEnd: toMillis(subscription.current_period_end) ?? now,
    cancelAt: toMillis(subscription.cancel_at),
    cancelAtPeriodEnd: subscription.cancel_at_period_end ?? undefined,
    trialEnd: toMillis(subscription.trial_end),
    latestInvoiceId: latestInvoiceId ?? undefined,
    latestInvoiceStatus,
    tierKey: tierKey ?? undefined,
  };
}

async function handleCheckoutSessionCompleted(ctx: any, session: Stripe.Checkout.Session) {
  const stripe = getStripeClient();
  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
  const customerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id;

  if (session.mode === "payment" && session.payment_status === "paid" && session.metadata?.tierKey === "avulso") {
    const tenantId = (session.metadata.tenantId ?? session.client_reference_id) as Id<"condos"> | null;
    if (!tenantId) throw new Error("AVULSO_TENANT_NOT_FOUND");
    await ctx.runMutation(api.billing.grantAssemblyEntitlement, {
      tenantId,
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id,
    });
    return;
  }

  if (!subscriptionId || !customerId) {
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["items.data.price.product"],
  });

  let tenantIdString =
    extractTenantId(subscription.metadata, session.metadata?.tenantId) ??
    session.client_reference_id ??
    null;

  let tenantId: Id<"condos"> | null = tenantIdString ? (tenantIdString as Id<"condos">) : null;
  tenantId = await resolveTenantId(ctx, tenantId, customerId);

  if (!tenantId) {
    console.warn("[stripeWebhook] Unable to resolve tenant for checkout.session.completed");
    return;
  }

  const customerEmailFromSubscription = resolveCustomerEmail(subscription.customer);

  await saveCustomerRecord(
    ctx,
    tenantId,
    customerId,
    session.customer_details?.email ?? customerEmailFromSubscription ?? null,
  );

  const payload = buildSubscriptionPayload(subscription);
  await ctx.runMutation(api.billing.upsertStripeSubscriptionRecord, {
    tenantId,
    data: payload,
  });

  if (subscription.status === "active" || subscription.status === "trialing") {
    await ctx.scheduler.runAfter(0, internal.billing.sendOnboardingSuccessEmail, {
      tenantId,
      subscriptionId: subscription.id,
      invoiceId: null,
    });
    await ctx.scheduler.runAfter(0, internal.billing.refreshTenantUsage, {
      tenantId,
    });
  }
}

async function handleSubscriptionEvent(ctx: any, payload: Stripe.Subscription) {
  const customerId = typeof payload.customer === "string" ? payload.customer : payload.customer?.id;

  let tenantIdString = extractTenantId(payload.metadata);
  let tenantId: Id<"condos"> | null = tenantIdString ? (tenantIdString as Id<"condos">) : null;
  tenantId = await resolveTenantId(ctx, tenantId, customerId ?? "");

  if (!tenantId || !customerId) {
    console.warn(`[stripeWebhook] Skipping subscription ${payload.id}: tenant not found`);
    return;
  }

  const customerEmailFromPayload = resolveCustomerEmail(payload.customer);

  await saveCustomerRecord(ctx, tenantId, customerId, customerEmailFromPayload ?? null);

  const payloadData = buildSubscriptionPayload(payload);
  await ctx.runMutation(api.billing.upsertStripeSubscriptionRecord, {
    tenantId,
    data: payloadData,
  });

  if (payload.status === "active" || payload.status === "trialing") {
    await ctx.scheduler.runAfter(0, internal.billing.refreshTenantUsage, {
      tenantId,
    });
  }
}

async function handleInvoiceEvent(
  ctx: any,
  invoice: Stripe.Invoice,
  eventType: string,
) {
  const subscriptionId =
    typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;

  if (!subscriptionId || !customerId) {
    console.warn("[stripeWebhook] Invoice without subscription id");
    return;
  }

  const stripe = getStripeClient();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["items.data.price.product"],
  });

  let tenantIdString =
    extractTenantId(subscription.metadata, invoice.metadata?.tenantId) ??
    extractTenantId(invoice.metadata);
  let tenantId: Id<"condos"> | null = tenantIdString ? (tenantIdString as Id<"condos">) : null;
  tenantId = await resolveTenantId(ctx, tenantId, customerId);

  if (!tenantId) {
    console.warn(`[stripeWebhook] Skipping invoice ${invoice.id}: tenant not found`);
    return;
  }

  const customerEmailFromInvoice = invoice.customer_email ?? resolveCustomerEmail(invoice.customer ?? null);

  await saveCustomerRecord(ctx, tenantId, customerId, customerEmailFromInvoice ?? null);

  const payloadData = buildSubscriptionPayload(subscription);
  payloadData.latestInvoiceId = invoice.id ?? payloadData.latestInvoiceId;
  payloadData.latestInvoiceStatus = invoice.status ?? payloadData.latestInvoiceStatus;

  const statusOverride = eventType === "invoice.payment_failed" ? "past_due" : undefined;

  await ctx.runMutation(api.billing.upsertStripeSubscriptionRecord, {
    tenantId,
    data: payloadData,
    statusOverride,
  });

  if (
    eventType === "invoice.payment_succeeded" &&
    (subscription.status === "active" || subscription.status === "trialing")
  ) {
    await ctx.scheduler.runAfter(0, internal.billing.sendOnboardingSuccessEmail, {
      tenantId,
      subscriptionId: subscription.id,
      invoiceId: invoice.id ?? null,
    });
  }
}

type WebhookResponse = {
  status: number;
  body: Record<string, unknown> | string;
  headers?: Record<string, string>;
};

function json(status: number, body: Record<string, unknown> | string): WebhookResponse {
  return {
    status,
    body,
    headers: { "Content-Type": "application/json" },
  };
}

export const handleStripeWebhook = internalAction({
  args: {
    rawBody: v.string(),
    signature: v.optional(v.string()),
  },
  handler: async (ctx, { rawBody, signature }): Promise<WebhookResponse> => {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      console.error("[stripeWebhook] STRIPE_WEBHOOK_SECRET is not configured");
      return json(500, { error: "Webhook secret not configured" });
    }

    if (!signature) {
      return json(400, { error: "Missing Stripe signature" });
    }

    const stripe = getStripeClient();

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(rawBody, signature, secret);
    } catch (error) {
      console.error("[stripeWebhook] Invalid signature", error);
      return json(400, { error: "Invalid signature" });
    }

    if (!RELEVANT_EVENTS.has(event.type)) {
      return json(200, { received: true });
    }

    try {
      switch (event.type) {
        case "checkout.session.completed":
          await handleCheckoutSessionCompleted(ctx, event.data.object as Stripe.Checkout.Session);
          break;
        case "customer.subscription.created":
        case "customer.subscription.updated":
        case "customer.subscription.deleted":
          await handleSubscriptionEvent(ctx, event.data.object as Stripe.Subscription);
          break;
        case "invoice.payment_succeeded":
        case "invoice.payment_failed":
          await handleInvoiceEvent(ctx, event.data.object as Stripe.Invoice, event.type);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error(`[stripeWebhook] Failed processing ${event.type}`, error);
      return json(500, { error: "Webhook handler error" });
    }

    return json(200, { received: true });
  },
});
