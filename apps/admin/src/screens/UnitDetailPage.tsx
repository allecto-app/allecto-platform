import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Trash2, UserPlus, Loader2 } from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
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
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { api, Doc, Id } from "../lib/convexGenerated";
import type { UnitRecord } from "../types/unit";

type MembershipRole = "owner" | "tenant";

type UnitDetailMembership = {
  membershipId: Id<"memberships">;
  resident: {
    id: Id<"residents">;
    name: string;
    email: string | null;
    phone: string | null;
    role: string;
    isActive: boolean;
  };
  membershipRole: MembershipRole | null;
  linkedAt: number;
};

type UnitDetailVote = {
  id: Id<"votes">;
  minuteId: Id<"minutes">;
  minuteTitle: string;
  minutePublishedAt: number | null;
  choice: "agree" | "disagree";
  comment: string | null;
  createdAt: number;
};

type UnitDetailResponse = {
  unit: UnitRecord;
  memberships: UnitDetailMembership[];
  votes: UnitDetailVote[];
} | null;

interface UnitDetailPageProps {
  onNavigate: (page: string) => void;
  condoId: Id<"condos"> | null;
  unitId?: Id<"units"> | null;
  unitFallback?: UnitRecord | null;
  onUnitLoaded?: (unit: UnitRecord) => void;
}

