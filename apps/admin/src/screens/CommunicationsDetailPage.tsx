import { useMutation, useQuery } from "convex/react";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "../components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { EmptyState } from "../components/admin/EmptyState";
import { ViewPdfButton } from "../components/documents/ViewPdfButton";
import { api, type Doc, type Id } from "../lib/convexGenerated";

interface CommunicationsDetailPageProps {
  communicationId: Id<"residentCommunications"> | null;
  condo: Doc<"condos"> | null;
  sessionToken: string;
  onNavigate: (page: string) => void;
}

const ROLE_LABELS: Record<string, string> = {
  resident: "Morador",
  syndic: "Síndico",
  manager: "Gestor",
  council: "Conselho",
};

const formatDateTime = (timestamp: number | null | undefined) =>
  typeof timestamp === "number"
    ? new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(timestamp))
    : "-";

export function CommunicationsDetailPage({
  communicationId,
  condo,
  sessionToken,
  onNavigate,
}: CommunicationsDetailPageProps) {
  const resend = useMutation(api.communications.resend);

  const detail = useQuery(
    api.communications.getDetail,
    communicationId ? { token: sessionToken, communicationId } : "skip",
  ) as
    | {
        communication: Doc<"residentCommunications">;
        totals: {
          recipients: number;
          received: number;
          opened: number;
          failed: number;
        };
        recipients: Array<{
          receiptId: Id<"residentCommunicationReceipts">;
          residentId: Id<"residents">;
          residentName: string;
          residentEmail: string | null;
          residentRole: string | null;
          sentCount: number;
          failedCount: number;
          lastSentAt: number | null;
          lastFailedAt: number | null;
          lastError: string | null;
          openCount: number;
          lastOpenedAt: number | null;
          received: boolean;
          opened: boolean;
        }>;
      }
    | null
    | undefined;

  const handleResend = async () => {
    if (!communicationId) return;
    try {
      await resend({ token: sessionToken, communicationId });
      toast.success("Comunicado reenviado para o público original");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao reenviar comunicado");
    }
  };

  if (!communicationId) {
    return (
      <EmptyState
        icon={Mail}
        title="Selecione um comunicado"
        description="Abra um comunicado da lista para visualizar detalhes de recebimento e abertura."
        primaryAction={{ label: "Voltar para Comunicações", onClick: () => onNavigate("communications") }}
      />
    );
  }

  if (detail === undefined) {
    return (
      <div className="flex h-full items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando comunicado...
      </div>
    );
  }

  if (!detail) {
    return (
      <EmptyState
        icon={Mail}
        title="Comunicado não encontrado"
        description="Não foi possível localizar este comunicado."
        primaryAction={{ label: "Voltar para Comunicações", onClick: () => onNavigate("communications") }}
      />
    );
  }

  const audienceLabel =
    detail.communication.audienceType === "role"
      ? `Função: ${ROLE_LABELS[detail.communication.targetRole ?? ""] ?? detail.communication.targetRole ?? "-"}`
      : detail.communication.audienceType === "block"
      ? `Bloco: ${detail.communication.targetBlock ?? "-"}`
      : "Todos os moradores";

  return (
    <div className="space-y-6">
      <PageHeader
        title={detail.communication.title}
        breadcrumb={[
          { label: "Comunicados", onClick: () => onNavigate("communications") },
          "Detalhes",
        ]}
        secondaryAction={{ label: "Voltar", onClick: () => onNavigate("communications") }}
        primaryAction={{ label: "Reenviar", onClick: () => void handleResend() }}
        description={`Publicado em ${formatDateTime(detail.communication.publishedAt)} • Público: ${audienceLabel}`}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Destinatários</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl">{detail.totals.recipients}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Receberam</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl">{detail.totals.received}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Abriram</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl">{detail.totals.opened}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Falhas</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl">{detail.totals.failed}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conteúdo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {detail.communication.message ? (
            <p className="text-sm whitespace-pre-wrap">{detail.communication.message}</p>
          ) : (
            <p className="text-muted-foreground text-sm">Sem mensagem adicional.</p>
          )}
          {detail.communication.documentId ? (
            <ViewPdfButton
              docId={detail.communication.documentId as Id<"documents">}
              sessionToken={sessionToken}
              orgId={condo ? String(condo._id) : undefined}
              label="Visualizar documento"
              variant="outline"
              size="sm"
            />
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Destinatários</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {detail.recipients.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">
              Ainda não há registros de envio para este comunicado.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Morador</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Recebimento</TableHead>
                  <TableHead>Abertura</TableHead>
                  <TableHead>Último envio</TableHead>
                  <TableHead>Última abertura</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.recipients.map((recipient) => (
                  <TableRow key={recipient.receiptId}>
                    <TableCell>{recipient.residentName}</TableCell>
                    <TableCell>{recipient.residentEmail ?? "-"}</TableCell>
                    <TableCell>
                      {recipient.residentRole ? ROLE_LABELS[recipient.residentRole] ?? recipient.residentRole : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={recipient.received ? "default" : "secondary"}>
                          {recipient.received ? "Recebido" : "Pendente"}
                        </Badge>
                        {recipient.failedCount > 0 ? (
                          <Badge variant="destructive">Falhas: {recipient.failedCount}</Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={recipient.opened ? "default" : "secondary"}>
                        {recipient.opened ? `Abriu (${recipient.openCount})` : "Não abriu"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDateTime(recipient.lastSentAt)}</TableCell>
                    <TableCell>{formatDateTime(recipient.lastOpenedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
