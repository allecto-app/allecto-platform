import { useState } from "react";
import { UserX, UserCheck, Mail, Edit } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { Id } from "../lib/convexGenerated";

interface ResidentDetailPageProps {
  onNavigate: (page: string) => void;
  condoId: Id<"condos"> | null;
}

// Mock data for the resident
const resident = {
  id: 1,
  name: "João Silva",
  email: "joao@example.com",
  phone: "(11) 99999-0001",
  role: "Resident",
  status: "active",
  condo: "Jardim das Flores",
  createdAt: "15/12/2024",
  updatedAt: "08/01/2025",
};

const units = [
  { id: 1, code: "101", block: "A", role: "owner" },
  { id: 2, code: "102", block: "A", role: "tenant" },
];

const activities = [
  { id: 1, event: "Voto registrado", description: "Ata de Assembleia Ordinária 2025", date: "10/01/2025 14:30", type: "vote" },
  { id: 2, event: "OTP enviado", description: "Código de acesso via SMS", date: "05/01/2025 09:15", type: "otp" },
  { id: 3, event: "Convite aceito", description: "Primeiro acesso ao sistema", date: "02/01/2025 16:45", type: "invite" },
  { id: 4, event: "Convite enviado", description: "Email de convite para morador", date: "01/01/2025 10:00", type: "invite" },
];

const availableUnits = [
  { code: "201", block: "A" },
  { code: "202", block: "A" },
  { code: "301", block: "B" },
  { code: "302", block: "B" },
];

export function ResidentDetailPage({ onNavigate }: ResidentDetailPageProps) {
  const [linkUnitOpen, setLinkUnitOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [residentStatus, setResidentStatus] = useState(resident.status);

  const handleDeactivate = () => {
    setResidentStatus("inactive");
    toast.success("Morador desativado com sucesso!");
  };

  const handleReactivate = () => {
    setResidentStatus("active");
    toast.success("Morador reativado com sucesso!");
  };

  const handleInviteAgain = () => {
    toast.success("Convite reenviado com sucesso!");
  };

  const handleLinkUnit = () => {
    if (selectedUnit && selectedRole) {
      toast.success(`Unidade ${selectedUnit} vinculada como ${selectedRole === "owner" ? "proprietário" : "inquilino"}`);
      setLinkUnitOpen(false);
      setSelectedUnit("");
      setSelectedRole("");
    }
  };

  const handleUnlinkUnit = (unitCode: string) => {
    toast.success(`Unidade ${unitCode} desvinculada com sucesso!`);
  };

  const handleEdit = () => {
    onNavigate("resident-edit");
  };

  return (
    <div>
      <PageHeader
        title={resident.name}
        breadcrumb={["Moradores", resident.name]}
        primaryAction={{
          label: "Editar",
          onClick: handleEdit,
        }}
        secondaryAction={{
          label: "Convidar Novamente",
          onClick: handleInviteAgain,
        }}
      />

      {residentStatus === "inactive" && (
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
                <div>{resident.name}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Email</div>
                <div>{resident.email}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Telefone</div>
                <div>{resident.phone}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Condomínio</div>
                <div>
                  <Badge variant="outline">{resident.condo}</Badge>
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Função</div>
                <div>
                  <Badge variant={resident.role === "Manager" ? "default" : "secondary"}>
                    {resident.role}
                  </Badge>
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Status</div>
                <div>
                  {residentStatus === "active" ? (
                    <Badge>Ativo</Badge>
                  ) : (
                    <Badge variant="secondary">Inativo</Badge>
                  )}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Criado em</div>
                <div>{resident.createdAt}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Atualizado em</div>
                <div>{resident.updatedAt}</div>
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
                      <TableRow key={unit.id}>
                        <TableCell>{unit.code}</TableCell>
                        <TableCell>
                          <Badge variant="outline">Bloco {unit.block}</Badge>
                        </TableCell>
                        <TableCell>
                          {unit.role === "owner" ? (
                            <Badge>Proprietário</Badge>
                          ) : (
                            <Badge variant="secondary">Inquilino</Badge>
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
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="border-l-2 border-border pl-4 pb-4 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div>{activity.event}</div>
                        <div className="text-muted-foreground">{activity.description}</div>
                      </div>
                      {activity.type === "vote" && <Badge variant="outline">Voto</Badge>}
                      {activity.type === "otp" && <Badge variant="secondary">OTP</Badge>}
                      {activity.type === "invite" && <Badge>Convite</Badge>}
                    </div>
                    <div className="mt-1 text-muted-foreground">{activity.date}</div>
                  </div>
                ))}
              </div>
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
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="unit-select">Unidade</Label>
              <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                <SelectTrigger id="unit-select">
                  <SelectValue placeholder="Selecione uma unidade" />
                </SelectTrigger>
                <SelectContent>
                  {availableUnits.map((unit) => (
                    <SelectItem key={unit.code} value={unit.code}>
                      Bloco {unit.block} - {unit.code}
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
              onClick={handleLinkUnit}
              className="w-full"
              disabled={!selectedUnit || !selectedRole}
            >
              Vincular
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
