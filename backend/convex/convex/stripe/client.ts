'use node';

import Stripe from "stripe";
import type { ActionCtx } from "convex/server";
import type { Id } from "../_generated/dataModel";

type StripeCustomerRecord = {
  _id: Id<"stripeCustomers">;
  stripeCustomerId: string;
  email: string;
};

type GenericActionCtx = ActionCtx<any>;

let stripeClient: Stripe | null = null;

function getStripeSecret(): string {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return secret;
}

export function getStripeClient(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(getStripeSecret(), {
      apiVersion: "2023-10-16",
    });
  }
  return stripeClient;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function updateStripeCustomerEmail(stripe: Stripe, customerId: string, email: string) {
  try {
    await stripe.customers.update(customerId, { email });
  } catch (error) {
    console.error(`[stripe] Failed to update customer email (${customerId})`, error);
  }
}

async function findExistingCustomer(
  ctx: GenericActionCtx,
  tenantId: Id<"condos">,
  email: string,
): Promise<StripeCustomerRecord | null> {
  const byEmail = await ctx.db
    .query("stripeCustomers")
    .withIndex("byEmail", (q: any) => q.eq("email", email))
    .first();
  if (byEmail) {
    return byEmail as StripeCustomerRecord;
  }

  const byTenant = await ctx.db
    .query("stripeCustomers")
    .withIndex("byTenant", (q: any) => q.eq("tenantId", tenantId))
    .first();
  if (byTenant) {
    return byTenant as StripeCustomerRecord;
  }

  return null;
}

export async function getOrCreateCustomer(
  ctx: GenericActionCtx,
  tenantId: Id<"condos">,
  email: string,
): Promise<string> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new Error("Customer email is required");
  }

  const existing = await findExistingCustomer(ctx, tenantId, normalizedEmail);
  const stripe = getStripeClient();
  const now = Date.now();

  if (existing) {
    if (existing.email !== normalizedEmail) {
      await updateStripeCustomerEmail(stripe, existing.stripeCustomerId, normalizedEmail);
      await ctx.db.patch(existing._id, {
        email: normalizedEmail,
        updatedAt: now,
      });
    } else {
      await ctx.db.patch(existing._id, {
        updatedAt: now,
      });
    }
    return existing.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email: normalizedEmail,
    metadata: {
      tenantId: tenantId.toString(),
    },
  });

  await ctx.db.insert("stripeCustomers", {
    tenantId,
    stripeCustomerId: customer.id,
    email: normalizedEmail,
    createdAt: now,
    updatedAt: now,
  });

  return customer.id;
}

export async function upsertCustomerRecord(
  ctx: GenericActionCtx,
  tenantId: Id<"condos">,
  stripeCustomerId: string,
  email?: string | null,
) {
  const normalizedEmail = email ? normalizeEmail(email) : undefined;
  const existing = await ctx.db
    .query("stripeCustomers")
    .withIndex("byStripeCustomerId", (q: any) => q.eq("stripeCustomerId", stripeCustomerId))
    .first();
  const now = Date.now();

  if (existing) {
    await ctx.db.patch(existing._id, {
      tenantId,
      email: normalizedEmail ?? existing.email,
      updatedAt: now,
    });
    return;
  }

  await ctx.db.insert("stripeCustomers", {
    tenantId,
    stripeCustomerId,
    email: normalizedEmail ?? "",
    createdAt: now,
    updatedAt: now,
  });
}
