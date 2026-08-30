/* eslint-disable no-console */
import Stripe from "stripe";

type TierKey = "avulso" | "essencial" | "gestao" | "administradora";

type PlanConfig = {
  tierKey: TierKey;
  name: string;
  unitAmount: number;
  features: string[];
  mode: "payment" | "subscription";
};

const PLANS: PlanConfig[] = [
  { tierKey: "avulso", name: "Allecto - Avulso", unitAmount: 24900, mode: "payment", features: ["1 assembleia de até 15 dias", "Até 100 unidades", "Suporte por e-mail"] },
  {
    tierKey: "essencial",
    name: "Allecto - Essencial",
    unitAmount: 14900,
    mode: "subscription",
    features: ["6 assembleias/ano", "5 GB documentos", "Suporte em até 1 dia útil"],
  },
  {
    tierKey: "gestao",
    name: "Allecto - Gestão",
    unitAmount: 29900,
    mode: "subscription",
    features: [
      "18 assembleias/ano",
      "20 GB documentos",
      "Relatórios avançados",
      "Suporte prioritário",
    ],
  },
  {
    tierKey: "administradora",
    name: "Allecto - Administradora",
    unitAmount: 69900,
    mode: "subscription",
    features: [
      "60 assembleias/ano",
      "100 GB documentos",
      "Painel multicondomínio",
      "Suporte prioritário",
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
    const found = page.data.find(
      (product) => product.metadata?.tierKey === tierKey
    );
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
  mode: PlanConfig["mode"],
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
        (mode === "payment" ? !price.recurring : price.recurring?.interval === "month")
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
  plan: PlanConfig
) {
  const existing = await findActivePrice(stripe, productId, plan.unitAmount, plan.mode);
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
    ...(plan.mode === "subscription" ? { recurring: { interval: "month" as const } } : {}),
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
    avulso: "",
    essencial: "",
    gestao: "",
    administradora: "",
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
  console.log(`PRICE_ID_AVULSO_ONE_TIME=${priceEnvLines.avulso}`);
  console.log(`PRICE_ID_ESSENCIAL_MONTHLY=${priceEnvLines.essencial}`);
  console.log(`PRICE_ID_GESTAO_MONTHLY=${priceEnvLines.gestao}`);
  console.log(`PRICE_ID_ADMINISTRADORA_MONTHLY=${priceEnvLines.administradora}`);
}

main().catch((error) => {
  console.error("Failed to seed Stripe plans");
  console.error(error);
  process.exitCode = 1;
});
