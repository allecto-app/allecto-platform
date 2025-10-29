"use node";

import Stripe from "stripe";
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
      apiVersion: "2024-06-20",
    });
  }
  return stripeClient;
}