export function UnitDetailPage({
  onNavigate,
  condoId,
  unitId,
  unitFallback,
  onUnitLoaded,
}: UnitDetailPageProps) {
  const [linkResidentOpen, setLinkResidentOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedResidentId, setSelectedResidentId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<MembershipRole | "">("");
  const [isLinking, setIsLinking] = useState(false);
  const [pendingMembershipId, setPendingMembershipId] = useState<Id<"memberships"> | null>(null);

  const effectiveUnitId = unitId ?? unitFallback?.id ?? null;

  const detail = useQuery(
    api.units.detail,
    effectiveUnitId ? { unitId: effectiveUnitId } : "skip",
  ) as UnitDetailResponse | undefined;

  const unitFromQuery = detail && detail !== null ? detail.unit : null;
  const unit = detail === null ? null : unitFromQuery ?? unitFallback ?? null;
  const memberships = detail && detail !== null ? detail.memberships : [];
  const votes = detail && detail !== null ? detail.votes : [];

  useEffect(() => {
    if (unitFromQuery && onUnitLoaded) {
      onUnitLoaded(unitFromQuery);
    }
  }, [unitFromQuery, onUnitLoaded]);

  useEffect(() => {
    if (!linkResidentOpen) {
      setSearchTerm("");
      setSelectedResidentId("");
      setSelectedRole("");
    }
  }, [linkResidentOpen]);

  const isLoadingDetail = effectiveUnitId !== null && detail === undefined;
  const effectiveCondoId = unit?.condoId ?? condoId ?? null;

  const residents = useQuery(
    api.residents.list,
    effectiveCondoId ? { condoId: effectiveCondoId } : "skip",
  ) as Doc<"residents">[] | undefined;

  const isLoadingResidents = effectiveCondoId !== null && residents === undefined;

  const linkedResidents = useMemo(
    () =>
      memberships
        .slice()
        .sort((a, b) => a.resident.name.localeCompare(b.resident.name)),
    [memberships],
  );

  const availableResidents = useMemo(() => {
    if (!residents) return [] as Doc<"residents">[];
    const linkedIds = new Set(memberships.map((membership) => membership.resident.id));
    return residents.filter((resident) => !linkedIds.has(resident._id));
  }, [residents, memberships]);

  const filteredResidents = useMemo(() => {
    if (!searchTerm.trim()) return availableResidents;
    const query = searchTerm.trim().toLowerCase();
    return availableResidents.filter((resident) => {
      const nameMatch = resident.name.toLowerCase().includes(query);
      const emailMatch = (resident.email ?? "").toLowerCase().includes(query);
      return nameMatch || emailMatch;
    });
  }, [availableResidents, searchTerm]);

  useEffect(() => {
    if (!selectedResidentId) return;
    if (!availableResidents.some((resident) => resident._id === selectedResidentId)) {
      setSelectedResidentId("");
    }
  }, [availableResidents, selectedResidentId]);

  const formatDateTime = (timestamp: number | null | undefined) =>
    typeof timestamp === "number"
      ? new Intl.DateTimeFormat("pt-BR", {
          dateStyle: "short",
          timeStyle: "short",
        }).format(new Date(timestamp))
      : "-";

  const votesWithFormattedDate = useMemo(
    () =>
      votes.map((vote) => ({
        ...vote,
        formattedDate: formatDateTime(vote.createdAt),
      })),
    [votes],
  );

  const addMembership = useMutation(api.units.addMembership);
  const updateMembershipRole = useMutation(api.units.updateMembershipRole);
  const removeMembership = useMutation(api.units.removeMembership);

  const handleDelete = () => {
    toast.warning("Exclusão de unidade ainda não está disponível");
  };

  const handleEdit = () => {
    if (!unit) return;
    onNavigate("unit-edit");
  };

  const handleLinkResident = async () => {
    if (!unit || !selectedResidentId || !selectedRole) return;
    setIsLinking(true);
    try {
      await addMembership({
        residentId: selectedResidentId as Id<"residents">,
        unitId: unit.id,
        role: selectedRole,
      });
      const resident = availableResidents.find((r) => r._id === selectedResidentId);
      toast.success(
        `${resident?.name ?? "Morador"} vinculado como ${
          selectedRole === "owner" ? "proprietário" : "inquilino"
        }`,
      );
      setLinkResidentOpen(false);
      setSelectedResidentId("");
      setSelectedRole("");
      setSearchTerm("");
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível vincular o morador");
    } finally {
      setIsLinking(false);
    }
  };

  const handleChangeRole = async (
    membership: UnitDetailMembership,
    newRole: MembershipRole,
  ) => {
    setPendingMembershipId(membership.membershipId);
    try {
      await updateMembershipRole({
        membershipId: membership.membershipId,
        role: newRole,
      });
      toast.success(
        `${membership.resident.name} agora é ${
          newRole === "owner" ? "proprietário" : "inquilino"
        }`,
      );
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível atualizar o vínculo");
    } finally {
      setPendingMembershipId(null);
    }
  };

  const handleUnlinkResident = async (membership: UnitDetailMembership) => {
    setPendingMembershipId(membership.membershipId);
    try {
      await removeMembership({ membershipId: membership.membershipId });
      toast.success(`${membership.resident.name} desvinculado com sucesso`);
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível desvincular o morador");
    } finally {
      setPendingMembershipId(null);
    }
  };

  if (!effectiveUnitId && !unit) {
    return (
      <div>
        <PageHeader
          title="Unidade"
          breadcrumb={[{ label: "Unidades", onClick: () => onNavigate("units") }, "Detalhe"]}
          primaryAction={{
            label: "Voltar",
            onClick: () => onNavigate("units"),
          }}
        />
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Selecione uma unidade na lista para visualizar os detalhes.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoadingDetail) {
    return (
      <div className="flex h-full items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando unidade...
      </div>
    );
  }

  if (!unit) {
    return (
      <div>
        <PageHeader
          title="Unidade não encontrada"
          breadcrumb={[{ label: "Unidades", onClick: () => onNavigate("units") }, "Detalhe"]}
          primaryAction={{
            label: "Voltar",
            onClick: () => onNavigate("units"),
          }}
        />
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhuma unidade foi encontrada para o identificador informado.
          </CardContent>
        </Card>
      </div>
    );
  }

  const formattedCreatedAt = formatDateTime(unit.createdAt);
  const formattedUpdatedAt = formatDateTime(unit.updatedAt);
  const floorLabel = unit.floor ? `${unit.floor}º Andar` : "-";
  const blockLabel = unit.block ? `Bloco ${unit.block}` : "Unidade";
  const breadcrumb = [
    { label: "Unidades", onClick: () => onNavigate("units") },
    unit.block ? `${unit.block}-${unit.code}` : unit.code,
  ];
  const canSelectResident = !isLoadingResidents && filteredResidents.length > 0;

  return (
    <div>
      <PageHeader
        title={`${blockLabel} - ${unit.code}`}
        breadcrumb={breadcrumb}
        primaryAction={{
          label: "Editar Unidade",
          onClick: handleEdit,
        }}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Unidade</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-muted-foreground">Código</div>
                <div>{unit.code}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Bloco</div>
                <div>
                  {unit.block ? (
                    <Badge variant="outline">Bloco {unit.block}</Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Andar</div>
                <div>{floorLabel}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Condomínio</div>
                <div>
                  {unit.condoName ? (
                    <Badge variant="outline">{unit.condoName}</Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
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
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Moradores Vinculados</CardTitle>
              <Button onClick={() => setLinkResidentOpen(true)} className="w-full sm:w-auto">
                <UserPlus className="mr-2 h-4 w-4" />
                Vincular Morador
              </Button>
            </CardHeader>
            <CardContent>
              {linkedResidents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum morador vinculado
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {linkedResidents.map((membership) => {
                      const resident = membership.resident;
                      const nextRole: MembershipRole =
                        membership.membershipRole === "owner" ? "tenant" : "owner";
                      const isPending = pendingMembershipId === membership.membershipId;
                      return (
                        <TableRow key={membership.membershipId}>
                          <TableCell>{resident.name}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {resident.email ?? "-"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {resident.phone ?? "-"}
                          </TableCell>
                          <TableCell>
                            {membership.membershipRole === "owner" ? (
                              <Badge>Proprietário</Badge>
                            ) : membership.membershipRole === "tenant" ? (
                              <Badge variant="secondary">Inquilino</Badge>
                            ) : (
                              <Badge variant="outline">Sem tipo</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleChangeRole(membership, nextRole)}
                                disabled={isPending}
                              >
                                {membership.membershipRole === "owner"
                                  ? "Tornar Inquilino"
                                  : "Tornar Proprietário"}
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" disabled={isPending}>
                                    Desvincular
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Desvincular Morador</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja desvincular {resident.name}? O morador
                                      perderá acesso a esta unidade.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleUnlinkResident(membership)}
                                      disabled={isPending}
                                    >
                                      Desvincular
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Histórico de Votos</CardTitle>
            </CardHeader>
            <CardContent>
              {votesWithFormattedDate.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum voto registrado
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ata</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Escolha</TableHead>
                      <TableHead>Comentário</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {votesWithFormattedDate.map((vote) => (
                      <TableRow key={vote.id}>
                        <TableCell>{vote.minuteTitle}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {vote.formattedDate}
                        </TableCell>
                        <TableCell>
                          {vote.choice === "agree" ? (
                            <Badge>Concorda</Badge>
                          ) : (
                            <Badge variant="secondary">Discorda</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {vote.comment && vote.comment.trim().length > 0 ? vote.comment : "-"}
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
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Ações Perigosas</CardTitle>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir Unidade
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir Unidade</AlertDialogTitle>
                    <AlertDialogDescription>
                      A exclusão de unidades ainda não está disponível nesta versão.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Entendi
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>

      <Sheet open={linkResidentOpen} onOpenChange={setLinkResidentOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Vincular Morador</SheetTitle>
            <SheetDescription>
              Busque e selecione um morador para vincular a esta unidade
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search-resident">Buscar Morador</Label>
              <Input
                id="search-resident"
                placeholder="Nome ou email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={isLoadingResidents}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resident-select">Morador</Label>
              <Select value={selectedResidentId} onValueChange={setSelectedResidentId}>
                <SelectTrigger id="resident-select" disabled={!canSelectResident}>
                  <SelectValue placeholder={isLoadingResidents ? "Carregando..." : "Selecione um morador"} />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingResidents ? (
                    <SelectItem value="loading" disabled>
                      Carregando moradores...
                    </SelectItem>
                  ) : filteredResidents.length === 0 ? (
                    <SelectItem value="empty" disabled>
                      Nenhum morador disponível
                    </SelectItem>
                  ) : (
                    filteredResidents.map((resident) => (
                      <SelectItem key={resident._id} value={resident._id}>
                        {resident.name} {resident.email ? `- ${resident.email}` : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-select">Tipo de Vínculo</Label>
              <Select
                value={selectedRole}
                onValueChange={(value) => setSelectedRole(value as MembershipRole)}
              >
                <SelectTrigger id="role-select">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Proprietário</SelectItem>
                  <SelectItem value="tenant">Inquilino</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleLinkResident}
              className="w-full"
              disabled={!selectedResidentId || !selectedRole || isLinking}
            >
              {isLinking ? "Vinculando..." : "Vincular"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
