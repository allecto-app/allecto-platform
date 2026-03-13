import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "../components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { EmptyState } from "../components/admin/EmptyState";
import { ViewPdfButton } from "../components/documents/ViewPdfButton";
import { api, Doc, Id } from "../lib/convexGenerated";

interface CommunicationsPageProps {
  condo: Doc<"condos"> | null;
  sessionToken: string;
  onNavigate?: (page: string) => void;
}

type CommunicationDoc = Doc<"residentCommunications">;

export function CommunicationsPage({ condo, sessionToken, onNavigate }: CommunicationsPageProps) {
  const [archivingId, setArchivingId] = useState<string | null>(null);

  const archive = useMutation(api.communications.archive);

  const condoId = condo?._id ?? null;
  const orgId = condo ? String(condo._id) : null;

  const communications = useQuery(
    api.communications.listByCondo,
    condoId ? { token: sessionToken, condoId, limit: 200 } : "skip",
  ) as CommunicationDoc[] | undefined;

  const handleArchive = async (communicationId: Id<"residentCommunications">) => {
    setArchivingId(String(communicationId));
    try {
      await archive({
        token: sessionToken,
        communicationId,
      });
      toast.success("Comunicado arquivado");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao arquivar comunicado";
      toast.error(message);
    } finally {
      setArchivingId(null);
    }
  };

  const formatDateTime = (timestamp: number) =>
    new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(timestamp));

  if (!condo) {
    return (
      <EmptyState
        icon={FileText}
        title="Selecione um condomínio"
        description="Escolha um condomínio para publicar comunicados aos moradores."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comunicados"
        breadcrumb={["Comunicados"]}
        primaryAction={{
          label: "Novo Comunicado",
          onClick: () => onNavigate?.("communications-new"),
        }}
        description="Veja todos os comunicados enviados aos moradores."
      />

      <Card>
        <CardHeader>
          <CardTitle>Comunicados publicados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {communications === undefined ? (
            <div className="text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando comunicados...
            </div>
          ) : communications.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum comunicado publicado.</p>
          ) : (
            communications.map((communication) => (
              <div key={communication._id} className="rounded-md border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="font-medium">{communication.title}</h4>
                    <p className="text-muted-foreground text-sm">
                      {formatDateTime(communication.publishedAt)}
                    </p>
                  </div>
                  <Badge variant={communication.status === "published" ? "default" : "secondary"}>
                    {communication.status === "published" ? "Publicado" : "Arquivado"}
                  </Badge>
                </div>
                {communication.message ? (
                  <p className="mt-3 text-sm whitespace-pre-wrap">{communication.message}</p>
                ) : null}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {communication.documentId ? (
                    <ViewPdfButton
                      docId={communication.documentId as Id<"documents">}
                      sessionToken={sessionToken}
                      orgId={orgId ?? undefined}
                      label="Visualizar documento"
                      variant="outline"
                      size="sm"
                    />
                  ) : null}
                  {communication.status === "published" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void handleArchive(communication._id)}
                      disabled={archivingId === String(communication._id)}
                    >
                      {archivingId === String(communication._id) ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Arquivar
                    </Button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
