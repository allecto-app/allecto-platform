'use node';

import type Stripe from "stripe";
import { internalAction } from "../../_generated/server";
import { v } from "convex/values";
import type { Id } from "../../_generated/dataModel";
import { getStripeClient, upsertCustomerRecord } from "../../stripe/client";

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

async function findTenantIdByCustomer(ctx: any, customerId: string): Promise<Id<"condos"> | null> {
  const record = await ctx.db
    .query("stripeCustomers")
    .withIndex("byStripeCustomerId", (q: any) => q.eq("stripeCustomerId", customerId))
    .first();
  return record ? (record.tenantId as Id<"condos">) : null;
}

function extractPriceInfo(subscription: Stripe.Subscription) {
  const item = subscription.items?.data?.[0];
  const price = item?.price;
  const priceId = typeof price === "string" ? price : price?.id;
  let productId: string | undefined;
  if (price && typeof price !== "string") {
    productId = typeof price.product === "string" ? price.product : price.product?.id;
  }
  return { priceId, productId };
}

async function ensureTenantExists(ctx: any, tenantId: Id<"condos"> | null): Promise<Id<"condos"> | null> {
  if (!tenantId) {
    return null;
  }
  const tenant = await ctx.db.get(tenantId);
  return tenant ? tenantId : null;
}

type UpsertOptions = {
  latestInvoiceId?: string;
  latestInvoiceStatus?: string;
  statusOverride?: Stripe.Subscription.Status;
};

async function upsertSubscriptionRecord(
  ctx: any,
  tenantId: Id<"condos">,
  subscription: Stripe.Subscription,
  options?: UpsertOptions,
) {
  const { priceId, productId } = extractPriceInfo(subscription);
  const now = Date.now();
  const latestInvoiceFromSubscription =
    typeof subscription.latest_invoice === "string"
      ? subscription.latest_invoice
      : subscription.latest_invoice?.id;

  const latestInvoiceId = options?.latestInvoiceId ?? latestInvoiceFromSubscription;

  const record = {
    tenantId,
    stripeSubscriptionId: subscription.id,
    productId: productId ?? "",
    priceId: priceId ?? "",
    status: options?.statusOverride ?? subscription.status,
    currentPeriodStart: toMillis(subscription.current_period_start) ?? now,
    currentPeriodEnd: toMillis(subscription.current_period_end) ?? now,
    cancelAt: toMillis(subscription.cancel_at),
    cancelAtPeriodEnd: subscription.cancel_at_period_end ?? undefined,
    trialEnd: toMillis(subscription.trial_end),
    latestInvoiceId,
    latestInvoiceStatus: options?.latestInvoiceStatus ?? undefined,
    updatedAt: now,
  };

  const existing = await ctx.db
    .query("subscriptions")
    .withIndex("byStripeSubscriptionId", (q: any) => q.eq("stripeSubscriptionId", subscription.id))
    .first();

  if (existing) {
    await ctx.db.patch(existing._id, record);
    return;
  }

  await ctx.db.insert("subscriptions", record);
}

async function handleCheckoutSessionCompleted(ctx: any, session: Stripe.Checkout.Session) {
  const stripe = getStripeClient();
  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;

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
  tenantId = await ensureTenantExists(ctx, tenantId);

  if (!tenantId) {
    tenantId = await findTenantIdByCustomer(ctx, customerId);
  }

  if (!tenantId) {
    console.warn("[stripeWebhook] Unable to resolve tenant for checkout.session.completed");
    return;
  }

  await upsertCustomerRecord(
    ctx,
    tenantId,
    customerId,
    session.customer_details?.email ?? subscription.customer_email ?? null,
  );

  await upsertSubscriptionRecord(ctx, tenantId, subscription);
}

async function handleSubscriptionEvent(ctx: any, payload: Stripe.Subscription) {
  const customerId = typeof payload.customer === "string" ? payload.customer : payload.customer?.id;

  let tenantIdString = extractTenantId(payload.metadata);
  let tenantId: Id<"condos"> | null = tenantIdString ? (tenantIdString as Id<"condos">) : null;
  tenantId = await ensureTenantExists(ctx, tenantId);

  if (!tenantId && customerId) {
    tenantId = await findTenantIdByCustomer(ctx, customerId);
  }

  if (!tenantId || !customerId) {
    console.warn(`[stripeWebhook] Skipping subscription ${payload.id}: tenant not found`);
    return;
  }

  await upsertCustomerRecord(ctx, tenantId, customerId, payload.customer_email ?? null);
  await upsertSubscriptionRecord(ctx, tenantId, payload);
}

async function handleInvoiceEvent(ctx: any, invoice: Stripe.Invoice, eventType: string) {
  const subscriptionId =
    typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;

  if (!subscriptionId) {
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
  tenantId = await ensureTenantExists(ctx, tenantId);

  if (!tenantId && customerId) {
    tenantId = await findTenantIdByCustomer(ctx, customerId);
  }

  if (!tenantId || !customerId) {
    console.warn(`[stripeWebhook] Skipping invoice ${invoice.id}: tenant not found`);
    return;
  }

  await upsertCustomerRecord(ctx, tenantId, customerId, invoice.customer_email ?? null);

  const statusOverride =
    eventType === "invoice.payment_failed" ? ("past_due" as Stripe.Subscription.Status) : undefined;

  await upsertSubscriptionRecord(ctx, tenantId, subscription, {
    latestInvoiceId: invoice.id ?? undefined,
    latestInvoiceStatus: invoice.status ?? undefined,
    statusOverride,
  });
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
      event = stripe.webhooks.constructEvent(rawBody, signature, secret);
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
