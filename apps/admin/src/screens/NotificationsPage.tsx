import { useState } from "react";
import { PageHeader } from "../components/layout/PageHeader";
import { Card, CardContent } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Input } from "../components/ui/input";

const notifications = [
  {
    id: 1,
    date: "10/01/2025 10:30",
    template: "convocation",
    channel: "push",
    audience: 47,
    success: 45,
    failed: 2,
    note: "2 dispositivos offline",
  },
  {
    id: 2,
    date: "08/01/2025 09:00",
    template: "reminderD2",
    channel: "email",
    audience: 47,
    success: 47,
    failed: 0,
    note: "-",
  },
  {
    id: 3,
    date: "06/01/2025 09:00",
    template: "reminderD4",
    channel: "sms",
    audience: 47,
    success: 45,
    failed: 2,
    note: "2 números inválidos",
  },
  {
    id: 4,
    date: "05/01/2025 14:00",
    template: "convocation",
    channel: "push",
    audience: 47,
    success: 47,
    failed: 0,
    note: "-",
  },
  {
    id: 5,
    date: "03/01/2025 23:59",
    template: "closed",
    channel: "email",
    audience: 47,
    success: 47,
    failed: 0,
    note: "-",
  },
];

export function NotificationsPage() {
  const [templateFilter, setTemplateFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  const filteredNotifications = notifications.filter((notification) => {
    const matchesTemplate =
      templateFilter === "all" || notification.template === templateFilter;
    const matchesChannel =
      channelFilter === "all" || notification.channel === channelFilter;
    return matchesTemplate && matchesChannel;
  });

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
      <PageHeader title="Notificações" />

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
              {filteredNotifications.map((notification) => (
                <TableRow key={notification.id}>
                  <TableCell className="text-muted-foreground">
                    {notification.date}
                  </TableCell>
                  <TableCell>{getTemplateBadge(notification.template)}</TableCell>
                  <TableCell>{getChannelBadge(notification.channel)}</TableCell>
                  <TableCell className="text-right">
                    {notification.audience}
                  </TableCell>
                  <TableCell className="text-right text-success">
                    {notification.success}
                  </TableCell>
                  <TableCell className="text-right text-destructive">
                    {notification.failed}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {notification.note}
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
