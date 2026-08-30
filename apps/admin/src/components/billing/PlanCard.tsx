import { Billing } from "@allecto-app/contracts";
import { Check, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";

type PlanCardProps = {
  plan: Billing.BillingPlan;
  isCurrent?: boolean;
  isActive?: boolean;
  loading?: boolean;
  onSelect?: () => void;
};

export function PlanCard({ plan, isCurrent, isActive, loading, onSelect }: PlanCardProps) {
  const priceLabel = plan.priceLabel;
  const actionLabel = isCurrent
    ? "Plano atual"
    : !plan.purchasable
      ? "Falar com vendas"
      : plan.billingType === "one_time"
        ? plan.ctaLabel
        : isActive
          ? "Mudar para este plano"
          : plan.ctaLabel;

  return (
    <Card
      className={cn(
        "relative border-2 transition-all duration-300",
        plan.badge ? "border-primary/70 shadow-lg" : "border-border",
        isCurrent && "border-primary shadow-xl ring-2 ring-primary/30",
      )}
    >
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-secondary text-secondary-foreground px-3 py-1 shadow">
            {plan.badge}
          </Badge>
        </div>
      )}

      <CardHeader className="pb-4 pt-6 text-center">
        <CardTitle className="text-2xl font-semibold text-foreground">{plan.name}</CardTitle>
        <div className="mt-4 flex flex-col items-center gap-1">
          <span className="text-4xl font-bold text-foreground">{priceLabel}</span>
          <span className="text-sm text-muted-foreground">{plan.billingType === "one_time" ? "pagamento único" : "plano mensal"}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pb-6">
        <ul className="space-y-3 text-left">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 text-secondary" />
              <span className="text-sm text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>

        <Button
          className="w-full"
          variant={isCurrent ? "secondary" : "default"}
          disabled={isCurrent || loading}
          onClick={() => !isCurrent && !loading && onSelect?.()}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : actionLabel}
        </Button>
      </CardContent>
    </Card>
  );
}
