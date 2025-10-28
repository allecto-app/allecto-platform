import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";

export const stripeWebhook = httpAction(async (ctx, request) => {
  const signature = request.headers.get("stripe-signature") ?? undefined;
  const rawBody = await request.text();

  const result = await ctx.runAction(internal.billing.handleStripeWebhook, {
    rawBody,
    signature,
  });

  const body =
    typeof result.body === "string" ? result.body : JSON.stringify(result.body);

  return new Response(body, {
    status: result.status,
    headers: {
      "Content-Type": "application/json",
      ...result.headers,
    },
  });
});
