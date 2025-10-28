"use client";

import { useMemo, useState } from "react";
import { useAction } from "convex/react";
import { Billing } from "@allecto-app/contracts";
import { toast } from "sonner";
import { Loader2, CreditCard, ShieldAlert } from "lucide-react";
import { api, type Doc, type Id } from "../lib/convexGenerated";
import { useEntitlements } from "../hooks/useEntitlements";
import { PageHeader } from "../components/layout/PageHeader";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { PlanCard } from "../components/billing/PlanCard";

type BillingPageProps = {
  condo: Doc<"condos"> | null;
  sessionToken: string;
};

const STATUS_LABELS: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  active: { label: "Ativo", variant: "default" },
  trialing: { label: "Em Período de Teste", variant: "secondary" },
  past_due: { label: "Pagamento em Atraso", variant: "destructive" },
  unpaid: { label: "Pagamento Pendente", variant: "destructive" },
  incomplete: { label: "Pagamento Incompleto", variant: "outline" },
  incomplete_expired: { label: "Pagamento Expirado", variant: "outline" },
  canceled: { label: "Cancelado", variant: "outline" },
};

function formatDate(timestamp: number | null | undefined) {
  if (!timestamp) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(timestamp));
}

function getCheckoutUrls() {
  if (typeof window === "undefined") {
    return {
      successUrl: "https://admin.allecto.app/settings/billing?checkout=success",
      cancelUrl: "https://admin.allecto.app/settings/billing?checkout=cancel",
      returnUrl: "https://admin.allecto.app/settings/billing",
    };
  }
  const base = window.location.origin;
  return {
    successUrl: `${base}/settings/billing?checkout=success`,
    cancelUrl: `${base}/settings/billing?checkout=cancel`,
    returnUrl: `${base}/settings/billing`,
  };
}

export function BillingPage({ condo, sessionToken }: BillingPageProps) {
  const tenantId = condo?._id ?? null;
  const { data, isLoading, currentPlan } = useEntitlements(tenantId);
  const createCheckoutSession = useAction(api.billing.createCheckoutSession);
  const createPortalSession = useAction(api.billing.createPortalSession);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [redirectingTier, setRedirectingTier] = useState<Billing.BillingTierKey | null>(null);

  const statusBadge = useMemo(() => {
    if (!data?.subscription?.status) return null;
    const status = data.subscription.status;
    return STATUS_LABELS[status] ?? { label: status, variant: "outline" as const };
  }, [data?.subscription?.status]);

  const nextRenewal = formatDate(data?.subscription?.currentPeriodEnd ?? null);

  const handleCheckout = async (tierKey: Billing.BillingTierKey) => {
    if (!tenantId) return;
    const { successUrl, cancelUrl } = getCheckoutUrls();
    setRedirectingTier(tierKey);
    try {
      const response = await createCheckoutSession({
        tenantId: tenantId as Id<"condos">,
        tierKey,
        successUrl,
        cancelUrl,
        sessionToken,
      });
      if (response?.url) {
        setIsModalOpen(false);
        window.location.href = response.url;
      } else {
        toast.error("Não foi possível iniciar o checkout.");
      }
    } catch (error) {
      console.error("Failed to create checkout session", error);
      toast.error("Falha ao iniciar o checkout com a Stripe.");
    } finally {
      setRedirectingTier(null);
    }
  };

  const handlePortal = async () => {
    if (!tenantId) return;
    const { returnUrl } = getCheckoutUrls();
    setIsPortalLoading(true);
    try {
      const response = await createPortalSession({
        tenantId: tenantId as Id<"condos">,
        returnUrl,
        sessionToken,
      });
      if (response?.url) {
        window.location.href = response.url;
      } else {
        toast.error("Não foi possível abrir o portal de faturamento.");
      }
    } catch (error) {
      console.error("Failed to create portal session", error);
      toast.error("Falha ao abrir o portal de pagamento da Stripe.");
    } finally {
      setIsPortalLoading(false);
    }
  };

  if (!tenantId) {
    return (
      <div>
        <PageHeader title="Assinatura" description="Gerencie o plano do condomínio." />
        <Card className="mt-6 border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            Selecione um condomínio para visualizar o status de assinatura.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Carregando informações de faturamento...
      </div>
    );
  }

  const isTrial = data?.subscription?.status === "trialing";
  const isActive = data?.active ?? false;
  const inDunning = data?.inDunning ?? false;
  const planList = Billing.BILLING_PLANS;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assinatura"
        description="Gerencie o plano do condomínio, atualize a forma de pagamento e visualize o status da assinatura."
      />

      {inDunning && (
        <Alert variant="destructive" className="border-2 border-destructive/50">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Pagamento necessário</AlertTitle>
          <AlertDescription>
            Identificamos uma falha recente no pagamento. Atualize seus dados para evitar a suspensão
            do serviço.
          </AlertDescription>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handlePortal} disabled={isPortalLoading}>
              {isPortalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Atualizar pagamento"}
            </Button>
          </div>
        </Alert>
      )}

      <Card>
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Plano atual</p>
              <h2 className="text-2xl font-semibold text-foreground">{currentPlan?.name ?? "—"}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {currentPlan ? Billing.formatPriceBRL(currentPlan.priceCents) : "—"} / mês
              </p>
            </div>
            {statusBadge && (
              <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6 py-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground">Condomínio</p>
              <p className="text-base font-medium text-foreground">{condo?.name}</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground">Próxima renovação</p>
              <p className="text-base font-medium text-foreground">{nextRenewal}</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="text-base font-medium capitalize text-foreground">
                {statusBadge?.label ?? "Sem assinatura"}
              </p>
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-medium text-muted-foreground">Incluso no plano</p>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {(currentPlan?.features ?? []).map((feature) => (
                <div key={feature} className="flex items-center gap-2 rounded-md border border-border p-3">
                  <CreditCard className="h-4 w-4 text-secondary" />
                  <span className="text-sm text-muted-foreground">{feature}</span>
                </div>
              ))}
              {!currentPlan && (
                <div className="text-sm text-muted-foreground">Nenhum benefício disponível.</div>
              )}
            </div>
          </div>

  <div className="flex flex-wrap gap-3">
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button variant="default">Trocar de plano</Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Escolha um plano</DialogTitle>
                  <DialogDescription>
                    Selecionar um novo plano irá redirecionar você para o checkout seguro da Stripe.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 md:grid-cols-3">
                  {planList.map((plan) => (
                    <PlanCard
                      key={plan.tierKey}
                      plan={plan}
                      isCurrent={plan.tierKey === data?.tierKey}
                      isActive={isActive}
                      loading={redirectingTier === plan.tierKey}
                      onSelect={() => handleCheckout(plan.tierKey)}
                    />
                  ))}
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={handlePortal} disabled={isPortalLoading}>
              {isPortalLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redirecionando...
                </>
              ) : (
                "Gerenciar pagamento / Cancelamento"
              )}
            </Button>
            {isTrial && (
              <Badge variant="secondary" className="self-center">
                Você está em período de teste
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
