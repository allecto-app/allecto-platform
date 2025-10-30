import { Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { EmptyState } from "../components/admin/EmptyState";
import { PageHeader } from "../components/layout/PageHeader";
import type { Id } from "../lib/convexGenerated";

type ResidentUnitLink = {
  unitId: Id<"units">;
  code: string;
  block: string | null;
  role: string | null;
};

const ROLE_LABELS: Record<string, string> = {
  owner: "Proprietário",
  tenant: "Inquilino",
};

interface ResidentUnitPageProps {
  units: ResidentUnitLink[];
}

export function ResidentUnitPage({ units }: ResidentUnitPageProps) {
  if (units.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Minhas Unidades"
          breadcrumb={["Minha Conta", "Unidades"]}
          description="Você ainda não possui unidades vinculadas a este acesso."
        />
        <EmptyState
          icon={Building2}
          title="Nenhuma unidade vinculada"
          description="Entre em contato com a administração do condomínio para atualizar suas informações."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Minhas Unidades"
        breadcrumb={["Minha Conta", "Unidades"]}
        description="Visualize as unidades vinculadas ao seu cadastro."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {units.map((unit) => (
          <Card key={unit.unitId as string} className="border border-border/60">
            <CardHeader>
              <CardTitle>{unit.code}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div>
                Bloco: <span className="text-foreground">{unit.block ?? "Não informado"}</span>
              </div>
              <div>
                Papel:{" "}
                <Badge variant="outline">
                  {ROLE_LABELS[unit.role ?? ""] ?? "Morador"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
