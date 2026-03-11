"use client";

import { useEffect, useMemo, useState } from "react";
import { UserX, UserCheck, Edit, Loader2 } from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { Id, api, type Doc } from "../lib/convexGenerated";
import type { ResidentRecord } from "../types/resident";
import { useAction, useMutation, useQuery } from "convex/react";

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

type ResidentUnitLink = {
  membershipId: Id<"memberships">;
  unitId: Id<"units">;
  code: string;
  block: string | null;
  role: string | null;
};

type ResidentActivity = {
  id: Id<"notificationLogs">;
  type: string;
  channel: string;
  description: string | null;
  createdAt: number;
};

type ResidentDetailResponse = {
  resident: ResidentRecord;
  units: ResidentUnitLink[];
  activities: ResidentActivity[];
} | null;

interface ResidentDetailPageProps {
  onNavigate: (page: string) => void;
  condoId: Id<"condos"> | null;
  residentId?: Id<"residents"> | null;
  residentFallback?: ResidentRecord | null;
  onResidentLoaded?: (resident: ResidentRecord) => void;
  onResidentDeleted?: () => void;
}

export function ResidentDetailPage({
  onNavigate,
  condoId: _condoId,
  residentId,
  residentFallback,
  onResidentLoaded,
  onResidentDeleted,
}: ResidentDetailPageProps) {
  const [linkUnitOpen, setLinkUnitOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<"owner" | "tenant" | "">("");
  const [isLinkingUnit, setIsLinkingUnit] = useState(false);
  const [pendingMembershipId, setPendingMembershipId] = useState<Id<"memberships"> | null>(null);

  const detail = useQuery(
    api.residentDetail.get,
    residentId
      ? { residentId }
      : residentFallback?.email
      ? { email: residentFallback.email }
      : "skip",
  ) as ResidentDetailResponse | undefined;
  const resendResidentOtp = useAction(api.residentDetail.resendOtp);
  const updateResident = useMutation(api.residents.update);
  const removeResident = useMutation(api.residents.remove);
  const addMembership = useMutation(api.units.addMembership);
  const removeMembership = useMutation(api.units.removeMembership);
  const [isUpdatingResidentStatus, setIsUpdatingResidentStatus] = useState(false);
  const [isDeletingResident, setIsDeletingResident] = useState(false);

  const residentFromQuery = detail?.resident ?? null;
  const resident = residentFromQuery ?? residentFallback ?? null;
  const units = detail?.units ?? [];
  const effectiveCondoId = resident?.condoId ?? _condoId ?? null;
  const allUnits = useQuery(
    api.units.listByCondo,
    effectiveCondoId ? { condoId: effectiveCondoId } : "skip",
  ) as Doc<"units">[] | undefined;
  const isLoadingUnits = effectiveCondoId !== null && allUnits === undefined;

  const availableUnits = useMemo(() => {
    if (!allUnits) return [] as Doc<"units">[];
    const linkedIds = new Set(units.map((unit) => String(unit.unitId)));
    return allUnits.filter((unit) => !linkedIds.has(String(unit._id)));
  }, [allUnits, units]);

  const filteredUnits = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return availableUnits;
    return availableUnits.filter((unit) => {
      const codeMatch = unit.code.toLowerCase().includes(query);
      const blockMatch = (unit.block ?? "").toLowerCase().includes(query);
      const floorMatch = (unit.floor ?? "").toLowerCase().includes(query);
      return codeMatch || blockMatch || floorMatch;
    });
  }, [availableUnits, searchTerm]);
  const formatDateTime = (timestamp: number | null | undefined) =>
    typeof timestamp === "number"
      ? new Intl.DateTimeFormat("pt-BR", {
          dateStyle: "short",
          timeStyle: "short",
        }).format(new Date(timestamp))
      : "-";

  const activities = (detail?.activities ?? []).map((activity) => ({
    ...activity,
    formattedDate: formatDateTime(activity.createdAt),
  }));
  const isLoading = residentId != null && detail === undefined;

  useEffect(() => {
    if (!linkUnitOpen) {
      setSelectedUnitId("");
      setSelectedRole("");
      setSearchTerm("");
      setIsLinkingUnit(false);
    }
  }, [linkUnitOpen]);

  useEffect(() => {
    if (filteredUnits.length === 0) {
      setSelectedUnitId("");
      return;
    }
    setSelectedUnitId((prev) => {
      if (prev && filteredUnits.some((unit) => unit._id === prev)) {
        return prev;
      }
      return filteredUnits[0]?._id ?? "";
    });
  }, [filteredUnits]);

  const formattedCreatedAt = formatDateTime(resident?.createdAt ?? null);
  const formattedUpdatedAt = formatDateTime(resident?.updatedAt ?? null);

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
  const handleUpdateResidentStatus = async (isActive: boolean) => {
    if (!resident || !resident.id || isUpdatingResidentStatus) return;

    setIsUpdatingResidentStatus(true);
    try {
      const result = await updateResident({
        residentId: resident.id,
        name: resident.name,
        email: resident.email ?? undefined,
        phone: resident.phone ?? undefined,
        role: resident.role,
        isActive,
      });

      const updatedResident = result?.resident as ResidentRecord | null | undefined;
      if (updatedResident) {
        onResidentLoaded?.(updatedResident);
      }

      toast.success(
        isActive
          ? "Morador reativado com sucesso"
          : "Morador desativado com sucesso",
      );
    } catch (error) {
      console.error(error);
      toast.error(
        isActive
          ? "Não foi possível reativar o morador"
          : "Não foi possível desativar o morador",
      );
    } finally {
      setIsUpdatingResidentStatus(false);
    }
  };

  const handleDeactivate = () => handleUpdateResidentStatus(false);
  const handleReactivate = () => handleUpdateResidentStatus(true);
  const handleDeleteResident = async () => {
    if (!resident || !resident.id || isDeletingResident) return;

    setIsDeletingResident(true);
    try {
      await removeResident({ residentId: resident.id });
      toast.success("Morador excluído com sucesso");
      onResidentDeleted?.();
      onNavigate("residents");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir o morador",
      );
    } finally {
      setIsDeletingResident(false);
    }
  };
  const handleUnlinkUnit = async (unit: ResidentUnitLink) => {
    if (!unit.membershipId) {
      toast.error("Vínculo não encontrado");
      return;
    }
    setPendingMembershipId(unit.membershipId);
    try {
      await removeMembership({ membershipId: unit.membershipId });
      toast.success(`Unidade ${unit.code} desvinculada com sucesso`);
    } catch (error) {
      console.error("Failed to unlink unit", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível desvincular a unidade",
      );
    } finally {
      setPendingMembershipId(null);
    }
  };
  const handleEdit = () => onNavigate("resident-edit");
  const handleLinkUnit = async () => {
    if (!resident || !resident.id) return;
    if (!selectedUnitId || !selectedRole) {
      toast.error("Selecione a unidade e o tipo de vínculo");
      return;
    }
    setIsLinkingUnit(true);
    try {
      await addMembership({
        residentId: resident.id,
        unitId: selectedUnitId as Id<"units">,
        role: selectedRole,
      });
      toast.success("Unidade vinculada com sucesso");
      setLinkUnitOpen(false);
    } catch (error) {
      console.error("Failed to link unit", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível vincular a unidade",
      );
    } finally {
      setIsLinkingUnit(false);
    }
  };

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
          breadcrumb={[{ label: "Moradores", onClick: () => onNavigate("residents") }, "Detalhe"]}
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
        breadcrumb={[
          { label: "Moradores", onClick: () => onNavigate("residents") },
          resident?.name ?? "Detalhe",
        ]}
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
            <Button
              onClick={handleReactivate}
              size="sm"
              variant="outline"
              disabled={isUpdatingResidentStatus}
            >
              <UserCheck className="mr-2 h-4 w-4" />
              {isUpdatingResidentStatus ? "Reativando..." : "Reativar"}
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
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={pendingMembershipId === unit.membershipId}
                              >
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
                                <AlertDialogAction
                                  onClick={() => handleUnlinkUnit(unit)}
                                  disabled={pendingMembershipId === unit.membershipId}
                                >
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
            <CardContent className="space-y-3">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="w-full"
                    disabled={!resident.isActive || isUpdatingResidentStatus}
                  >
                    <UserX className="mr-2 h-4 w-4" />
                    {isUpdatingResidentStatus ? "Atualizando..." : "Desativar Morador"}
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
                      disabled={isUpdatingResidentStatus}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isUpdatingResidentStatus ? "Desativando..." : "Desativar"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full border-destructive text-destructive hover:bg-destructive/10"
                    disabled={resident.isActive || isDeletingResident || isUpdatingResidentStatus}
                  >
                    {isDeletingResident ? "Excluindo..." : "Excluir Morador"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir Morador</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação é permanente e removerá o cadastro de {resident.name}
                      e seus vínculos com unidades. O histórico de votos será
                      preservado sem dados pessoais identificáveis.
                      Continue somente se tiver certeza.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteResident}
                      disabled={isDeletingResident}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeletingResident ? "Excluindo..." : "Excluir"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              {resident.isActive && (
                <p className="text-sm text-muted-foreground">
                  Para excluir, primeiro desative o morador.
                </p>
              )}
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
          {effectiveCondoId === null ? (
            <div className="mt-6 rounded-md border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
              Não foi possível identificar o condomínio deste morador. Atualize o cadastro ou tente novamente mais tarde.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="search-unit">Buscar unidade</Label>
                <Input
                  id="search-unit"
                  placeholder="Digite para buscar por código, bloco ou andar"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  disabled={isLoadingUnits || availableUnits.length === 0}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="select-unit">Unidade</Label>
                <Select
                  value={selectedUnitId}
                  onValueChange={(value) => setSelectedUnitId(value)}
                  disabled={isLoadingUnits || filteredUnits.length === 0}
                >
                  <SelectTrigger id="select-unit">
                    <SelectValue placeholder={isLoadingUnits ? "Carregando unidades..." : "Selecione uma unidade"} />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingUnits ? (
                      <SelectItem value="loading" disabled>
                        Carregando unidades...
                      </SelectItem>
                    ) : filteredUnits.length === 0 ? (
                      <SelectItem value="empty" disabled>
                        {availableUnits.length === 0
                          ? "Nenhuma unidade disponível"
                          : "Sem resultados para a busca"}
                      </SelectItem>
                    ) : (
                      filteredUnits.map((unit) => (
                        <SelectItem key={unit._id} value={unit._id}>
                          {unit.code}
                          {unit.block ? ` • Bloco ${unit.block}` : ""}
                          {unit.floor ? ` • ${unit.floor}º Andar` : ""}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="select-role">Tipo de vínculo</Label>
                <Select
                  value={selectedRole}
                  onValueChange={(value: "owner" | "tenant") => setSelectedRole(value)}
                  disabled={!selectedUnitId || selectedUnitId === "loading" || selectedUnitId === "empty"}
                >
                  <SelectTrigger id="select-role">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Proprietário</SelectItem>
                    <SelectItem value="tenant">Inquilino</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full"
                onClick={handleLinkUnit}
                disabled={
                  isLinkingUnit ||
                  !selectedUnitId ||
                  selectedUnitId === "loading" ||
                  selectedUnitId === "empty" ||
                  !selectedRole
                }
              >
                {isLinkingUnit ? "Vinculando..." : "Vincular"}
              </Button>

              {availableUnits.length === 0 && !isLoadingUnits && (
                <div className="rounded-md border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                  Todas as unidades deste condomínio já estão vinculadas a este morador.
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
