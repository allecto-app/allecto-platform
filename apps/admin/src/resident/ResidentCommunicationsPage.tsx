import { useQuery } from "convex/react";
import { FileText, Loader2 } from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { EmptyState } from "../components/admin/EmptyState";
import { Badge } from "../components/ui/badge";
import { ViewPdfButton } from "../components/documents/ViewPdfButton";
import { api, type Doc, type Id } from "../lib/convexGenerated";

interface ResidentCommunicationsPageProps {
  condoId: Id<"condos">;
  sessionToken: string;
}

const formatDateTime = (timestamp: number) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(timestamp));

export function ResidentCommunicationsPage({ condoId, sessionToken }: ResidentCommunicationsPageProps) {
  const communications = useQuery(api.communications.listForResident, {
    token: sessionToken,
    condoId,
    limit: 200,
  }) as Doc<"residentCommunications">[] | undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comunicados"
        breadcrumb={["Minha Conta", "Comunicados"]}
        description="Acompanhe avisos e documentos compartilhados pela administração do condomínio."
      />

      <Card>
        <CardHeader>
          <CardTitle>Histórico de comunicados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {communications === undefined ? (
            <div className="text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando comunicados...
            </div>
          ) : communications.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Nenhum comunicado"
              description="Quando a administração publicar um comunicado, ele aparecerá aqui."
            />
          ) : (
            communications.map((communication) => (
              <div key={communication._id} className="rounded-md border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="font-medium">{communication.title}</h4>
                    <p className="text-muted-foreground text-sm">
                      Publicado em {formatDateTime(communication.publishedAt)}
                    </p>
                  </div>
                  <Badge variant="secondary">Comunicado</Badge>
                </div>
                {communication.message ? (
                  <p className="mt-3 text-sm whitespace-pre-wrap">{communication.message}</p>
                ) : null}
                {communication.documentId ? (
                  <div className="mt-3">
                    <ViewPdfButton
                      docId={communication.documentId as Id<"documents">}
                      sessionToken={sessionToken}
                      orgId={String(condoId)}
                      label="Visualizar documento"
                      variant="outline"
                      size="sm"
                    />
                  </div>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
