import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { PageHeader } from "../components/layout/PageHeader";
import { Card, CardContent } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Input } from "../components/ui/input";
import { Loader2, Bell } from "lucide-react";
import { api, Doc, Id } from "../lib/convexGenerated";
import { EmptyState } from "../components/admin/EmptyState";

type NotificationsPageProps = {
  condoId: Id<"condos"> | null;
  condo: Doc<"condos"> | null;
  sessionToken: string;
};

const formatDateTime = (timestamp: number) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(timestamp));

type NotificationLog = {
  _id: Id<"notificationLogs">;
  createdAt: number;
  template: string;
  channel: string;
  audienceCount: number;
  successCount: number;
  errorCount: number;
  note: string | null;
  minuteId: Id<"minutes"> | null;
};

export function NotificationsPage({ condoId, condo }: NotificationsPageProps) {
  const [templateFilter, setTemplateFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  const queryArgs = useMemo(() => {
    const template = templateFilter === "all" ? undefined : templateFilter;
    const channel = channelFilter === "all" ? undefined : channelFilter;

    let dateFrom: number | undefined;
    let dateTo: number | undefined;

    if (dateFilter) {
      const start = new Date(`${dateFilter}T00:00:00`);
      const end = new Date(`${dateFilter}T23:59:59.999`);
      dateFrom = start.getTime();
      dateTo = end.getTime();
    }

    return {
      condoId: condoId ?? undefined,
      template,
      channel,
      dateFrom,
      dateTo,
      limit: 200,
    };
  }, [channelFilter, condoId, dateFilter, templateFilter]);

  const notifications = useQuery(api.notifications.listLogs, queryArgs) as NotificationLog[] | undefined;
  const isLoading = notifications === undefined;
  const data = notifications ?? [];

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

  return (
    <div>
      <PageHeader
        title="Notificações"
        contextPill={
          condo
            ? {
                name: condo.name,
                subdomain: condo.subdomain,
              }
            : undefined
        }
      />

      <div className="mb-6 flex flex-col gap-4 md:flex-row">
        <div className="flex-1 space-y-2">
          <Label>Template</Label>
          <Select value={templateFilter} onValueChange={setTemplateFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="convocation">Convocação</SelectItem>
              <SelectItem value="reminderD2">Lembrete D-2</SelectItem>
              <SelectItem value="reminderD4">Lembrete D-4</SelectItem>
              <SelectItem value="closed">Fechamento</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 space-y-2">
          <Label>Canal</Label>
          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="push">Push</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 space-y-2">
          <Label>Data</Label>
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando notificações...
            </div>
          ) : data.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="Nenhuma notificação encontrada"
              description="Não há notificações que correspondam aos filtros selecionados."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead className="text-right">Destinatários</TableHead>
                  <TableHead className="text-right">Sucesso</TableHead>
                  <TableHead className="text-right">Falhas</TableHead>
                  <TableHead>Nota</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((notification) => (
                  <TableRow key={notification._id as string}>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(notification.createdAt)}
                    </TableCell>
                    <TableCell>{getTemplateBadge(notification.template)}</TableCell>
                    <TableCell>{getChannelBadge(notification.channel)}</TableCell>
                    <TableCell className="text-right">
                      {notification.audienceCount}
                    </TableCell>
                    <TableCell className="text-right text-success">
                      {notification.successCount}
                    </TableCell>
                    <TableCell className="text-right text-destructive">
                      {notification.errorCount}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {notification.note ?? "-"}
                    </TableCell>
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
