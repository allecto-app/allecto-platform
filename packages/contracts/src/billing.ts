export type BillingTierKey = "essencial" | "plus" | "pro";

export type BillingPlan = {
  tierKey: BillingTierKey;
  name: string;
  priceCents: number;
  currency: "BRL";
  interval: "month";
  features: string[];
  badge?: string;
};

export const BILLING_PLANS: BillingPlan[] = [
  {
    tierKey: "essencial",
    name: "Essencial",
    priceCents: 28900,
    currency: "BRL",
    interval: "month",
    features: ["2 assembleias/mês", "5 GB documentos", "Suporte e-mail (48h)"],
  },
  {
    tierKey: "plus",
    name: "Plus",
    priceCents: 74900,
    currency: "BRL",
    interval: "month",
    badge: "Mais Popular",
    features: [
      "Assembleias ilimitadas",
      "20 GB documentos",
      "Relatórios avançados",
      "Suporte 24h",
    ],
  },
  {
    tierKey: "pro",
    name: "Pro",
    priceCents: 109900,
    currency: "BRL",
    interval: "month",
    features: [
      "Assembleias/Enquetes ilimitadas",
      "200 GB documentos",
      "Auditoria e exportações",
      "Suporte prioritário (8h)",
    ],
  },
];

export const BILLING_PLAN_BY_TIER = new Map<BillingTierKey, BillingPlan>(
  BILLING_PLANS.map((plan) => [plan.tierKey, plan]),
);

export function formatPriceBRL(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}
