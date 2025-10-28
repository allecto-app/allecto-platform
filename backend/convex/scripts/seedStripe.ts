/* eslint-disable no-console */
import Stripe from "stripe";

type TierKey = "essencial" | "plus" | "pro";

type PlanConfig = {
  tierKey: TierKey;
  name: string;
  unitAmount: number;
  features: string[];
};

const PLANS: PlanConfig[] = [
  {
    tierKey: "essencial",
    name: "Allecto - Essencial",
    unitAmount: 28900,
    features: ["2 assembleias/mês", "5 GB documentos", "Suporte e-mail (48h)"],
  },
  {
    tierKey: "plus",
    name: "Allecto - Plus",
    unitAmount: 74900,
    features: ["Assembleias ilimitadas", "20 GB documentos", "Relatórios avançados", "Suporte 24h"],
  },
  {
    tierKey: "pro",
    name: "Allecto - Pro",
    unitAmount: 109900,
    features: [
      "Assembleias/Enquetes ilimitadas",
      "200 GB documentos",
      "Auditoria e exportações",
      "Suporte prioritário (8h)",
    ],
  },
];

function assertEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function formatDescription(features: string[]): string {
  return features.join(" • ");
}

async function findProductByTier(stripe: Stripe, tierKey: TierKey) {
  let startingAfter: string | undefined;
  while (true) {
    const page = await stripe.products.list({
      limit: 100,
      starting_after: startingAfter,
      active: undefined,
    });
    const found = page.data.find((product) => product.metadata?.tierKey === tierKey);
    if (found) {
      return found;
    }
    if (!page.has_more) {
      return null;
    }
    startingAfter = page.data[page.data.length - 1]?.id;
  }
}

async function ensureProduct(stripe: Stripe, plan: PlanConfig) {
  const description = formatDescription(plan.features);
  const metadata = { tierKey: plan.tierKey };

  const existing = await findProductByTier(stripe, plan.tierKey);
  if (existing) {
    const needsUpdate =
      existing.name !== plan.name ||
      existing.description !== description ||
      existing.metadata?.tierKey !== plan.tierKey ||
      existing.active === false;

    if (needsUpdate) {
      await stripe.products.update(existing.id, {
        name: plan.name,
        description,
        active: true,
        metadata,
      });
    }
    return { id: existing.id, description };
  }

  const created = await stripe.products.create({
    name: plan.name,
    description,
    active: true,
    metadata,
  });

  return { id: created.id, description };
}

async function findActivePrice(
  stripe: Stripe,
  productId: string,
  unitAmount: number,
) {
  let startingAfter: string | undefined;
  while (true) {
    const page = await stripe.prices.list({
      product: productId,
      limit: 100,
      starting_after: startingAfter,
    });
    const match = page.data.find((price) => {
      return (
        price.active === true &&
        price.currency === "brl" &&
        price.unit_amount === unitAmount &&
        price.recurring?.interval === "month"
      );
    });
    if (match) {
      return match;
    }
    if (!page.has_more) {
      return null;
    }
    startingAfter = page.data[page.data.length - 1]?.id;
  }
}

async function ensurePrice(
  stripe: Stripe,
  productId: string,
  plan: PlanConfig,
) {
  const existing = await findActivePrice(stripe, productId, plan.unitAmount);
  if (existing) {
    if (existing.metadata?.tierKey !== plan.tierKey) {
      await stripe.prices.update(existing.id, {
        metadata: { tierKey: plan.tierKey },
      });
    }
    return existing.id;
  }

  const created = await stripe.prices.create({
    product: productId,
    currency: "brl",
    unit_amount: plan.unitAmount,
    recurring: { interval: "month" },
    tax_behavior: "unspecified",
    metadata: { tierKey: plan.tierKey },
  });
  return created.id;
}

async function main() {
  const secretKey = assertEnv("STRIPE_SECRET_KEY");
  const stripe = new Stripe(secretKey, {
    apiVersion: "2023-10-16",
  });

  const priceEnvLines: Record<TierKey, string> = {
    essencial: "",
    plus: "",
    pro: "",
  };

  for (const plan of PLANS) {
    console.log(`\n>>> Ensuring plan "${plan.name}" (${plan.tierKey})`);
    const product = await ensureProduct(stripe, plan);
    console.log(`    • Product ID: ${product.id}`);
    const priceId = await ensurePrice(stripe, product.id, plan);
    console.log(`    • Price ID: ${priceId}`);
    priceEnvLines[plan.tierKey] = priceId;
  }

  console.log("\nSet the following environment variables:");
  console.log(`PRICE_ID_ESSENCIAL_MONTHLY=${priceEnvLines.essencial}`);
  console.log(`PRICE_ID_PLUS_MONTHLY=${priceEnvLines.plus}`);
  console.log(`PRICE_ID_PRO_MONTHLY=${priceEnvLines.pro}`);
}

main().catch((error) => {
  console.error("Failed to seed Stripe plans");
  console.error(error);
  process.exitCode = 1;
});
