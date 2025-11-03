import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "../components/layout/PageHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Progress } from "../components/ui/progress";
import { EmptyState } from "../components/admin/EmptyState";
import { ViewPdfButton } from "../components/documents/ViewPdfButton";
import { api, Doc, Id } from "../lib/convexGenerated";
import { notificationFormatter } from "src/utils/textFormatter";

interface MinutesDetailPageProps {
  onNavigate: (page: string) => void;
  condoId: Id<"condos"> | null;
  condo: Doc<"condos"> | null;
  minuteId: Id<"minutes"> | null;
  minuteFallback?: Doc<"minutes"> | null;
  sessionToken: string;
}

const formatDateTime = (timestamp: number) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(timestamp));

const formatFileSize = (size: number) => {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  }
  if (size >= 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${size} B`;
};

const translateChoice = (choice: string) =>
  choice === "agree" ? "Concorda" : "Discorda";

type VoteWithDetails = {
  _id: Id<"votes">;
  minuteId: Id<"minutes">;
  unitId: Id<"units">;
  residentId: Id<"residents">;
  choice: "agree" | "disagree";
  comment: string | null;
  createdAt: number;
  residentName: string;
  residentRole: string | null;
  unitCode: string | null;
  unitBlock: string | null;
  unitFloor: string | null;
};

type DocumentEventRecord = {
  _id: Id<"documentEvents">;
  event: "upload" | "view";
  createdAt: number;
  userId: string;
};

type NotificationLogRecord = {
  _id: Id<"notificationLogs">;
  template: string;
  channel: string;
  successCount: number;
  errorCount: number;
  minuteId: Id<"minutes"> | null;
};

export function MinutesDetailPage({
  onNavigate,
  condoId,
  condo,
  minuteId,
  minuteFallback,
  sessionToken,
}: MinutesDetailPageProps) {
  const [isClosing, setIsClosing] = useState(false);

  if (!minuteId) {
    return (
      <EmptyState
        icon={FileText}
        title="Selecione uma ata"
        description="Escolha uma ata na lista para visualizar os detalhes."
        primaryAction={{
          label: "Voltar para Atas",
          onClick: () => onNavigate("minutes"),
        }}
      />
    );
  }

  const minute = useQuery(api.minutes.get, { minuteId });
  const minuteData = minute ?? minuteFallback ?? null;

  if (minute === undefined && !minuteData) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!minuteData) {
    return (
      <EmptyState
        icon={FileText}
        title="Ata não encontrada"
        description="Não foi possível localizar esta ata. Ela pode ter sido removida."
        primaryAction={{
          label: "Voltar para Atas",
          onClick: () => onNavigate("minutes"),
        }}
      />
    );
  }

  const orgId = condo
    ? String(condo._id)
    : condoId
    ? String(condoId)
    : undefined;
  const documentId =
    (minuteData.documentId as Id<"documents"> | undefined) ?? undefined;

  const document = useQuery(
    api.documents.get,
    documentId
      ? {
          docId: documentId,
          sessionToken,
          orgId,
        }
      : "skip"
  );

  const documentEvents = useQuery(
    api.documents.listEvents,
    documentId
      ? {
          docId: documentId,
          sessionToken,
          orgId,
          limit: 50,
        }
      : "skip"
  );

  const voteSummary = useQuery(api.votes.summary, { minuteId });
  const votes = useQuery(api.votes.listForMinute, { minuteId }) as
    | VoteWithDetails[]
    | undefined;

  const notificationLogs = useQuery(
    api.notifications.listLogs,
    minuteData ? { condoId: minuteData.condoId, limit: 200 } : "skip"
  );

  const closeMinute = useMutation(api.minutes.close);

  const filteredLogs = useMemo(
    () =>
      (notificationLogs as NotificationLogRecord[] | undefined)?.filter(
        (log) => log.minuteId === minuteId
      ) ?? [],
    [notificationLogs, minuteId]
  );

  const agreeCount = voteSummary?.agree ?? 0;
  const disagreeCount = voteSummary?.disagree ?? 0;
  const totalVotes = voteSummary?.total ?? 0;
  const agreePercentage = totalVotes
    ? Math.round((agreeCount / totalVotes) * 100)
    : 0;
  const disagreePercentage = totalVotes
    ? Math.round((disagreeCount / totalVotes) * 100)
    : 0;

  const handleCloseMinute = async () => {
    if (!minuteId) return;
    try {
      setIsClosing(true);
      await closeMinute({ minuteId });
      toast.success("Ata fechada com sucesso!");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível fechar a ata";
      toast.error(message);
    } finally {
      setIsClosing(false);
    }
  };

  const breadcrumb = ["Atas", minuteData.title];

  const documentMetadataAvailable = !!documentId;
  const documentLoading = documentId && document === undefined;
  const documentRecord = documentId ? document ?? null : null;
  const documentEventsList =
    (documentEvents as DocumentEventRecord[] | undefined) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={minuteData.title}
        breadcrumb={breadcrumb}
        contextPill={
          condo ? { name: condo.name, subdomain: condo.subdomain } : undefined
        }
        primaryAction={
          minuteData.status === "open"
            ? {
                label: "Fechar Ata",
                onClick: handleCloseMinute,
                disabled: isClosing,
                variant: "destructive",
              }
            : undefined
        }
        secondaryAction={{
          label: "Voltar",
          onClick: () => onNavigate("minutes"),
        }}
      />

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Informações Gerais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <div className="text-sm text-muted-foreground">Status</div>
                <Badge
                  variant={
                    minuteData.status === "open" ? "openminute" : "closedminute"
                  }
                >
                  {minuteData.status === "open" ? "Aberta" : "Fechada"}
                </Badge>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">
                  Publicado em
                </div>
                <div>{formatDateTime(minuteData.publishedAt)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Fecha em</div>
                <div>{formatDateTime(minuteData.closesAt)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Resumo</div>
                <div className="text-sm text-foreground">
                  {minuteData.summary ?? "Nenhum resumo registrado."}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!documentMetadataAvailable && (
              <p className="text-sm text-muted-foreground">
                Nenhum documento vinculado.
              </p>
            )}
            {documentLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando
                documento...
              </div>
            )}
            {documentRecord && (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{documentRecord.visibility}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {documentRecord.viewCount} visualizações
                  </span>
                </div>
                <div className="text-sm text-foreground">
                  {documentRecord.title}
                </div>
                <dl className="grid gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <dt>Tipo</dt>
                    <dd>{documentRecord.contentType}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt>Tamanho</dt>
                    <dd>{formatFileSize(documentRecord.size)}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt>Enviado em</dt>
                    <dd>{formatDateTime(documentRecord.createdAt)}</dd>
                  </div>
                  {documentRecord.lastViewedAt && (
                    <div className="flex items-center justify-between">
                      <dt>Última visualização</dt>
                      <dd>{formatDateTime(documentRecord.lastViewedAt)}</dd>
                    </div>
                  )}
                </dl>
                <ViewPdfButton
                  docId={documentRecord._id}
                  sessionToken={sessionToken}
                  orgId={documentRecord.orgId}
                  label="Visualizar PDF"
                  variant="outline"
                  className="w-full sm:w-auto"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Engajamento de Votos</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Total de votos</div>
            <div className="text-2xl font-semibold">{totalVotes}</div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Concordam</span>
              <span>{agreePercentage}%</span>
            </div>
            <Progress value={agreePercentage} className="h-2" />
            <div className="text-sm text-muted-foreground">
              {agreeCount} votos
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Discordam</span>
              <span>{disagreePercentage}%</span>
            </div>
            <Progress value={disagreePercentage} className="h-2" />
            <div className="text-sm text-muted-foreground">
              {disagreeCount} votos
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Votos registrados</CardTitle>
        </CardHeader>
        <CardContent>
          {votes === undefined ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando votos...
            </div>
          ) : votes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum voto registrado até o momento.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Morador</TableHead>
                  <TableHead>Escolha</TableHead>
                  <TableHead>Comentário</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {votes.map((vote) => (
                  <TableRow key={vote._id as string}>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(vote.createdAt)}
                    </TableCell>
                    <TableCell>{vote.unitCode ?? "-"}</TableCell>
                    <TableCell>{vote.residentName}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          vote.choice === "agree" ? "default" : "secondary"
                        }
                      >
                        {translateChoice(vote.choice)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {vote.comment ?? "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Histórico de visualizações</CardTitle>
          </CardHeader>
          <CardContent>
            {!documentId ? (
              <p className="text-sm text-muted-foreground">
                Anexe um documento para visualizar o histórico de acessos.
              </p>
            ) : documentEvents === undefined ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando
                histórico...
              </div>
            ) : documentEventsList.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum acesso registrado para este documento.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Evento</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documentEventsList.map((event) => (
                    <TableRow key={event._id as string}>
                      <TableCell>
                        <Badge
                          variant={
                            event.event === "view" ? "outline" : "outline"
                          }
                        >
                          {event.event === "view" ? "Visualização" : "Upload"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDateTime(event.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notificações enviadas</CardTitle>
          </CardHeader>
          <CardContent>
            {notificationLogs === undefined ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando
                notificações...
              </div>
            ) : filteredLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma notificação registrada para esta ata.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Evento</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead className="text-right">Sucesso</TableHead>
                    <TableHead className="text-right">Falhas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log._id as string}>
                      <TableCell className="capitalize">
                        {notificationFormatter(log.template)}
                      </TableCell>
                      <TableCell className="capitalize text-muted-foreground">
                        {log.channel}
                      </TableCell>
                      <TableCell className="text-right">
                        {log.successCount}
                      </TableCell>
                      <TableCell className="text-right">
                        {log.errorCount}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
