import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { PageHeader } from "../components/layout/PageHeader";
import { Card, CardContent } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Input } from "../components/ui/input";
import { api } from "../lib/convexGenerated";

const TEMPLATE_LABELS: Record<string, string> = {
  convocation: "Convocação",
  reminderD2: "Lembrete D-2",
  reminderD4: "Lembrete D-4",
  closed: "Fechamento",
};

export function AuditPage() {
  const [condoFilter, setCondoFilter] = useState("all");
  const [templateFilter, setTemplateFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  const logsResult = useQuery(api.notifications.listLogs, {});
  const isLoading = logsResult === undefined;
  const logs = logsResult ?? [];

  const dateRange = useMemo(() => {
    if (!dateFilter) return null;
    const start = new Date(dateFilter);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateFilter);
    end.setHours(23, 59, 59, 999);
    return { start: start.getTime(), end: end.getTime() };
  }, [dateFilter]);

  const condoOptions = useMemo(() => {
    if (logs.length === 0) return [];
    const unique = new Map<string, { id: string; name: string }>();
    for (const log of logs) {
      const key =
        log.condoId ??
        (log.condoSubdomain ? `subdomain:${log.condoSubdomain}` : null) ??
        (log.condoName ? `name:${log.condoName}` : null);
      if (!key) continue;
      const label = log.condoName ?? log.condoSubdomain ?? "Condomínio";
      unique.set(key, { id: key, name: label });
    }
    return Array.from(unique.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "pt-BR"),
    );
  }, [logs]);

  const templateOptions = useMemo(() => {
    const values = new Set<string>();
    for (const log of logs) {
      if (log.template) values.add(log.template);
    }
    if (values.size === 0) {
      return Object.keys(TEMPLATE_LABELS);
    }
    return Array.from(values).sort();
  }, [logs]);

  const channelOptions = useMemo(() => {
    const values = new Set<string>();
    for (const log of logs) {
      if (log.channel) values.add(log.channel);
    }
    if (values.size === 0) {
      return ["push", "email", "sms"];
    }
    return Array.from(values).sort();
  }, [logs]);

  const filteredData = useMemo(() => {
    return logs.filter((log) => {
      const condoKey =
        log.condoId ??
        (log.condoSubdomain ? `subdomain:${log.condoSubdomain}` : null) ??
        (log.condoName ? `name:${log.condoName}` : null);
      const matchesCondo = condoFilter === "all" || condoKey === condoFilter;
      const matchesTemplate = templateFilter === "all" || log.template === templateFilter;
      const matchesChannel = channelFilter === "all" || log.channel === channelFilter;
      const matchesDate =
        !dateRange ||
        (log.createdAt >= dateRange.start && log.createdAt <= dateRange.end);
      return matchesCondo && matchesTemplate && matchesChannel && matchesDate;
    });
  }, [logs, condoFilter, templateFilter, channelFilter, dateRange]);

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

  const formatDateTime = (value: number) =>
    new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));

  return (
    <div>
      <PageHeader title="Auditoria" breadcrumb={["Allecto App", "Auditoria"]} />

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="space-y-2">
          <Label>Condomínio</Label>
          <Select value={condoFilter} onValueChange={setCondoFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Condos</SelectItem>
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
              <SelectItem value="all">Todos os Tipos</SelectItem>
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
              <SelectItem value="all">Todos os Canais</SelectItem>
              {channelOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Datas</Label>
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date/Time</TableHead>
                <TableHead>Condomínio</TableHead>
                <TableHead>Tipo de Mensagem</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead className="text-right">Audiência</TableHead>
                <TableHead className="text-right">Sucesso</TableHead>
                <TableHead className="text-right">Falha</TableHead>
                <TableHead>Notas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    Carregando registros de auditoria...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && filteredData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    Nenhum registro encontrado para os filtros selecionados.
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && filteredData.map((item) => (
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
                  <TableCell className="text-right text-success">
                    {item.successCount}
                  </TableCell>
                  <TableCell className="text-right text-destructive">
                    {item.errorCount}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.note ?? (item.errorCount > 0 ? "Falhas registradas" : "-")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
