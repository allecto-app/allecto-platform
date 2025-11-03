import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { Users, Search, Eye, Loader2 } from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { Card, CardContent } from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { EmptyState } from "../components/admin/EmptyState";
import { InviteSyndicModal } from "../components/modals/invite-syndic";
import { CreateResidentModal } from "../components/modals/create-resident";
import { api, Doc } from "../lib/convexGenerated";
import { toast } from "sonner";
import { roleFormatter } from "src/utils/textFormatter";

type InviteDoc = Doc<"invites">;

interface ResidentsListPageProps {
  onNavigate: (page: string) => void;
  condo: Doc<"condos"> | null;
  canInviteSyndic: boolean;
  onSelectResident?: (resident: Doc<"residents">) => void;
}

const INVITE_STATUS_LABEL: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  pending: { label: "Pendente", variant: "secondary" },
  used: { label: "Usado", variant: "outline" },
  expired: { label: "Expirado", variant: "destructive" },
  revoked: { label: "Revogado", variant: "destructive" },
};

export function ResidentsListPage({
  onNavigate,
  condo,
  canInviteSyndic,
  onSelectResident,
}: ResidentsListPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const residents = useQuery(
    api.residents.list,
    condo ? { condoId: condo._id } : "skip"
  ) as Doc<"residents">[] | undefined;
  const invites = useQuery(
    api.invites.listByCondo,
    condo ? { condoId: condo._id } : "skip"
  ) as InviteDoc[] | undefined;

  const invitesByEmail = useMemo(() => {
    if (!invites) return new Map<string, InviteDoc>();
    return new Map(invites.map((invite: InviteDoc) => [invite.email, invite]));
  }, [invites]);

  const filteredResidents = useMemo(() => {
    if (!residents) return [];
    return residents.filter((resident: Doc<"residents">) => {
      const query = searchTerm.toLowerCase();
      const matchesSearch =
        resident.name.toLowerCase().includes(query) ||
        (resident.email ?? "").toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === "all" ||
        (resident.isActive ? "active" : "inactive") === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [residents, searchTerm, statusFilter]);

  const isLoading = !!condo && !residents;

  const handleOpenCreateResident = () => {
    if (!condo) {
      toast.error("Selecione um condomínio");
      return;
    }
    setCreateModalOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Moradores"
        primaryAction={
          canInviteSyndic
            ? {
                label: "Convidar Síndico",
                onClick: () => {
                  if (!condo) {
                    toast.error("Selecione um condomínio");
                    return;
                  }
                  setInviteModalOpen(true);
                },
                disabled: !condo,
              }
            : {
                label: "Novo Morador",
                onClick: handleOpenCreateResident,
                disabled: !condo,
              }
        }
        secondaryAction={
          canInviteSyndic
            ? {
                label: "Novo Morador",
                onClick: handleOpenCreateResident,
                disabled: !condo,
              }
            : undefined
        }
      />

      <div className="mb-6 flex flex-col gap-4 md:flex-row">
        <div className="flex-1 space-y-2">
          <Label>Buscar</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email"
              className="pl-9"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              disabled={!condo}
            />
          </div>
        </div>
        <div className="w-full md:w-48 space-y-2">
          <Label>Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger disabled={!condo}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {!condo ? (
        <EmptyState
          icon={Users}
          title="Selecione um condomínio"
          description="Escolha um condomínio para visualizar os moradores."
        />
      ) : isLoading ? (
        <Card>
          <CardContent className="flex items-center gap-2 p-6 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando moradores...
          </CardContent>
        </Card>
      ) : filteredResidents.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum morador encontrado"
          description="Convide novos moradores para o condomínio selecionado."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResidents.map((resident: Doc<"residents">) => {
                  const normalizedEmail = resident.email?.toLowerCase() ?? "";
                  const invite = normalizedEmail
                    ? invitesByEmail.get(normalizedEmail)
                    : undefined;
                  const inviteStatus = invite
                    ? INVITE_STATUS_LABEL[invite.status]
                    : undefined;

                  return (
                    <TableRow key={resident._id}>
                      <TableCell>{resident.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {resident.email ?? "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {resident.phone ?? "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            resident.role === "syndic" ? "default" : "secondary"
                          }
                        >
                          {roleFormatter(resident.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-2">
                          {resident.isActive ? (
                            <Badge variant="outline">Ativo</Badge>
                          ) : (
                            <Badge variant="destructive">Inativo</Badge>
                          )}
                          {inviteStatus && (
                            <Badge variant={inviteStatus.variant}>
                              {inviteStatus.label}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              onSelectResident?.(resident);
                              onNavigate("resident-detail");
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {invite && invite.status === "pending" && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  toast.info("Função disponível em breve")
                                }
                              >
                                Reenviar
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  toast.info("Função disponível em breve")
                                }
                              >
                                Revogar
                              </Button>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <InviteSyndicModal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        condoId={condo?._id ?? null}
        condoName={condo?.name}
      />
      <CreateResidentModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        condoId={condo?._id ?? null}
        condoName={condo?.name}
      />
    </div>
  );
}
