import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Loader2, FileDown, Trash2, PlusCircle, FileText, Printer } from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { toast } from "sonner";
import { api, Doc, Id } from "../lib/convexGenerated";

type RequestType = "access" | "deletion";
type RequestStatus = "open" | "in_review" | "approved" | "rejected" | "completed";

type RequestRow = {
  _id: Id<"dsarRequests">;
  protocol: string;
  type: RequestType;
  status: RequestStatus;
  residentEmail?: string;
  condoId?: Id<"condos">;
  requestedAt: number;
  dueAt: number;
  assignedTo?: string;
  resolutionNote?: string;
  residentName?: string | null;
  condoName?: string | null;
  condoSubdomain?: string | null;
};

type RequestDetail = {
  request: RequestRow;
  resident: {
    id: Id<"residents">;
    name: string;
    email?: string | null;
    phone?: string | null;
    role: string;
    isActive: boolean;
    deletedAt?: number | null;
  } | null;
  condo: {
    id: Id<"condos">;
    name: string;
    subdomain: string;
  } | null;
  events: Array<{
    _id: Id<"dsarRequestEvents">;
    action: string;
    actor: string;
    createdAt: number;
    note?: string;
    payload?: unknown;
  }>;
};

interface DsarRequestsPageProps {
  sessionToken: string;
  condo: Doc<"condos"> | null;
}

const STATUS_LABELS: Record<RequestStatus, string> = {
  open: "Aberta",
  in_review: "Em análise",
  approved: "Aprovada",
  rejected: "Rejeitada",
  completed: "Concluída",
};

