import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Users, Search, Eye, Loader2 } from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { Card, CardContent } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { EmptyState } from "../components/admin/EmptyState";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../components/ui/sheet";
import { api, Doc } from "../lib/convexGenerated";
import { toast } from "sonner";

interface ResidentsListPageProps {
  onNavigate: (page: string) => void;
  condo: Doc<"condos"> | null;
}

export function ResidentsListPage({ onNavigate, condo }: ResidentsListPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteRole, setInviteRole] = useState("resident");
  const [isInviting, setIsInviting] = useState(false);

  const residents = useQuery(
    api.residents.list,
    condo ? { condoId: condo._id } : undefined,
  );
  const inviteResident = useMutation(api.residents.invite);

  const filteredResidents = useMemo(() => {
    if (!residents) return [];
    return residents.filter((resident) => {
      const matchesSearch =
        resident.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (resident.email ?? "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || (resident.isActive ? "active" : "inactive") === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [residents, searchTerm, statusFilter]);

  const handleInvite = async () => {
    if (!condo) {
      toast.error("Selecione um condomínio antes de convidar.");
      return;
    }
    if (!inviteName || (!inviteEmail && !invitePhone)) {
      toast.error("Informe um nome e email ou telefone.");
      return;
    }

    try {
      setIsInviting(true);
      await inviteResident({
        condoId: condo._id,
        name: inviteName,
        email: inviteEmail || undefined,
        phone: invitePhone || undefined,
        role: inviteRole,
      });
      toast.success("Convite enviado com sucesso!");
      setInviteOpen(false);
      setInviteName("");
      setInviteEmail("");
      setInvitePhone("");
      setInviteRole("resident");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível enviar o convite";
      toast.error(message);
    } finally {
      setIsInviting(false);
    }
  };

  const isLoading = !!condo && !residents;

  return (
    <div>
      <PageHeader
        title="Moradores"
        primaryAction={{
          label: "Convidar",
          onClick: () => setInviteOpen(true),
          disabled: !condo,
        }}
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
              onChange={(e) => setSearchTerm(e.target.value)}
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
          primaryAction={{
            label: "Convidar Morador",
            onClick: () => setInviteOpen(true),
          }}
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
                  <TableHead>Situação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResidents.map((resident) => (
                  <TableRow key={resident._id}>
                    <TableCell>{resident.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {resident.email ?? "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {resident.phone ?? "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={resident.role === "syndic" ? "default" : "secondary"}>
                        {resident.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {resident.isActive ? (
                        <Badge variant="outline">Ativo</Badge>
                      ) : (
                        <Badge variant="destructive">Inativo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onNavigate("resident-detail")}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Sheet open={inviteOpen} onOpenChange={setInviteOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Convidar Morador</SheetTitle>
            <SheetDescription>
              Preencha os dados para enviar um convite.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-name">Nome</Label>
              <Input
                id="invite-name"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-phone">Telefone</Label>
              <Input
                id="invite-phone"
                value={invitePhone}
                onChange={(e) => setInvitePhone(e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Função</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resident">Resident</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="syndic">Syndic</SelectItem>
                  <SelectItem value="council">Council</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-md bg-info/10 p-3 text-sm text-info">
              Um código de acesso será enviado ao morador convidado.
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setInviteOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleInvite} disabled={isInviting}>
                {isInviting ? "Enviando..." : "Enviar Convite"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
