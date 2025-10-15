import { useMemo } from "react";
import { Building2, FileText, Vote, TrendingUp } from "lucide-react";
import { useQuery } from "convex/react";
import { PageHeader } from "../components/layout/PageHeader";
import { KPICard } from "../components/admin/KPICard";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { api, Doc } from "../lib/convexGenerated";

interface DashboardPageProps {
  condos: Doc<"condos">[] | undefined;
  selectedCondo: Doc<"condos"> | null;
}

const formatDateTime = (timestamp: number) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(timestamp));

export function DashboardPage({ condos, selectedCondo }: DashboardPageProps) {
  const minutes = useQuery(
    api.minutes.list,
    selectedCondo ? { condoId: selectedCondo._id } : "skip",
  );

  const totalCondos = condos?.length ?? 0;
  const openMinutes = minutes?.filter((minute) => minute.status === "open").length ?? 0;

  const recentActivity = useMemo(() => {
    if (!minutes) return [] as Array<{ id: string; title: string; status: string; publishedAt: number }>;
    return [...minutes]
      .sort((a, b) => b.publishedAt - a.publishedAt)
      .slice(0, 5)
      .map((minute) => ({
        id: minute._id,
        title: minute.title,
        status: minute.status,
        publishedAt: minute.publishedAt,
      }));
  }, [minutes]);

  return (
    <div>
      <PageHeader title="Visão Geral" />

      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Condomínios"
            value={totalCondos}
            icon={Building2}
          />
          <KPICard
            title="Atas Abertas"
            value={openMinutes}
            icon={FileText}
          />
          <KPICard
            title="Votos Hoje"
            value="--"
            icon={Vote}
          />
          <KPICard
            title="Taxa de Participação"
            value="--"
            icon={TrendingUp}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evento</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Horário</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentActivity.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>Ata publicada</TableCell>
                    <TableCell className="text-muted-foreground">
                      {activity.title}
                    </TableCell>
                    <TableCell>
                      {activity.status === "open" ? (
                        <Badge>Aberta</Badge>
                      ) : (
                        <Badge variant="secondary">Fechada</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatDateTime(activity.publishedAt)}
                    </TableCell>
                  </TableRow>
                ))}
                {recentActivity.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Nenhuma atividade registrada para este condomínio.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
