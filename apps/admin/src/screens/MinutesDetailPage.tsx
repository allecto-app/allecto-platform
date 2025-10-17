import { Download, X } from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { toast } from "sonner";
import { Id } from "../lib/convexGenerated";

interface MinutesDetailPageProps {
  onNavigate: (page: string) => void;
  condoId: Id<"condos"> | null;
}

const votes = [
  { id: 1, unit: "101", resident: "João Silva", choice: "agree", comment: "" },
  { id: 2, unit: "102", resident: "Maria Santos", choice: "agree", comment: "Concordo plenamente" },
  { id: 3, unit: "103", resident: "Pedro Oliveira", choice: "disagree", comment: "Não concordo com os valores" },
  { id: 4, unit: "201", resident: "Ana Costa", choice: "agree", comment: "" },
  { id: 5, unit: "202", resident: "Carlos Lima", choice: "agree", comment: "" },
];

const auditLog = [
  { id: 1, event: "Lembrete D-2 enviado", date: "08/01/2025 10:30", success: 45, failed: 2 },
  { id: 2, event: "Ata publicada", date: "05/01/2025 14:00", success: 47, failed: 0 },
];

export function MinutesDetailPage({ onNavigate }: MinutesDetailPageProps) {
  const agreePercentage = 80;
  const disagreePercentage = 20;
  const totalVotes = votes.length;

  const handleClose = () => {
    toast.success("Ata fechada com sucesso!");
    onNavigate("minutes");
  };

  const handleDownload = () => {
    toast.info("Download iniciado");
  };

  return (
    <div>
      <PageHeader
        title="Ata de Assembleia Ordinária 2025"
        breadcrumb={["Atas", "Detalhes"]}
        primaryAction={{
          label: "Fechar Ata",
          onClick: handleClose,
        }}
        secondaryAction={{
          label: "Baixar PDF",
          onClick: handleDownload,
        }}
      />

      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-muted-foreground">Status</div>
                <div>
                  <Badge>Aberta</Badge>
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Publicado em</div>
                <div>10/01/2025 14:30</div>
              </div>
              <div>
                <div className="text-muted-foreground">Fecha em</div>
                <div>15/01/2025 23:59</div>
              </div>
              <div>
                <div className="text-muted-foreground">Total de Unidades</div>
                <div>47</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resultado Parcial</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-muted-foreground">Concordam</span>
                  <span>{agreePercentage}%</span>
                </div>
                <Progress value={agreePercentage} className="h-2" />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-muted-foreground">Discordam</span>
                  <span>{disagreePercentage}%</span>
                </div>
                <Progress value={disagreePercentage} className="h-2" />
              </div>
              <div className="pt-2">
                <div className="text-muted-foreground">Total de Votos</div>
                <div className="text-[24px]">{totalVotes}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Votos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Morador</TableHead>
                  <TableHead>Escolha</TableHead>
                  <TableHead>Comentário</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {votes.map((vote) => (
                  <TableRow key={vote.id}>
                    <TableCell>{vote.unit}</TableCell>
                    <TableCell>{vote.resident}</TableCell>
                    <TableCell>
                      {vote.choice === "agree" ? (
                        <Badge>Concorda</Badge>
                      ) : (
                        <Badge variant="secondary">Discorda</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {vote.comment || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Notificações</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evento</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Sucesso</TableHead>
                  <TableHead className="text-right">Falhas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLog.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.event}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {log.date}
                    </TableCell>
                    <TableCell className="text-right text-success">
                      {log.success}
                    </TableCell>
                    <TableCell className="text-right text-destructive">
                      {log.failed}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
