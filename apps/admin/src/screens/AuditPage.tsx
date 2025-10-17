import { useState } from "react";
import { BarChart3 } from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { Card, CardContent } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Input } from "../components/ui/input";

const auditData = [
  {
    id: 1,
    date: "10/01/2025 10:30",
    condo: "Jardim das Flores",
    template: "convocation",
    channel: "push",
    audience: 47,
    success: 45,
    failed: 2,
    note: "2 dispositivos offline",
  },
  {
    id: 2,
    date: "10/01/2025 09:00",
    condo: "Vila Esperança",
    template: "reminderD2",
    channel: "email",
    audience: 32,
    success: 32,
    failed: 0,
    note: "-",
  },
  {
    id: 3,
    date: "09/01/2025 14:00",
    condo: "Residencial Primavera",
    template: "reminderD4",
    channel: "sms",
    audience: 28,
    success: 26,
    failed: 2,
    note: "2 números inválidos",
  },
  {
    id: 4,
    date: "08/01/2025 23:59",
    condo: "Jardim das Flores",
    template: "closed",
    channel: "email",
    audience: 47,
    success: 47,
    failed: 0,
    note: "-",
  },
  {
    id: 5,
    date: "08/01/2025 10:00",
    condo: "Park View",
    template: "convocation",
    channel: "push",
    audience: 21,
    success: 20,
    failed: 1,
    note: "1 dispositivo offline",
  },
];

export function AuditPage() {
  const [condoFilter, setCondoFilter] = useState("all");
  const [templateFilter, setTemplateFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  const filteredData = auditData.filter((item) => {
    const matchesCondo = condoFilter === "all" || item.condo.includes(condoFilter);
    const matchesTemplate = templateFilter === "all" || item.template === templateFilter;
    const matchesChannel = channelFilter === "all" || item.channel === channelFilter;
    return matchesCondo && matchesTemplate && matchesChannel;
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
      <PageHeader title="Audit (Global)" breadcrumb={["Platform", "Audit"]} />

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="space-y-2">
          <Label>Condomínio</Label>
          <Select value={condoFilter} onValueChange={setCondoFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Condos</SelectItem>
              <SelectItem value="Jardim">Jardim das Flores</SelectItem>
              <SelectItem value="Vila">Vila Esperança</SelectItem>
              <SelectItem value="Primavera">Residencial Primavera</SelectItem>
              <SelectItem value="Park">Park View</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Template</Label>
          <Select value={templateFilter} onValueChange={setTemplateFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Templates</SelectItem>
              <SelectItem value="convocation">Convocação</SelectItem>
              <SelectItem value="reminderD2">Lembrete D-2</SelectItem>
              <SelectItem value="reminderD4">Lembrete D-4</SelectItem>
              <SelectItem value="closed">Fechamento</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Channel</Label>
          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              <SelectItem value="push">Push</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Date Range</Label>
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
                <TableHead>Condo</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead className="text-right">Audience</TableHead>
                <TableHead className="text-right">Success</TableHead>
                <TableHead className="text-right">Failed</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-muted-foreground">{item.date}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.condo}</Badge>
                  </TableCell>
                  <TableCell>{getTemplateBadge(item.template)}</TableCell>
                  <TableCell>{getChannelBadge(item.channel)}</TableCell>
                  <TableCell className="text-right">{item.audience}</TableCell>
                  <TableCell className="text-right text-success">
                    {item.success}
                  </TableCell>
                  <TableCell className="text-right text-destructive">
                    {item.failed}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{item.note}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
