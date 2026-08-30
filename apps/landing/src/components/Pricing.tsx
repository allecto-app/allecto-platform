"use client";

import Link from "next/link";
import { Billing } from "@allecto-app/contracts";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Check } from "lucide-react";

type Offer = (typeof Billing.COMMERCIAL_OFFERS)[number];

function OfferCard({ offer, horizontal = false }: { offer: Offer; horizontal?: boolean }) {
  const salesLed = !offer.purchasable;
  const href = salesLed ? `/?offer=${offer.key}#contato` : `/onboarding?plan=${offer.key}`;
  return (
    <Card className={`relative border-2 ${offer.highlighted ? "border-primary shadow-xl" : "border-gray-200"}`}>
      {offer.badge && <Badge className="absolute -top-3 left-6 bg-secondary text-secondary-foreground">{offer.badge}</Badge>}
      <div className={horizontal ? "grid gap-4 md:grid-cols-[1fr_2fr_auto] md:items-center" : ""}>
        <CardHeader className="pt-8">
          <h3 className="text-2xl font-semibold text-gray-900">{offer.name}</h3>
          <p className="mt-2 text-sm text-gray-600">{offer.description}</p>
          <p className="mt-4 text-3xl font-bold text-gray-900">{offer.priceLabel}</p>
        </CardHeader>
        <CardContent className="pt-2 md:pt-6">
          <ul className={`grid gap-2 text-sm text-gray-700 ${horizontal ? "sm:grid-cols-2" : ""}`}>
            {offer.features.map((feature) => <li key={feature} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-secondary" /><span>{feature}</span></li>)}
          </ul>
        </CardContent>
        <CardContent className="pb-8 md:pt-8">
          <Button asChild size="lg" variant={offer.highlighted ? "default" : "outline"} className="w-full whitespace-nowrap">
            <Link href={href}>{offer.ctaLabel}</Link>
          </Button>
        </CardContent>
      </div>
    </Card>
  );
}

export function Pricing() {
  const offers = Billing.COMMERCIAL_OFFERS;
  const selfServiceOffers = offers.filter((offer) => offer.key !== "enterprise");
  const enterprise = offers.find((offer) => offer.key === "enterprise")!;

  return <section className="bg-gray-50 py-24" id="precos">
    <div className="mx-auto max-w-7xl space-y-14 px-4 sm:px-6 lg:px-8">
      <div className="text-center"><h2 className="text-3xl tracking-tight text-gray-900 md:text-4xl">Planos transparentes</h2><p className="mx-auto mt-4 max-w-2xl text-xl text-gray-600">Escolha entre uma assembleia avulsa, planos recorrentes ou uma solução personalizada.</p></div>
      <div><h3 className="mb-6 text-xl font-semibold text-gray-900">Escolha seu plano</h3><div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">{selfServiceOffers.map((offer) => <OfferCard key={offer.key} offer={offer} />)}</div></div>
      <div><h3 className="mb-6 text-xl font-semibold text-gray-900">Solução personalizada</h3><OfferCard offer={enterprise} horizontal /></div>
    </div>
  </section>;
}
