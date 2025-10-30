import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { PageHeader } from "../components/layout/PageHeader";
import type { ResidentRecord } from "../types/resident";

const ROLE_LABELS: Record<string, string> = {
  resident: "Morador",
  syndic: "Síndico",
  manager: "Gestor",
  council: "Conselho",
};

interface ResidentProfilePageProps {
  resident: ResidentRecord | null;
}

const formatDateTime = (timestamp: number | null | undefined) =>
  typeof timestamp === "number"
    ? new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(timestamp))
    : "-";

export function ResidentProfilePage({ resident }: ResidentProfilePageProps) {
  const roleLabel = resident ? ROLE_LABELS[resident.role] ?? resident.role : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meu Perfil"
        breadcrumb={["Minha Conta", "Perfil"]}
        description="Atualize seus dados junto à administração do condomínio, caso necessário."
      />
      <Card>
        <CardHeader>
          <CardTitle>Informações pessoais</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Info label="Nome" value={resident?.name ?? "-"} />
          <Info label="Email" value={resident?.email ?? "-"} />
          <Info label="Telefone" value={resident?.phone ?? "-"} />
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Função</div>
            <Badge variant="outline">{roleLabel ?? "Morador"}</Badge>
          </div>
          <Info label="Criado em" value={formatDateTime(resident?.createdAt ?? null)} />
          <Info label="Atualizado em" value={formatDateTime(resident?.updatedAt ?? null)} />
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-sm text-foreground">{value}</div>
    </div>
  );
}
