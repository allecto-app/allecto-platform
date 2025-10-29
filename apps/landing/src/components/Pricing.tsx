'use client';

import { useMemo } from "react";
import Link from "next/link";
import { Billing } from "@allecto-app/contracts";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Check } from "lucide-react";

type TierKey = "essencial" | "plus" | "pro";

const PUBLIC_TIER_MAP: Record<TierKey, string> = {
  essencial: "start",
  plus: "plus",
  pro: "pro",
};

const FALLBACK_PLANS = [
  {
    tierKey: "essencial" as TierKey,
    name: "Essencial",
    priceCents: 28900,
    features: ["Até 99 unidades", "2 assembleias/mês", "5 GB documentos", "Suporte e-mail (48h)"],
  },
  {
    tierKey: "plus" as TierKey,
    name: "Plus",
    priceCents: 74900,
    badge: "Mais Popular",
    features: [
      "Entre 100 e 300 unidades",
      "Assembleias ilimitadas",
      "20 GB documentos",
      "Relatórios avançados",
      "Suporte 24h",
    ],
  },
  {
    tierKey: "pro" as TierKey,
    name: "Pro",
    priceCents: 109900,
    features: [
      "Para + de 300 unidades",
      "Assembleias ilimitadas",
      "200 GB documentos",
      "Auditoria e exportações",
      "Suporte prioritário (8h)",
    ],
  },
] as const;

function formatPriceBRL(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export function Pricing() {
  const plans = useMemo(() => {
    if (Billing?.BILLING_PLANS?.length) {
      return Billing.BILLING_PLANS as typeof FALLBACK_PLANS;
    }
    return FALLBACK_PLANS;
  }, []);

  const priceFormatter = Billing?.formatPriceBRL ?? formatPriceBRL;

  return (
    <section className="bg-gray-50 py-24" id="precos">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl tracking-tight text-gray-900 md:text-4xl">
            Planos transparentes
          </h2>
          <p className="mx-auto max-w-2xl text-xl text-gray-600">
            Escolha o plano ideal para o tamanho do seu condomínio
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {plans.map((plan) => {
            const price = priceFormatter(plan.priceCents);
            const checkoutTier = PUBLIC_TIER_MAP[plan.tierKey];
            const onboardingHref = `/onboarding?plan=${checkoutTier}`;

            return (
              <Card
                key={plan.tierKey}
                className={`relative border-2 transition-all duration-300 ${
                  plan.badge ? "border-primary shadow-2xl" : "border-gray-200 hover:border-primary/40"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-secondary px-4 py-1 text-secondary-foreground shadow">
                      {plan.badge}
                    </Badge>
                  </div>
                )}
                <CardHeader className="pt-10 text-center">
                  <h3 className="text-2xl font-semibold text-gray-900">{plan.name}</h3>
                  <div className="mt-4 space-y-1">
                    <div className="text-4xl font-bold text-gray-900">{price}</div>
                    <div className="text-sm text-gray-500">por mês</div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pb-10">
                  <ul className="space-y-3 text-left">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-gray-700">
                        <Check className="mt-1 h-5 w-5 flex-shrink-0 text-secondary" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${
                      plan.badge
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-secondary"
                        : "bg-white text-gray-900 hover:bg-gray-50 hover:text-secondary"
                    }`}
                    variant={plan.badge ? "default" : "outline"}
                    size="lg"
                    asChild
                  >
                    <Link href={onboardingHref}>Assinar agora</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
