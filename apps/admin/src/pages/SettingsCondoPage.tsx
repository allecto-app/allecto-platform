import { useState } from "react";
import { Copy, AlertTriangle } from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
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
import { toast } from "sonner";

export function SettingsCondoPage() {
  const [name, setName] = useState("Condomínio Jardim das Flores");
  const [subdomain, setSubdomain] = useState("jardim-flores");
  const [timezone, setTimezone] = useState("America/Sao_Paulo");

  const handleCopy = () => {
    navigator.clipboard.writeText(`${subdomain}.allecto.app`);
    toast.success("Subdomínio copiado!");
  };

  const handleSave = () => {
    toast.success("Configurações salvas com sucesso!");
  };

  const handleDisable = () => {
    toast.warning("Condomínio desabilitado");
  };

  return (
    <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Condomínio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subdomain">Subdomínio</Label>
              <div className="flex gap-2">
                <Input
                  id="subdomain"
                  value={`${subdomain}.allecto.app`}
                  readOnly
                  className="bg-muted"
                />
                <Button variant="outline" onClick={handleCopy}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-muted-foreground">
                Este é o endereço que os moradores usarão para acessar o sistema
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Fuso Horário</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger id="timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/Sao_Paulo">
                    (GMT-3) São Paulo
                  </SelectItem>
                  <SelectItem value="America/Rio_Branco">
                    (GMT-5) Rio Branco
                  </SelectItem>
                  <SelectItem value="America/Manaus">
                    (GMT-4) Manaus
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-muted-foreground">
                Define os horários de fechamento de atas e envio de notificações
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave}>Salvar Alterações</Button>
        </div>

        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
            <CardDescription>
              Ações irreversíveis que afetam todo o condomínio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Desabilitar Condomínio
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso irá desabilitar
                    permanentemente o condomínio e todos os moradores perderão
                    acesso ao sistema.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDisable}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Sim, desabilitar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
    </div>
  );
}
