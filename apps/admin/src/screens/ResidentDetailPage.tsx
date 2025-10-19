"use client";

import { useEffect, useState } from "react";
import { UserX, UserCheck, Edit, Loader2 } from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../components/ui/sheet";
import { toast } from "sonner";
import { Id, api } from "../lib/convexGenerated";
import type { ResidentRecord } from "../types/resident";
import { useAction, useQuery } from "convex/react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const TEMPLATE_LABELS: Record<string, string> = {
  convocation: "Convocação",
  reminderD2: "Lembrete D-2",
  reminderD4: "Lembrete D-4",
  closed: "Fechamento",
};

const ROLE_LABELS: Record<string, string> = {
  resident: "Morador",
  syndic: "Síndico",
  manager: "Gestor",
  council: "Conselho",
};

interface ResidentDetailPageProps {
  onNavigate: (page: string) => void;
  condoId: Id<"condos"> | null;
  residentId?: Id<"residents"> | null;
  residentFallback?: ResidentRecord | null;
  onResidentLoaded?: (resident: ResidentRecord) => void;
}

export function ResidentDetailPage({
  onNavigate,
  condoId: _condoId,
  residentId,
  residentFallback,
  onResidentLoaded,
}: ResidentDetailPageProps) {
  const [linkUnitOpen, setLinkUnitOpen] = useState(false);

  const detail = useQuery(
    api.residentDetail.get,
    residentId
      ? { residentId }
      : residentFallback?.email
      ? { email: residentFallback.email }
      : "skip",
  );
  const resendResidentOtp = useAction(api.residentDetail.resendOtp);

  const residentFromQuery = detail?.resident ?? null;
  const resident = residentFromQuery ?? residentFallback ?? null;
  const units = detail?.units ?? [];
  const activities = (detail?.activities ?? []).map((activity) => ({
    ...activity,
    formattedDate: format(new Date(activity.createdAt), "dd/MM/yyyy HH:mm", {
      locale: ptBR,
    }),
  }));
  const isLoading = residentId != null && detail === undefined;

  const formattedCreatedAt = resident?.createdAt
    ? format(new Date(resident.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })
    : "-";
  const formattedUpdatedAt = resident?.updatedAt
    ? format(new Date(resident.updatedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })
    : "-";

  const handleInviteAgain = async () => {
    if (!resident?.email) {
      toast.error("Residente sem email cadastrado");
      return;
    }
    try {
      await resendResidentOtp({ residentId: resident.id });
      toast.success("Convite reenviado com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível reenviar o convite");
    }
  };
  const handleDeactivate = () => toast.error("Desativação ainda não implementada");
  const handleReactivate = () => toast.success("Reativação ainda não implementada");
  const handleUnlinkUnit = (unitCode: string) =>
    toast.error(`Desvincular unidade ${unitCode} ainda não implementado`);
  const handleEdit = () => onNavigate("resident-edit");

  useEffect(() => {
    if (resident && onResidentLoaded) {
      onResidentLoaded(resident);
    }
  }, [resident, onResidentLoaded]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando morador...
      </div>
    );
  }

  if (!resident) {
    return (
      <div>
        <PageHeader
          title="Morador não encontrado"
          breadcrumb={["Moradores", "Detalhe"]}
          primaryAction={{ label: "Voltar", onClick: () => onNavigate("residents") }}
        />
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum morador foi encontrado para o identificador informado.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={resident?.name ?? "Morador"}
        breadcrumb={["Moradores", resident?.name ?? "Detalhe"]}
        primaryAction={{
          label: "Editar",
          onClick: handleEdit,
        }}
        secondaryAction={{
          label: "Convidar Novamente",
          onClick: handleInviteAgain,
          disabled: !resident.email,
        }}
        contextPill={resident.condoName || resident.condoSubdomain ? {
          name: resident.condoName ?? "Condomínio",
          subdomain: resident.condoSubdomain ?? "-",
        } : undefined}
      />

      {resident?.isActive === false && (
        <Alert className="mb-6 border-warning bg-warning/10">
          <AlertDescription className="flex items-center justify-between">
            <span>Este morador está inativo e não pode acessar o sistema.</span>
            <Button onClick={handleReactivate} size="sm" variant="outline">
              <UserCheck className="mr-2 h-4 w-4" />
              Reativar
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Informações</CardTitle>
              <Button variant="ghost" size="sm" onClick={handleEdit}>
                <Edit className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-muted-foreground">Nome</div>
                <div>{resident?.name ?? "-"}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Email</div>
                <div>{resident?.email ?? "-"}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Telefone</div>
                <div>{resident?.phone ?? "-"}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Condomínio</div>
                <div>
                  <Badge variant="outline">
                    {resident?.condoName ?? resident?.condoSubdomain ?? "-"}
                  </Badge>
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Função</div>
                <div>
                  <Badge variant={resident.role === "syndic" ? "default" : "secondary"}>
                    {ROLE_LABELS[resident.role] ?? resident.role}
                  </Badge>
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Status</div>
                <div>
                  {resident?.isActive ? (
                    <Badge>Ativo</Badge>
                  ) : (
                    <Badge variant="secondary">Inativo</Badge>
                  )}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Criado em</div>
                <div>{formattedCreatedAt}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Atualizado em</div>
                <div>{formattedUpdatedAt}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Unidades Vinculadas</CardTitle>
              <Button onClick={() => setLinkUnitOpen(true)}>
                Vincular Unidade
              </Button>
            </CardHeader>
            <CardContent>
              {units.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma unidade vinculada
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Bloco</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {units.map((unit) => (
                      <TableRow key={unit.membershipId}>
                        <TableCell>{unit.code}</TableCell>
                        <TableCell>
                        <Badge variant="outline">Bloco {unit.block ?? "-"}</Badge>
                        </TableCell>
                        <TableCell>
                          {unit.role === "owner" ? (
                            <Badge>Proprietário</Badge>
                          ) : unit.role === "tenant" ? (
                            <Badge variant="secondary">Inquilino</Badge>
                          ) : (
                            <Badge variant="outline">-</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                Desvincular
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Desvincular Unidade</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja desvincular a unidade {unit.code}?
                                  O morador perderá acesso a esta unidade.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleUnlinkUnit(unit.code)}>
                                  Desvincular
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Atividade Recente</CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  Nenhuma atividade registrada para este morador.
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => {
                    const templateLabel = activity.type
                      ? TEMPLATE_LABELS[activity.type] ?? activity.type
                      : "Registro";
                    return (
                      <div
                        key={activity.id}
                        className="border-l-2 border-border pl-4 pb-4 last:pb-0"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div>{templateLabel}</div>
                            <div className="text-muted-foreground">
                              {activity.description ??
                                (activity.channel
                                  ? `Evento via ${activity.channel.toUpperCase()}`
                                  : "-")}
                            </div>
                          </div>
                          {activity.channel && (
                            <Badge variant="outline">
                              {activity.channel.toUpperCase()}
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 text-muted-foreground">
                          {activity.formattedDate}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Ações Perigosas</CardTitle>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <UserX className="mr-2 h-4 w-4" />
                    Desativar Morador
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Desativar Morador</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja desativar {resident.name}? O morador não
                      poderá mais acessar o sistema até ser reativado.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeactivate}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Desativar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>

      <Sheet open={linkUnitOpen} onOpenChange={setLinkUnitOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Vincular Unidade</SheetTitle>
            <SheetDescription>
              Selecione uma unidade e o tipo de vínculo
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4 text-sm text-muted-foreground">
            Vincular unidades via painel ainda não está disponível nesta versão.
            Entre em contato com o time de engenharia para priorizar esta funcionalidade.
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
