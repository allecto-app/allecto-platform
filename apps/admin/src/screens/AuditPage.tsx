import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { Download, Loader2 } from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { Card, CardContent } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Input } from "../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { api, Id } from "../lib/convexGenerated";

type NotificationLogRecord = {
  _id: Id<"notificationLogs">;
  createdAt: number;
  condoId: Id<"condos">;
  condoName: string | null;
  condoSubdomain: string | null;
  template: string;
  channel: string;
  audienceCount: number;
  successCount: number;
  errorCount: number;
  note: string | null;
};

type AdminAuditEventRecord = {
  _id: Id<"adminAuditEvents">;
  action: string;
  actorType: string;
  actorId?: string;
  actorKey: string;
  condoId?: Id<"condos">;
  entityType: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
  metadata?: unknown;
  createdAt: number;
};

const TEMPLATE_LABELS: Record<string, string> = {
  convocation: "Convocação",
  reminderD2: "Lembrete D-2",
  reminderD4: "Lembrete D-4",
  closed: "Fechamento",
};

interface AuditPageProps {
  sessionToken: string;
}

function formatDateTime(value: number) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function toCsvCell(value: unknown): string {
  const text =
    value === undefined || value === null
      ? ""
      : typeof value === "string"
        ? value
        : JSON.stringify(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function AuditPage({ sessionToken }: AuditPageProps) {
  const [tab, setTab] = useState("notifications");

  const [condoFilter, setCondoFilter] = useState("all");
  const [templateFilter, setTemplateFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  const [actionFilter, setActionFilter] = useState("all");
  const [adminCondoFilter, setAdminCondoFilter] = useState("all");
  const [actorFilter, setActorFilter] = useState("all");
  const [adminDateFrom, setAdminDateFrom] = useState("");
  const [adminDateTo, setAdminDateTo] = useState("");
  const [adminSearch, setAdminSearch] = useState("");

  const logsResult = useQuery(api.notifications.listLogs, {}) as NotificationLogRecord[] | undefined;
  const isLoadingLogs = logsResult === undefined;
  const logs = logsResult ?? [];

  const allAdminEvents = useQuery(api.adminAudit.listEvents, {
    token: sessionToken,
    limit: 1000,
  }) as AdminAuditEventRecord[] | undefined;

  const adminEvents = useQuery(api.adminAudit.listEvents, {
    token: sessionToken,
    action: actionFilter === "all" ? undefined : actionFilter,
    condoId: adminCondoFilter === "all" ? undefined : (adminCondoFilter as Id<"condos">),
    actorKey: actorFilter === "all" ? undefined : actorFilter,
    dateFrom: adminDateFrom ? new Date(`${adminDateFrom}T00:00:00`).getTime() : undefined,
    dateTo: adminDateTo ? new Date(`${adminDateTo}T23:59:59.999`).getTime() : undefined,
    search: adminSearch.trim() || undefined,
    limit: 300,
  }) as AdminAuditEventRecord[] | undefined;

  const isLoadingAdminEvents = adminEvents === undefined;

  const dateRange = useMemo(() => {
    if (!dateFilter) return null;
    const start = new Date(dateFilter);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateFilter);
    end.setHours(23, 59, 59, 999);
    return { start: start.getTime(), end: end.getTime() };
  }, [dateFilter]);

  const condoOptions = useMemo(() => {
    const unique = new Map<string, { id: string; name: string }>();
    for (const log of logs) {
      const key =
        log.condoId ??
        (log.condoSubdomain ? `subdomain:${log.condoSubdomain}` : null) ??
        (log.condoName ? `name:${log.condoName}` : null);
      if (!key) continue;
      unique.set(key, { id: key, name: log.condoName ?? log.condoSubdomain ?? "Condomínio" });
    }
    return Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [logs]);

  const templateOptions = useMemo(() => {
    const values = new Set<string>();
    for (const log of logs) {
      if (log.template) values.add(log.template);
    }
    return values.size === 0 ? Object.keys(TEMPLATE_LABELS) : Array.from(values).sort();
  }, [logs]);

  const channelOptions = useMemo(() => {
    const values = new Set<string>();
    for (const log of logs) {
      if (log.channel) values.add(log.channel);
    }
    return values.size === 0 ? ["push", "email", "sms"] : Array.from(values).sort();
  }, [logs]);

  const filteredNotificationData = useMemo(() => {
    return logs.filter((log) => {
      const condoKey =
        log.condoId ??
        (log.condoSubdomain ? `subdomain:${log.condoSubdomain}` : null) ??
        (log.condoName ? `name:${log.condoName}` : null);
      const matchesCondo = condoFilter === "all" || condoKey === condoFilter;
      const matchesTemplate = templateFilter === "all" || log.template === templateFilter;
      const matchesChannel = channelFilter === "all" || log.channel === channelFilter;
      const matchesDate =
        !dateRange || (log.createdAt >= dateRange.start && log.createdAt <= dateRange.end);
      return matchesCondo && matchesTemplate && matchesChannel && matchesDate;
    });
  }, [logs, condoFilter, templateFilter, channelFilter, dateRange]);

  const adminOptions = useMemo(() => {
    const source = allAdminEvents ?? [];
    const actionValues = new Set<string>();
    const actorValues = new Set<string>();
    const condoValues = new Map<string, string>();
    for (const row of source) {
      if (row.action) actionValues.add(row.action);
      if (row.actorKey) actorValues.add(row.actorKey);
      if (row.condoId) condoValues.set(String(row.condoId), String(row.condoId));
    }
    return {
      actions: Array.from(actionValues).sort(),
      actors: Array.from(actorValues).sort(),
      condos: Array.from(condoValues.entries()).map(([id, name]) => ({ id, name })),
    };
  }, [allAdminEvents]);

  const getTemplateBadge = (template: string) => {
    switch (template) {
      case "convocation":
        return <Badge>Convocação</Badge>;
      case "reminderD2":
        return <Badge variant="secondary">Lembrete D-2</Badge>;
      case "reminderD4":
        return <Badge variant="secondary">Lembrete D-4</Badge>;
      case "closed":
        return <Badge variant="outline">Fechamento</Badge>;
      default:
        return <Badge>{template}</Badge>;
    }
  };

  const getChannelBadge = (channel: string) => {
    switch (channel) {
      case "push":
        return <Badge variant="outline">Push</Badge>;
      case "email":
        return <Badge variant="outline">Email</Badge>;
      case "sms":
        return <Badge variant="outline">SMS</Badge>;
      default:
        return <Badge variant="outline">{channel}</Badge>;
    }
  };

  const handleExportAdminCsv = () => {
    const rows = adminEvents ?? [];
    if (rows.length === 0) return;
    const header = [
      "createdAt",
      "action",
      "actorType",
      "actorId",
      "actorKey",
      "condoId",
      "entityType",
      "entityId",
      "before",
      "after",
      "metadata",
    ];
    const lines = [
      header.join(","),
      ...rows.map((row) =>
        [
          toCsvCell(new Date(row.createdAt).toISOString()),
          toCsvCell(row.action),
          toCsvCell(row.actorType),
          toCsvCell(row.actorId),
          toCsvCell(row.actorKey),
          toCsvCell(row.condoId),
          toCsvCell(row.entityType),
          toCsvCell(row.entityId),
          toCsvCell(row.before),
          toCsvCell(row.after),
          toCsvCell(row.metadata),
        ].join(","),
      ),
    ];
    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const objectUrl = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = `admin-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(objectUrl);
  };

  return (
    <div>
      <PageHeader title="Auditoria" breadcrumb={["Allecto App", "Auditoria"]} />

      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="admin">Ações Sensíveis</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Condomínio</Label>
              <Select value={condoFilter} onValueChange={setCondoFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {condoOptions.map((condo) => (
                    <SelectItem key={condo.id} value={condo.id}>
                      {condo.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de Mensagem</Label>
              <Select value={templateFilter} onValueChange={setTemplateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {templateOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {TEMPLATE_LABELS[option] ?? option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Canal</Label>
              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {channelOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Condomínio</TableHead>
                    <TableHead>Mensagem</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead className="text-right">Audiência</TableHead>
                    <TableHead className="text-right">Sucesso</TableHead>
                    <TableHead className="text-right">Falha</TableHead>
                    <TableHead>Notas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingLogs && (
                    <TableRow>
                      <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                        Carregando registros...
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoadingLogs && filteredNotificationData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                        Nenhum registro encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoadingLogs &&
                    filteredNotificationData.map((item) => (
                      <TableRow key={item._id}>
                        <TableCell className="text-muted-foreground">
                          {formatDateTime(item.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {item.condoName ?? item.condoSubdomain ?? "Condomínio"}
                          </Badge>
                        </TableCell>
                        <TableCell>{getTemplateBadge(item.template)}</TableCell>
                        <TableCell>{getChannelBadge(item.channel)}</TableCell>
                        <TableCell className="text-right">{item.audienceCount}</TableCell>
                        <TableCell className="text-right text-success">{item.successCount}</TableCell>
                        <TableCell className="text-right text-destructive">{item.errorCount}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {item.note ?? (item.errorCount > 0 ? "Falhas registradas" : "-")}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admin" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <Label>Ação</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {adminOptions.actions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Condomínio</Label>
              <Select value={adminCondoFilter} onValueChange={setAdminCondoFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {adminOptions.condos.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ator</Label>
              <Select value={actorFilter} onValueChange={setActorFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {adminOptions.actors.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data inicial</Label>
              <Input type="date" value={adminDateFrom} onChange={(e) => setAdminDateFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Data final</Label>
              <Input type="date" value={adminDateTo} onChange={(e) => setAdminDateTo(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[260px] flex-1 space-y-2">
              <Label>Busca</Label>
              <Input
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                placeholder="ação, entidade, ator, metadata..."
              />
            </div>
            <Button variant="outline" onClick={handleExportAdminCsv} disabled={!adminEvents || adminEvents.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Ator</TableHead>
                    <TableHead>Entidade</TableHead>
                    <TableHead>Antes</TableHead>
                    <TableHead>Depois</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingAdminEvents && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Carregando eventos de auditoria...
                        </span>
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoadingAdminEvents && (!adminEvents || adminEvents.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                        Nenhum evento encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoadingAdminEvents &&
                    adminEvents?.map((row) => (
                      <TableRow key={row._id}>
                        <TableCell>{formatDateTime(row.createdAt)}</TableCell>
                        <TableCell className="font-medium">{row.action}</TableCell>
                        <TableCell>{row.actorKey}</TableCell>
                        <TableCell>
                          {row.entityType}
                          {row.entityId ? ` (${row.entityId})` : ""}
                        </TableCell>
                        <TableCell className="max-w-[260px] truncate text-xs text-muted-foreground">
                          {row.before ? JSON.stringify(row.before) : "-"}
                        </TableCell>
                        <TableCell className="max-w-[260px] truncate text-xs text-muted-foreground">
                          {row.after ? JSON.stringify(row.after) : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
