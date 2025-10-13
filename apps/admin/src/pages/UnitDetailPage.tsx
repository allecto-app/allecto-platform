import { useState } from "react";
import { Trash2, Edit, UserPlus } from "lucide-react";
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
import { Id } from "../lib/convexGenerated";

interface UnitDetailPageProps {
  onNavigate: (page: string) => void;
  condoId: Id<"condos"> | null;
}

// Mock data for the unit
const unit = {
  id: 1,
  code: "101",
  block: "A",
  floor: "1",
  condo: "Jardim das Flores",
  createdAt: "01/11/2024",
  updatedAt: "05/01/2025",
};

const linkedResidents = [
  {
    id: 1,
    name: "João Silva",
    email: "joao@example.com",
    phone: "(11) 99999-0001",
    role: "owner",
  },
  {
    id: 2,
    name: "Maria Silva",
    email: "maria@example.com",
    phone: "(11) 99999-0002",
    role: "tenant",
  },
];

const recentVotes = [
  {
    id: 1,
    minute: "Ata de Assembleia Ordinária 2025",
    date: "10/01/2025 14:30",
    choice: "agree",
    comment: "Concordo com a proposta",
  },
  {
    id: 2,
    minute: "Ata Extraordinária - Obras na Piscina",
    date: "05/01/2025 16:15",
    choice: "disagree",
    comment: "Valores acima do esperado",
  },
  {
    id: 3,
    minute: "Ata Ordinária - Dezembro 2024",
    date: "01/12/2024 11:20",
    choice: "agree",
    comment: "",
  },
];

const availableResidents = [
  { id: 3, name: "Pedro Oliveira", email: "pedro@example.com" },
  { id: 4, name: "Ana Costa", email: "ana@example.com" },
  { id: 5, name: "Carlos Lima", email: "carlos@example.com" },
];

export function UnitDetailPage({ onNavigate }: UnitDetailPageProps) {
  const [linkResidentOpen, setLinkResidentOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedResident, setSelectedResident] = useState("");
  const [selectedRole, setSelectedRole] = useState("");

  const handleDelete = () => {
    toast.success("Unidade excluída com sucesso!");
    onNavigate("units");
  };

  const handleEdit = () => {
    onNavigate("unit-edit");
  };

  const handleLinkResident = () => {
    if (selectedResident && selectedRole) {
      const resident = availableResidents.find((r) => r.id.toString() === selectedResident);
      toast.success(
        `${resident?.name} vinculado como ${selectedRole === "owner" ? "proprietário" : "inquilino"}`
      );
      setLinkResidentOpen(false);
      setSelectedResident("");
      setSelectedRole("");
      setSearchTerm("");
    }
  };

  const handleUnlinkResident = (name: string) => {
    toast.success(`${name} desvinculado com sucesso!`);
  };

  const handleChangeRole = (name: string, newRole: string) => {
    toast.success(
      `${name} agora é ${newRole === "owner" ? "proprietário" : "inquilino"}`
    );
  };

  const filteredResidents = availableResidents.filter((resident) =>
    resident.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resident.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title={`Bloco ${unit.block} - ${unit.code}`}
        breadcrumb={["Unidades", `${unit.block}-${unit.code}`]}
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
                  <Badge variant="outline">Bloco {unit.block}</Badge>
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Andar</div>
                <div>{unit.floor}º Andar</div>
              </div>
              <div>
                <div className="text-muted-foreground">Condomínio</div>
                <div>
                  <Badge variant="outline">{unit.condo}</Badge>
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Criado em</div>
                <div>{unit.createdAt}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Atualizado em</div>
                <div>{unit.updatedAt}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Moradores Vinculados</CardTitle>
              <Button onClick={() => setLinkResidentOpen(true)}>
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
                    {linkedResidents.map((resident) => (
                      <TableRow key={resident.id}>
                        <TableCell>{resident.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {resident.email}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {resident.phone}
                        </TableCell>
                        <TableCell>
                          {resident.role === "owner" ? (
                            <Badge>Proprietário</Badge>
                          ) : (
                            <Badge variant="secondary">Inquilino</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleChangeRole(
                                  resident.name,
                                  resident.role === "owner" ? "tenant" : "owner"
                                )
                              }
                            >
                              {resident.role === "owner"
                                ? "Tornar Inquilino"
                                : "Tornar Proprietário"}
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  Desvincular
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Desvincular Morador</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja desvincular {resident.name}?
                                    O morador perderá acesso a esta unidade.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleUnlinkResident(resident.name)}
                                  >
                                    Desvincular
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
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
              {recentVotes.length === 0 ? (
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
                    {recentVotes.map((vote) => (
                      <TableRow key={vote.id}>
                        <TableCell>{vote.minute}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {vote.date}
                        </TableCell>
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
                      Tem certeza que deseja excluir a unidade {unit.code}? Esta ação
                      não pode ser desfeita. Todos os moradores vinculados perderão
                      acesso.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Excluir
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resident-select">Morador</Label>
              <Select value={selectedResident} onValueChange={setSelectedResident}>
                <SelectTrigger id="resident-select">
                  <SelectValue placeholder="Selecione um morador" />
                </SelectTrigger>
                <SelectContent>
                  {filteredResidents.map((resident) => (
                    <SelectItem key={resident.id} value={resident.id.toString()}>
                      {resident.name} - {resident.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-select">Tipo de Vínculo</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
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
              disabled={!selectedResident || !selectedRole}
            >
              Vincular
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
