import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { FileText, Eye, X, Loader2 } from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { Card, CardContent } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Label } from "../components/ui/label";
import { EmptyState } from "../components/admin/EmptyState";
import { toast } from "sonner";
import { api, Id } from "../lib/convexGenerated";

interface MinutesListPageProps {
  onNavigate: (page: string) => void;
  condoId: Id<"condos"> | null;
}

const formatDate = (timestamp: number) =>
  new Intl.DateTimeFormat("pt-BR").format(new Date(timestamp));

export function MinutesListPage({ onNavigate, condoId }: MinutesListPageProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [closingId, setClosingId] = useState<Id<"minutes"> | null>(null);

  const minutes = useQuery(
    api.minutes.list,
    condoId ? { condoId } : undefined,
  );
  const closeMinuteMutation = useMutation(api.minutes.close);

  const filteredMinutes = useMemo(() => {
    if (!minutes) return [];
    return minutes.filter((minute) => {
      if (statusFilter === "all") return true;
      return minute.status === statusFilter;
    });
  }, [minutes, statusFilter]);
  const isLoading = !!condoId && !minutes;

  const handleCloseMinute = async (minuteId: Id<"minutes">) => {
    try {
      setClosingId(minuteId);
      await closeMinuteMutation({ minuteId });
      toast.success("Ata fechada com sucesso!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível fechar a ata";
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
          onClick: () => onNavigate("minutes-new"),
        }}
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
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMinutes.map((minute) => (
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
                        <Badge>Aberta</Badge>
                      ) : (
                        <Badge variant="secondary">Fechada</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onNavigate("minutes-detail")}
                      >
                        <Eye className="h-4 w-4" />
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
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