const TYPE_LABELS: Record<RequestType, string> = {
  access: "Acesso/Exportação",
  deletion: "Eliminação",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function DsarRequestsPage({ sessionToken, condo }: DsarRequestsPageProps) {
  const [newType, setNewType] = useState<RequestType>("access");
  const [newResidentEmail, setNewResidentEmail] = useState("");
  const [newNote, setNewNote] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<Id<"dsarRequests"> | null>(null);
  const [assignedTo, setAssignedTo] = useState("");
  const [resolutionNote, setResolutionNote] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExportingReportDoc, setIsExportingReportDoc] = useState(false);
  const [isPrintingReport, setIsPrintingReport] = useState(false);

  const [statusFilter, setStatusFilter] = useState<"all" | RequestStatus>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | RequestType>("all");
  const [condoFilter, setCondoFilter] = useState<"all" | string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");

  const rowsAllResult = useQuery(api.dsar.listRequests, {
    token: sessionToken,
    limit: 500,
  }) as RequestRow[] | undefined;

  const dateFromMs = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : undefined;
  const dateToMs = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : undefined;

  const rowsResult = useQuery(api.dsar.listRequests, {
    token: sessionToken,
    limit: 200,
    status: statusFilter === "all" ? undefined : statusFilter,
    type: typeFilter === "all" ? undefined : typeFilter,
    condoId: condoFilter === "all" ? undefined : (condoFilter as Id<"condos">),
    dateFrom: dateFromMs,
    dateTo: dateToMs,
    search: search.trim() || undefined,
  }) as RequestRow[] | undefined;

  const detailResult = useQuery(
    api.dsar.getRequest,
    selectedRequestId
      ? {
          token: sessionToken,
          requestId: selectedRequestId,
        }
      : "skip",
  ) as RequestDetail | null | undefined;

  const createRequest = useMutation(api.dsar.createRequest);
  const updateRequest = useMutation(api.dsar.updateRequest);
  const generateAccessExport = useMutation(api.dsar.generateAccessExport);
  const executeDeletion = useMutation(api.dsar.executeDeletion);

  const rows = rowsResult ?? [];
  const rowsAll = rowsAllResult ?? [];
  const selected = detailResult?.request ?? null;
  const isLoadingRows = rowsResult === undefined;
  const isLoadingDetail = selectedRequestId !== null && detailResult === undefined;
  const selectedCondoName = useMemo(() => condo?.name ?? null, [condo?.name]);

  const condoOptions = useMemo(() => {
    const unique = new Map<string, string>();
    for (const row of rowsAll) {
      if (!row.condoId) continue;
      const label = row.condoName ?? row.condoSubdomain ?? String(row.condoId);
      unique.set(String(row.condoId), label);
    }
    return Array.from(unique.entries()).map(([id, label]) => ({ id, label }));
  }, [rowsAll]);

  const formatDate = (timestamp: number) =>
    new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
      new Date(timestamp),
    );

  const handleCreate = async () => {
    const email = newResidentEmail.trim().toLowerCase();
    if (!email) {
      toast.error("Informe o e-mail do titular");
      return;
    }

    setIsCreating(true);
    try {
      const result = await createRequest({
        token: sessionToken,
        type: newType,
        residentEmail: email,
        condoId: condo?._id ?? undefined,
        note: newNote.trim() || undefined,
      });
      toast.success(`Solicitação criada (${result.protocol})`);
      setNewResidentEmail("");
      setNewNote("");
      setSelectedRequestId(result.requestId);
    } catch (error) {
      console.error("Failed to create DSAR request", error);
      toast.error("Não foi possível criar a solicitação");
    } finally {
      setIsCreating(false);
    }
  };

  const handleStatusUpdate = async (status: RequestStatus) => {
    if (!selectedRequestId) return;
    setIsUpdating(true);
    try {
      await updateRequest({
        token: sessionToken,
        requestId: selectedRequestId,
        status,
        assignedTo: assignedTo.trim() || undefined,
        resolutionNote: resolutionNote.trim() || undefined,
        eventNote: `Status alterado para ${STATUS_LABELS[status]}`,
      });
      toast.success("Solicitação atualizada");
    } catch (error) {
      console.error("Failed to update DSAR request", error);
      toast.error("Não foi possível atualizar a solicitação");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExport = async () => {
    if (!selectedRequestId) return;
    setIsExporting(true);
    try {
      const payload = await generateAccessExport({
        token: sessionToken,
        requestId: selectedRequestId,
      });
      const fileName = `${selected?.protocol ?? "dsar-export"}.json`;
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json;charset=utf-8",
      });
      const objectUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(objectUrl);
      toast.success("Exportação gerada e baixada");
    } catch (error) {
      console.error("Failed to generate DSAR export", error);
      toast.error("Não foi possível gerar a exportação");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeletion = async () => {
    if (!selectedRequestId) return;
    setIsDeleting(true);
    try {
      await executeDeletion({
        token: sessionToken,
        requestId: selectedRequestId,
        note: resolutionNote.trim() || undefined,
      });
      toast.success("Eliminação/anonimização executada com sucesso");
    } catch (error) {
      console.error("Failed to execute DSAR deletion", error);
      toast.error("Não foi possível executar a eliminação");
    } finally {
      setIsDeleting(false);
    }
  };

  const buildClosureReportHtml = (detail: RequestDetail) => {
    const request = detail.request;
    const eventsRows = detail.events
      .map(
        (event) => `
          <tr>
            <td>${escapeHtml(event.action)}</td>
            <td>${escapeHtml(event.actor)}</td>
            <td>${escapeHtml(formatDate(event.createdAt))}</td>
            <td>${escapeHtml(event.note ?? "-")}</td>
          </tr>
        `,
      )
      .join("");

    return `
      <!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <title>Relatório DSAR - ${escapeHtml(request.protocol)}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
            h1 { margin: 0 0 8px; }
            h2 { margin: 24px 0 8px; font-size: 16px; }
            .muted { color: #6b7280; font-size: 12px; }
            .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 16px; }
            .item { border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px 10px; }
            .k { font-size: 12px; color: #6b7280; }
            .v { font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; font-size: 12px; vertical-align: top; }
            th { background: #f3f4f6; }
            @media print {
              body { margin: 12mm; }
            }
          </style>
        </head>
        <body>
          <h1>Relatório de Encerramento DSAR</h1>
          <div class="muted">Protocolo: ${escapeHtml(request.protocol)}</div>
          <div class="muted">Emitido em: ${escapeHtml(formatDate(Date.now()))}</div>

          <h2>Dados da Solicitação</h2>
          <div class="grid">
            <div class="item"><div class="k">Tipo</div><div class="v">${escapeHtml(TYPE_LABELS[request.type])}</div></div>
            <div class="item"><div class="k">Status</div><div class="v">${escapeHtml(STATUS_LABELS[request.status])}</div></div>
            <div class="item"><div class="k">Solicitada em</div><div class="v">${escapeHtml(formatDate(request.requestedAt))}</div></div>
            <div class="item"><div class="k">Prazo</div><div class="v">${escapeHtml(formatDate(request.dueAt))}</div></div>
            <div class="item"><div class="k">Titular</div><div class="v">${escapeHtml(detail.resident?.name ?? request.residentEmail ?? "-")}</div></div>
            <div class="item"><div class="k">Condomínio</div><div class="v">${escapeHtml(detail.condo?.name ?? "-")}</div></div>
            <div class="item"><div class="k">Responsável</div><div class="v">${escapeHtml(request.assignedTo ?? "-")}</div></div>
            <div class="item"><div class="k">Nota de resolução</div><div class="v">${escapeHtml(request.resolutionNote ?? "-")}</div></div>
          </div>

          <h2>Trilha de Auditoria</h2>
          <table>
            <thead>
              <tr>
                <th>Ação</th>
                <th>Ator</th>
                <th>Data/Hora</th>
                <th>Observação</th>
              </tr>
            </thead>
            <tbody>
              ${eventsRows || '<tr><td colspan="4">Sem eventos</td></tr>'}
            </tbody>
          </table>
        </body>
      </html>
    `;
  };

  const handleExportClosureReportDoc = async () => {
    if (!detailResult) return;
    setIsExportingReportDoc(true);
    try {
      const html = buildClosureReportHtml(detailResult);
      const blob = new Blob([html], { type: "application/msword;charset=utf-8" });
      const objectUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `${detailResult.request.protocol}-closure-report.doc`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(objectUrl);
      toast.success("Relatório DOC gerado");
    } catch (error) {
      console.error("Failed to export closure report doc", error);
      toast.error("Não foi possível gerar o relatório DOC");
    } finally {
      setIsExportingReportDoc(false);
    }
  };

  const handlePrintClosureReport = async () => {
    if (!detailResult) return;
    setIsPrintingReport(true);
    try {
      const html = buildClosureReportHtml(detailResult);
      const printWindow = window.open("", "_blank", "noopener,noreferrer,width=1024,height=768");
      if (!printWindow) {
        toast.error("Pop-up bloqueado. Permita pop-ups para imprimir o relatório.");
        return;
      }
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      toast.success("Relatório aberto para impressão/PDF");
    } catch (error) {
      console.error("Failed to print closure report", error);
      toast.error("Não foi possível abrir relatório para impressão");
    } finally {
      setIsPrintingReport(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Solicitações LGPD" breadcrumb={["Allecto App", "Solicitações LGPD"]} />

      <Card>
        <CardHeader>
          <CardTitle>Nova solicitação</CardTitle>
          <CardDescription>
            Abra um protocolo DSAR para acesso/exportação ou eliminação.{" "}
            {selectedCondoName ? `Condomínio selecionado: ${selectedCondoName}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="dsar-type">Tipo</Label>
              <select
                id="dsar-type"
                className="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
                value={newType}
                onChange={(event) => setNewType(event.target.value as RequestType)}
              >
                <option value="access">Acesso/Exportação</option>
                <option value="deletion">Eliminação</option>
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="dsar-email">E-mail do titular</Label>
              <Input
                id="dsar-email"
                type="email"
                value={newResidentEmail}
                onChange={(event) => setNewResidentEmail(event.target.value)}
                placeholder="titular@exemplo.com"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dsar-note">Observação inicial (opcional)</Label>
            <Textarea
              id="dsar-note"
              rows={3}
              value={newNote}
              onChange={(event) => setNewNote(event.target.value)}
              placeholder="Contexto da solicitação, canal de entrada, etc."
            />
          </div>
          <Button onClick={() => void handleCreate()} disabled={isCreating}>
            {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
            Criar solicitação
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Solicitações</CardTitle>
          <CardDescription>Lista e acompanhamento de protocolos DSAR com filtros.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-5">
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                className="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as "all" | RequestStatus)}
              >
                <option value="all">Todos</option>
                <option value="open">Aberta</option>
                <option value="in_review">Em análise</option>
                <option value="approved">Aprovada</option>
                <option value="rejected">Rejeitada</option>
                <option value="completed">Concluída</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <select
                className="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value as "all" | RequestType)}
              >
                <option value="all">Todos</option>
                <option value="access">Acesso/Exportação</option>
                <option value="deletion">Eliminação</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Condomínio</Label>
              <select
                className="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
                value={condoFilter}
                onChange={(event) => setCondoFilter(event.target.value)}
              >
                <option value="all">Todos</option>
                {condoOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Data inicial</Label>
              <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Data final</Label>
              <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Busca</Label>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por protocolo, e-mail, responsável ou nota"
            />
          </div>

          {isLoadingRows ? (
            <div className="text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando solicitações...
            </div>
          ) : rows.length === 0 ? (
            <div className="text-muted-foreground">Nenhuma solicitação encontrada para os filtros.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Protocolo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Titular</TableHead>
                  <TableHead>Condomínio</TableHead>
                  <TableHead>Solicitada em</TableHead>
                  <TableHead>Prazo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow
                    key={String(row._id)}
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedRequestId(row._id);
                      setAssignedTo(row.assignedTo ?? "");
                      setResolutionNote(row.resolutionNote ?? "");
                    }}
                  >
                    <TableCell>{row.protocol}</TableCell>
                    <TableCell>{TYPE_LABELS[row.type]}</TableCell>
                    <TableCell>
                      <Badge variant={row.status === "completed" ? "default" : "secondary"}>
                        {STATUS_LABELS[row.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{row.residentName ?? row.residentEmail ?? "-"}</TableCell>
                    <TableCell>{row.condoName ?? row.condoSubdomain ?? "-"}</TableCell>
                    <TableCell>{formatDate(row.requestedAt)}</TableCell>
                    <TableCell>{formatDate(row.dueAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detalhe da solicitação</CardTitle>
          <CardDescription>
            Trilha de auditoria, ações formais de atendimento LGPD e relatório de encerramento.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedRequestId === null ? (
            <div className="text-muted-foreground">Selecione uma solicitação na tabela acima.</div>
          ) : isLoadingDetail || !detailResult ? (
            <div className="text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando detalhe...
            </div>
          ) : (
            <>
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <div className="text-muted-foreground text-xs">Protocolo</div>
                  <div>{detailResult.request.protocol}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Titular</div>
                  <div>{detailResult.resident?.name ?? detailResult.request.residentEmail ?? "-"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Condomínio</div>
                  <div>{detailResult.condo?.name ?? "-"}</div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="assigned-to">Responsável</Label>
                  <Input
                    id="assigned-to"
                    value={assignedTo}
                    onChange={(event) => setAssignedTo(event.target.value)}
                    placeholder="Nome ou e-mail do responsável"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resolution-note">Nota de resolução</Label>
                  <Input
                    id="resolution-note"
                    value={resolutionNote}
                    onChange={(event) => setResolutionNote(event.target.value)}
                    placeholder="Resumo de decisão e justificativa"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => void handleStatusUpdate("in_review")}
                  disabled={isUpdating}
                >
                  Em análise
                </Button>
                <Button
                  variant="outline"
                  onClick={() => void handleStatusUpdate("approved")}
                  disabled={isUpdating}
                >
                  Aprovar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => void handleStatusUpdate("rejected")}
                  disabled={isUpdating}
                >
                  Rejeitar
                </Button>
                <Button onClick={() => void handleStatusUpdate("completed")} disabled={isUpdating}>
                  Concluir
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  onClick={() => void handleExport()}
                  disabled={isExporting || detailResult.request.type !== "access"}
                >
                  {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                  Gerar exportação DSAR
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => void handleDeletion()}
                  disabled={isDeleting || detailResult.request.type !== "deletion"}
                >
                  {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                  Executar eliminação/anonimização
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => void handleExportClosureReportDoc()}
                  disabled={isExportingReportDoc}
                >
                  {isExportingReportDoc ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="mr-2 h-4 w-4" />
                  )}
                  Exportar relatório DOC
                </Button>
                <Button
                  variant="outline"
                  onClick={() => void handlePrintClosureReport()}
                  disabled={isPrintingReport}
                >
                  {isPrintingReport ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Printer className="mr-2 h-4 w-4" />
                  )}
                  Imprimir relatório (PDF)
                </Button>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-semibold">Trilha de auditoria</h4>
                {detailResult.events.length === 0 ? (
                  <div className="text-muted-foreground text-sm">Sem eventos registrados.</div>
                ) : (
                  <div className="space-y-2">
                    {detailResult.events.map((event) => (
                      <div key={String(event._id)} className="rounded-md border p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">{event.action}</span>
                          <span className="text-muted-foreground text-xs">{formatDate(event.createdAt)}</span>
                        </div>
                        <div className="text-muted-foreground text-xs">{event.actor}</div>
                        {event.note ? <div className="mt-1 text-sm">{event.note}</div> : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
