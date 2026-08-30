"use client";

import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Billing } from "@allecto-app/contracts";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Check, Loader2 } from "lucide-react";
import { Header } from "../Header";
import Link from "next/link";
import { Footer } from "../Footer";
import { CookieConsentBanner } from "../CookieConsentBanner";

type TierKey = Billing.BillingTierKey;

const PUBLIC_TIER_MAP: Record<TierKey, string> = {
  avulso: "avulso",
  essencial: "essencial",
  gestao: "gestao",
  administradora: "administradora",
};

type PlanOption = {
  tierKey: TierKey;
  name: string;
  priceCents: number;
  priceLabel?: string;
  billingType?: "one_time" | "subscription" | "custom";
  features: string[];
  badge?: string;
};

const FALLBACK_PLANS: PlanOption[] = [];

function formatPriceBRL(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_TIER: "Plano selecionado inválido.",
  INVALID_NAME: "Informe o nome do condomínio.",
  INVALID_SUBDOMAIN: "Subdomínio inválido. Use letras, números e hífen.",
  SUBDOMAIN_TAKEN: "Este subdomínio já está em uso.",
  ADMIN_NAME_REQUIRED: "Informe o nome do administrador.",
  ADMIN_EMAIL_REQUIRED: "Informe um email válido.",
  signup_failed: "Não foi possível iniciar a assinatura. Tente novamente.",
  checkout_failed: "Não foi possível iniciar o pagamento. Tente novamente.",
  missing_checkout_url: "Checkout indisponível no momento. Tente novamente.",
  ONBOARDING_TOKEN_EXPIRED:
    "O link de pagamento expirou. Gere uma nova assinatura.",
  INVALID_ONBOARDING_TOKEN: "O link de pagamento não é válido.",
  ONBOARDING_TIER_MISMATCH: "Reinicie a assinatura para este plano.",
};

type SignupFormState = {
  condoName: string;
  subdomain: string;
  adminName: string;
  adminEmail: string;
  adminPhone: string;
};

const INITIAL_FORM: SignupFormState = {
  condoName: "",
  subdomain: "",
  adminName: "",
  adminEmail: "",
  adminPhone: "",
};

