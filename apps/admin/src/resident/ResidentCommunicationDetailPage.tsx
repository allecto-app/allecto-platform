import { useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "../components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { EmptyState } from "../components/admin/EmptyState";
import { ViewPdfButton } from "../components/documents/ViewPdfButton";
import { api, type Doc, type Id } from "../lib/convexGenerated";

interface ResidentCommunicationDetailPageProps {
  communicationId: Id<"residentCommunications"> | null;
  condoId: Id<"condos">;
  sessionToken: string;
  onBack: () => void;
}

const formatDateTime = (timestamp: number) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(timestamp));

export function ResidentCommunicationDetailPage({
  communicationId,
  condoId,
  sessionToken,
  onBack,
}: ResidentCommunicationDetailPageProps) {
  const markOpened = useMutation(api.communications.markOpened);

  const communication = useQuery(
    api.communications.getForResident,
    communicationId ? { token: sessionToken, communicationId } : "skip",
  ) as Doc<"residentCommunications"> | null | undefined;

  useEffect(() => {
    if (!communicationId || !communication) return;
    void markOpened({ token: sessionToken, communicationId }).catch((error) => {
      console.error("Failed to mark communication as opened", error);
      toast.error("Não foi possível registrar abertura do comunicado");
    });
  }, [communicationId, communication, markOpened, sessionToken]);

  if (!communicationId) {
    return (
      <EmptyState
        icon={FileText}
        title="Selecione um comunicado"
        description="Escolha um comunicado da lista para visualizar detalhes."
        primaryAction={{ label: "Voltar", onClick: onBack }}
      />
    );
  }

  if (communication === undefined) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!communication) {
    return (
      <EmptyState
        icon={FileText}
        title="Comunicado não encontrado"
        description="Este comunicado não está mais disponível para você."
        primaryAction={{ label: "Voltar", onClick: onBack }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={communication.title}
        breadcrumb={["Minha Conta", "Comunicados", communication.title]}
        secondaryAction={{ label: "Voltar", onClick: onBack }}
        description={`Publicado em ${formatDateTime(communication.publishedAt)}`}
      />

      <Card>
        <CardHeader>
          <CardTitle>Detalhes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Badge variant="secondary">Comunicado</Badge>
          {communication.message ? (
            <p className="text-sm whitespace-pre-wrap">{communication.message}</p>
          ) : (
            <p className="text-muted-foreground text-sm">Sem mensagem adicional.</p>
          )}
          {communication.documentId ? (
            <ViewPdfButton
              docId={communication.documentId as Id<"documents">}
              sessionToken={sessionToken}
              orgId={String(condoId)}
              label="Visualizar documento"
              variant="outline"
              size="sm"
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
