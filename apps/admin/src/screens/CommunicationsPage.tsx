import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "../components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { EmptyState } from "../components/admin/EmptyState";
import { ViewPdfButton } from "../components/documents/ViewPdfButton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import { api, Doc, Id } from "../lib/convexGenerated";

interface CommunicationsPageProps {
  condo: Doc<"condos"> | null;
  sessionToken: string;
  onNavigate?: (page: string) => void;
  onSelectCommunication?: (communication: CommunicationDoc) => void;
}

type CommunicationDoc = Doc<"residentCommunications">;

export function CommunicationsPage({
  condo,
  sessionToken,
  onNavigate,
  onSelectCommunication,
}: CommunicationsPageProps) {
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [audienceFilter, setAudienceFilter] = useState<"all" | "role" | "block" | "any">("any");

  const archive = useMutation(api.communications.archive);
  const resend = useMutation(api.communications.resend);
  const deleteHard = useMutation(api.communications.deleteHard);

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

  const filteredCommunications =
    communications?.filter((communication) => {
      if (audienceFilter === "any") return true;
      return communication.audienceType === audienceFilter;
    }) ?? [];

  const formatAudience = (communication: CommunicationDoc) => {
    if (communication.audienceType === "role" && communication.targetRole) {
      const roleLabels: Record<string, string> = {
        resident: "Morador",
        syndic: "Síndico",
        manager: "Gestor",
        council: "Conselho",
      };
      return `Função: ${roleLabels[communication.targetRole] ?? communication.targetRole}`;
    }
    if (communication.audienceType === "block" && communication.targetBlock) {
      return `Bloco: ${communication.targetBlock}`;
    }
    return "Todos os moradores";
  };

  const handleResend = async (communicationId: Id<"residentCommunications">) => {
    setResendingId(String(communicationId));
    try {
      await resend({
        token: sessionToken,
        communicationId,
      });
      toast.success("Comunicado reenviado");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao reenviar comunicado";
      toast.error(message);
    } finally {
      setResendingId(null);
    }
  };

  const handleDeleteHard = async (communicationId: Id<"residentCommunications">) => {
    setDeletingId(String(communicationId));
    try {
      await deleteHard({
        token: sessionToken,
        communicationId,
      });
      toast.success("Comunicado excluído definitivamente");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Falha ao excluir definitivamente o comunicado";
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

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

      <div className="mb-2 w-full max-w-xs space-y-2">
        <Label>Público</Label>
        <Select
          value={audienceFilter}
          onValueChange={(value) => setAudienceFilter(value as "all" | "role" | "block" | "any")}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Todos os públicos</SelectItem>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="role">Função</SelectItem>
            <SelectItem value="block">Bloco</SelectItem>
          </SelectContent>
        </Select>
      </div>

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
          ) : filteredCommunications.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum comunicado publicado.</p>
          ) : (
            filteredCommunications.map((communication) => (
              <div key={communication._id} className="rounded-md border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="font-medium">{communication.title}</h4>
                    <p className="text-muted-foreground text-sm">
                      {formatDateTime(communication.publishedAt)}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Público: {formatAudience(communication)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {communication.audienceType === "all"
                        ? "Todos"
                        : communication.audienceType === "role"
                        ? "Função"
                        : "Bloco"}
                    </Badge>
                    <Badge variant={communication.status === "published" ? "default" : "secondary"}>
                      {communication.status === "published" ? "Publicado" : "Arquivado"}
                    </Badge>
                  </div>
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onSelectCommunication?.(communication);
                      onNavigate?.("communications-detail");
                    }}
                  >
                    Detalhes
                  </Button>
                  {communication.status === "published" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void handleResend(communication._id)}
                      disabled={resendingId === String(communication._id)}
                    >
                      {resendingId === String(communication._id) ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Reenviar
                    </Button>
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
                  {communication.status === "archived" ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deletingId === String(communication._id)}
                        >
                          {deletingId === String(communication._id) ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Excluir definitivamente
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir comunicado definitivamente?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação remove o comunicado e seus registros de recebimento/abertura.
                            Não é possível desfazer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => void handleDeleteHard(communication._id)}
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