export function SignupFlow() {
  const searchParams = useSearchParams();
  const plans = useMemo<PlanOption[]>(() => {
    const fromContracts = Billing?.BILLING_PLANS.filter((plan) => plan.purchasable);
    if (Array.isArray(fromContracts) && fromContracts.length > 0) {
      return fromContracts.map((plan) => ({
        tierKey: plan.tierKey as TierKey,
        name: plan.name,
        priceCents: plan.priceInCents ?? 0,
        priceLabel: plan.priceLabel,
        billingType: plan.billingType,
        features: [...plan.features],
        badge: plan.badge,
      }));
    }
    return FALLBACK_PLANS;
  }, []);

  const initialPlanParam = searchParams.get("plan") ?? "";
  const normalizedPlanParam = initialPlanParam.toLowerCase();
  const preselectedPlan = plans.find(
    (plan) => PUBLIC_TIER_MAP[plan.tierKey] === normalizedPlanParam
  );

  const [selectedPlan, setSelectedPlan] = useState<PlanOption | null>(
    preselectedPlan ?? null
  );
  const [form, setForm] = useState<SignupFormState>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const priceFormatter = Billing?.formatPriceBRL ?? formatPriceBRL;

  const handleSelectPlan = (plan: PlanOption) => {
    setSelectedPlan(plan);
    setError(null);
  };

  const handleChange =
    (field: keyof SignupFormState) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedPlan) {
      setError("Selecione um plano antes de continuar.");
      return;
    }
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        tierKey: selectedPlan.tierKey,
        condoName: form.condoName,
        subdomain: form.subdomain,
        adminName: form.adminName,
        adminEmail: form.adminEmail,
        adminPhone: form.adminPhone,
      };

      const signupResponse = await fetch("/api/onboarding/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!signupResponse.ok) {
        const data = await signupResponse
          .json()
          .catch(() => ({ error: "signup_failed" }));
        throw new Error(data.error ?? "signup_failed");
      }

      const signupData = await signupResponse.json();
      const { tenantId, onboardingToken } = signupData as {
        tenantId: string;
        onboardingToken: string;
      };

      const checkoutResponse = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          tierKey: PUBLIC_TIER_MAP[selectedPlan.tierKey],
          onboardingToken,
        }),
      });

      if (!checkoutResponse.ok) {
        const data = await checkoutResponse
          .json()
          .catch(() => ({ error: "checkout_failed" }));
        throw new Error(data.error ?? "checkout_failed");
      }

      const checkoutData = await checkoutResponse.json();
      const url = checkoutData?.url as string | undefined;
      if (url) {
        window.location.href = url;
        return;
      }
      throw new Error("missing_checkout_url");
    } catch (submissionError) {
      console.error("[landing.onboarding]", submissionError);
      const code = (submissionError as Error).message ?? "signup_failed";
      setError(ERROR_MESSAGES[code] ?? ERROR_MESSAGES.signup_failed);
      setIsSubmitting(false);
    }
  };

  const selectedPlanSummary = selectedPlan ?? plans[0];
  const planPrice = selectedPlanSummary.priceLabel ?? priceFormatter(selectedPlanSummary.priceCents);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-accent to-primary font-inter">
      <Header />
      <div className="mx-auto grid max-w-5xl my-8">
        <h1 className="text-3xl font-semibold text-white text-center mb-4">
          Escolha o plano ideal para o seu condomínio!
        </h1>
        <p className="text-lg text-white text-center max-w-3xl mx-auto">
          Informe os dados básicos do seu condomínio e conclua a assinatura em
          minutos.
          <br />O acesso ao painel é liberado automaticamente após a conclusão
          da assinatura.
        </p>
      </div>
      <div className="mx-auto grid max-w-5xl gap-10 px-4 pb-20 lg:grid-cols-[2fr_3fr] lg:px-8">
        <div className="space-y-6">
          <div className="space-y-4">
            {plans.map((plan) => {
              const price = priceFormatter(plan.priceCents);
              const isActive = selectedPlan?.tierKey === plan.tierKey;

              return (
                <Card
                  key={plan.tierKey}
                  className={`border-2 transition-all ${
                    isActive
                      ? "border-primary shadow-lg"
                      : "border-muted hover:border-primary/40"
                  }`}
                >
                  <CardHeader className="flex flex-row items-center justify-between gap-4 pt-6">
                    <div>
                      <h3 className="text-2xl font-semibold text-gray-900">
                        {plan.name}
                      </h3>
                      <p className="text-sm text-gray-500">{plan.priceLabel ?? price}</p>
                    </div>
                    <Button
                      variant={isActive ? "default" : "outline"}
                      onClick={() => handleSelectPlan(plan)}
                    >
                      {isActive ? "Selecionado" : "Selecionar plano"}
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3 pb-6">
                    <ul className="space-y-2 text-sm text-gray-600">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-secondary" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    {plan.badge && (
                      <Badge className="bg-secondary px-3 py-1 text-secondary-foreground">
                        {plan.badge}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <div>
          <Card className="border-2 border-primary/20">
            <CardHeader className="pb-4 pt-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Detalhes do condomínio
              </h2>
              <p className="text-sm text-gray-600">
                {selectedPlan
                  ? `Plano selecionado: ${selectedPlan.name} (${planPrice})`
                  : "Selecione um plano para continuar"}
              </p>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <Label htmlFor="condoName">Nome do condomínio</Label>
                  <Input
                    id="condoName"
                    required
                    placeholder="Condomínio Residencial Horizonte"
                    value={form.condoName}
                    onChange={handleChange("condoName")}
                  />
                </div>
                <div>
                  <Label htmlFor="subdomain">Subdomínio desejado</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="subdomain"
                      required
                      placeholder="horizonte"
                      value={form.subdomain}
                      onChange={handleChange("subdomain")}
                    />
                    <span className="text-sm text-gray-500">.allecto.app</span>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="adminName">Seu nome</Label>
                    <Input
                      id="adminName"
                      required
                      placeholder="Maria Oliveira"
                      value={form.adminName}
                      onChange={handleChange("adminName")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="adminPhone">Telefone (opcional)</Label>
                    <Input
                      id="adminPhone"
                      placeholder="(11) 99999-0000"
                      value={form.adminPhone}
                      onChange={handleChange("adminPhone")}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="adminEmail">Email do administrador</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    required
                    placeholder="administrador@condominio.com.br"
                    value={form.adminEmail}
                    onChange={handleChange("adminEmail")}
                  />
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <Button
                  type="submit"
                  className="w-full hover:text-secondary"
                  disabled={isSubmitting || !selectedPlan}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />{" "}
                      Processando...
                    </span>
                  ) : (
                    `Continuar para pagamento (${planPrice})`
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
          <Button
            className="w-full mt-4 bg-transparent text-white border border-white hover:text-secondary"
            variant={"outline"}
          >
            <Link href="/#precos" className="block w-full h-full">
              Voltar ao site
            </Link>
          </Button>
        </div>
      </div>
      <Footer />
      <CookieConsentBanner />
    </div>
  );
}
