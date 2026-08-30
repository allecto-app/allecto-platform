export type BillingTierKey =
  | "avulso"
  | "essencial"
  | "gestao"
  | "administradora";
export type LegacyBillingTierKey = "plus" | "pro";
export type PersistedBillingTierKey = BillingTierKey | LegacyBillingTierKey;
export type CommercialOfferKey = BillingTierKey | "enterprise";

export const LEGACY_TIER_ALIASES: Record<LegacyBillingTierKey, BillingTierKey> =
  {
    plus: "gestao",
    pro: "administradora",
  };

export interface PlanLimits {
  condominiums: number | null;
  units: number | null;
  assembliesPerYear: number | null;
  storageGb: number | null;
  assemblyDurationDays?: number | null;
}

export interface BillingPlan {
  key: CommercialOfferKey;
  tierKey: CommercialOfferKey;
  name: string;
  description: string;
  priceInCents: number | null;
  /** @deprecated Use priceInCents for calculations. */
  priceCents: number | null;
  priceLabel: string;
  currency: "BRL";
  billingType: "one_time" | "subscription" | "custom";
  billingPeriod?: "assembly" | "month";
  limits: PlanLimits;
  features: string[];
  ctaLabel: string;
  badge?: string;
  highlighted?: boolean;
  purchasable: boolean;
}

const offer = (
  plan: Omit<BillingPlan, "tierKey" | "priceCents" | "currency">,
): BillingPlan => ({
  ...plan,
  tierKey: plan.key,
  priceCents: plan.priceInCents,
  currency: "BRL",
});

export const COMMERCIAL_OFFERS: BillingPlan[] = [
  offer({
    key: "avulso",
    name: "Avulso",
    description:
      "Uma assembleia completa, sem assinatura, para condomínios com até 100 unidades.",
    priceInCents: 24900,
    priceLabel: "R$ 249 por assembleia",
    billingType: "one_time",
    billingPeriod: "assembly",
    limits: {
      condominiums: 1,
      units: 100,
      assembliesPerYear: 1,
      storageGb: null,
      assemblyDurationDays: 15,
    },
    features: [
      "Até 100 unidades",
      "1 assembleia com duração de até 15 dias",
      "Pautas e votações ilimitadas",
      "Convites por e-mail e documentos",
      "Controle de quórum e ata automática",
      "Relatório de participação",
      "Suporte por e-mail",
    ],
    ctaLabel: "Contratar assembleia",
    badge: "Sem assinatura",
    purchasable: true,
  }),
  offer({
    key: "essencial",
    name: "Essencial",
    description:
      "O essencial para realizar assembleias digitais com previsibilidade.",
    priceInCents: 14900,
    priceLabel: "R$ 149/mês",
    billingType: "subscription",
    billingPeriod: "month",
    limits: { condominiums: 1, units: 100, assembliesPerYear: 6, storageGb: 5 },
    features: [
      "1 condomínio e até 100 unidades",
      "6 assembleias por ano",
      "Enquetes ilimitadas",
      "5 GB para documentos",
      "Convites e lembretes automáticos",
      "Quórum, atas e relatórios em PDF",
      "Auditoria padrão",
      "Suporte em até 1 dia útil",
    ],
    ctaLabel: "Assinar plano",
    purchasable: true,
  }),
  offer({
    key: "gestao",
    name: "Gestão",
    description:
      "Recursos avançados para condomínios com operações mais complexas.",
    priceInCents: 29900,
    priceLabel: "R$ 299/mês",
    billingType: "subscription",
    billingPeriod: "month",
    limits: {
      condominiums: 1,
      units: 300,
      assembliesPerYear: 18,
      storageGb: 20,
    },
    features: [
      "1 condomínio e até 300 unidades",
      "18 assembleias por ano",
      "Enquetes ilimitadas",
      "20 GB para documentos",
      "Votação por fração ideal",
      "Procurações e elegibilidade",
      "Assembleias híbridas e sessão permanente",
      "Relatórios avançados e exportações",
      "Suporte prioritário",
    ],
    ctaLabel: "Assinar plano",
    badge: "Mais popular",
    highlighted: true,
    purchasable: true,
  }),
  offer({
    key: "administradora",
    name: "Administradora",
    description: "Gestão centralizada para carteiras de condomínios e equipes.",
    priceInCents: 69900,
    priceLabel: "R$ 699/mês",
    billingType: "subscription",
    billingPeriod: "month",
    limits: {
      condominiums: 5,
      units: 1000,
      assembliesPerYear: 60,
      storageGb: 100,
    },
    features: [
      "Até 5 condomínios e 1.000 unidades",
      "60 assembleias por ano",
      "100 GB para documentos",
      "Painel multicondomínio",
      "Usuários e permissões por equipe",
      "Modelos e importação em massa",
      "Relatórios consolidados",
      "Identidade visual da administradora",
      "Suporte prioritário",
    ],
    ctaLabel: "Assinar plano",
    purchasable: true,
  }),
  offer({
    key: "enterprise",
    name: "Enterprise",
    description:
      "Solução personalizada para operações com requisitos de escala, integração e suporte dedicado.",
    priceInCents: null,
    priceLabel: "",
    billingType: "custom",
    limits: {
      condominiums: null,
      units: null,
      assembliesPerYear: null,
      storageGb: null,
    },
    features: [
      "Condomínios, unidades e assembleias sob medida",
      "Armazenamento personalizado",
      "API, webhooks e SSO",
      "White-label e integrações",
      "Migração de dados e relatórios personalizados",
      "SLA e gerente de conta dedicados",
      "Suporte durante assembleias",
    ],
    ctaLabel: "Falar com vendas",
    purchasable: false,
  }),
];

export const BILLING_PLANS = COMMERCIAL_OFFERS.filter(
  (
    plan,
  ): plan is BillingPlan & { key: BillingTierKey; tierKey: BillingTierKey } =>
    plan.key !== "enterprise",
);
export const BILLING_PLAN_BY_TIER = new Map(
  BILLING_PLANS.map((plan) => [plan.key, plan] as const),
);

export function normalizeBillingTierKey(
  value: string | null | undefined,
): BillingTierKey | null {
  if (!value) return null;
  const normalized = value.toLowerCase().trim() as PersistedBillingTierKey;
  if (normalized === "plus" || normalized === "pro")
    return LEGACY_TIER_ALIASES[normalized];
  return BILLING_PLAN_BY_TIER.has(normalized as BillingTierKey)
    ? (normalized as BillingTierKey)
    : null;
}

export function formatPriceBRL(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}
