import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { FileText, X, Loader2 } from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { Card, CardContent } from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Label } from "../components/ui/label";
import { EmptyState } from "../components/admin/EmptyState";
import { toast } from "sonner";
import { api, Id, Doc } from "../lib/convexGenerated";
import { useDocuments } from "../hooks/useDocuments";
import { ViewPdfButton } from "../components/documents/ViewPdfButton";
import {
  assertCanCreateAssembly,
  type AssemblyBlockReason,
  useUsageSummary,
} from "../hooks/useUsageSummary";

interface MinutesListPageProps {
  onNavigate: (page: string) => void;
  condoId: Id<"condos"> | null;
  sessionToken: string;
  onSelectMinute: (minute: Doc<"minutes">) => void;
}

const formatDate = (timestamp: number) =>
  new Intl.DateTimeFormat("pt-BR").format(new Date(timestamp));

const formatDateTime = (timestamp: number) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(timestamp));

export function MinutesListPage({
  onNavigate,
  condoId,
  sessionToken,
  onSelectMinute,
}: MinutesListPageProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [closingId, setClosingId] = useState<Id<"minutes"> | null>(null);

  const minutes = useQuery(api.minutes.list, condoId ? { sessionToken, condoId } : "skip");
  const closeMinuteMutation = useMutation(api.minutes.close);
  const orgId = condoId ? condoId.toString() : null;
  const { documents, isLoading: documentsLoading } = useDocuments({
    orgId,
    sessionToken,
  });
  const {
    summary: usageSummary,
    isLoading: usageLoading,
    blockReason,
    remainingLabel,
  } = useUsageSummary(condoId);

  const filteredMinutes = useMemo(() => {
    if (!minutes) return [];
    return minutes.filter((minute: Doc<"minutes">) => {
      if (statusFilter === "all") return true;
      return minute.status === statusFilter;
    });
  }, [minutes, statusFilter]);
  const isLoading = !!condoId && !minutes;

  const documentMap = useMemo(() => {
    const entries = new Map<string, Doc<"documents">>();
    documents?.forEach((doc) => {
      entries.set(doc._id as unknown as string, doc);
    });
    return entries;
  }, [documents]);

  const handleCloseMinute = async (minuteId: Id<"minutes">) => {
    try {
      setClosingId(minuteId);
      await closeMinuteMutation({ sessionToken, minuteId });
      toast.success("Ata fechada com sucesso!");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível fechar a ata";
      toast.error(message);
    } finally {
      setClosingId(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Atas"
        primaryAction={{
          label: "Nova Ata",
          onClick: () => {
            if (!condoId) {
              onNavigate("minutes-new");
              return;
            }
            if (usageLoading) {
              toast.info("Verificando limites de uso...");
              return;
            }
            try {
              assertCanCreateAssembly(usageSummary);
            } catch (error) {
              const reason = error as AssemblyBlockReason;
              const message = reason?.message ?? "Limite de uso atingido.";
              toast.error(message);
              return;
            }
            onNavigate("minutes-new");
          },
          disabled: !!condoId && usageLoading,
        }}
        description={
          condoId
            ? blockReason?.message ?? remainingLabel ?? undefined
            : undefined
        }
      />

      <div className="mb-6 flex items-end gap-4">
        <div className="w-full max-w-xs space-y-2">
          <Label>Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="open">Abertas</SelectItem>
              <SelectItem value="closed">Fechadas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {!condoId ? (
        <EmptyState
          icon={FileText}
          title="Selecione um condomínio"
          description="Escolha um condomínio para visualizar as atas."
        />
      ) : isLoading ? (
        <Card>
          <CardContent className="flex items-center gap-2 p-6 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando atas...
          </CardContent>
        </Card>
      ) : filteredMinutes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nenhuma ata encontrada"
          description="Não há atas correspondentes aos filtros selecionados. Crie uma nova ata para começar."
          primaryAction={{
            label: "Nova Ata",
            onClick: () => onNavigate("minutes-new"),
          }}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Publicado em</TableHead>
                  <TableHead>Fecha em</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Visualizações</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMinutes.map((minute: Doc<"minutes">) => {
                  const documentId = minute.documentId as unknown as
                    | string
                    | undefined;
                  const document = documentId
                    ? documentMap.get(documentId) ?? null
                    : null;
                  return (
                    <TableRow key={minute._id}>
                      <TableCell>{minute.title}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(minute.publishedAt)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(minute.closesAt)}
                      </TableCell>
                      <TableCell>
                        {minute.status === "open" ? (
                          <Badge variant="openminute">Aberta</Badge>
                        ) : (
                          <Badge variant="closedminute">Fechada</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {documentsLoading ? (
                          <span className="text-muted-foreground">
                            Carregando...
                          </span>
                        ) : document ? (
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">
                              {document.title}
                            </span>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant="outline" className="uppercase">
                                {document.visibility}
                              </Badge>
                              <span>
                                Enviado em {formatDateTime(document.createdAt)}
                              </span>
                            </div>
                          </div>
                        ) : minute.pdfUrl ? (
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">
                              Documento legado
                            </span>
                            <a
                              href={minute.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary underline"
                            >
                              Abrir link existente
                            </a>
                          </div>
                        ) : (
                          <span className="text-destructive text-sm">
                            Documento não encontrado
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {document ? (
                          <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                            <span>{document.viewCount} visualizações</span>
                            {document.lastViewedAt ? (
                              <span>
                                Último acesso{" "}
                                {formatDateTime(document.lastViewedAt)}
                              </span>
                            ) : (
                              <span>Nunca acessado</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {document ? (
                            <ViewPdfButton
                              docId={document._id}
                              sessionToken={sessionToken}
                              orgId={document.orgId}
                            />
                          ) : minute.pdfUrl ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                window.open(
                                  minute.pdfUrl!,
                                  "_blank",
                                  "noopener,noreferrer"
                                )
                              }
                            >
                              Abrir link
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm" disabled>
                              Visualizar
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onSelectMinute(minute)}
                          >
                            Detalhes
                          </Button>
                          {minute.status === "open" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={closingId === minute._id}
                              onClick={() => handleCloseMinute(minute._id)}
                            >
                              {closingId === minute._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
