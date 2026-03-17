import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { Copy, AlertTriangle, CheckCircle2 } from "lucide-react";
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
import { api, Doc } from "../lib/convexGenerated";
import { Badge } from "../components/ui/badge";

interface SettingsCondoPageProps {
  condo: Doc<"condos">;
  sessionToken: string;
  onCondoUpdated?: (condo: Doc<"condos">) => void;
}

const TIMEZONE_OPTIONS = [
  { value: "America/Sao_Paulo", label: "(GMT-3) São Paulo" },
  { value: "America/Manaus", label: "(GMT-4) Manaus" },
  { value: "America/Cuiaba", label: "(GMT-4) Cuiabá" },
  { value: "America/Fortaleza", label: "(GMT-3) Fortaleza" },
  { value: "America/Rio_Branco", label: "(GMT-5) Rio Branco" },
];

export function SettingsCondoPage({ condo, sessionToken, onCondoUpdated }: SettingsCondoPageProps) {
  const [name, setName] = useState(condo.name);
  const [timezone, setTimezone] = useState(condo.timezone ?? "America/Sao_Paulo");
  const [isSaving, setIsSaving] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);

  const updateSettings = useMutation(api.condos.updateSettings);
  const disableCondo = useMutation(api.condos.disable);

  useEffect(() => {
    setName(condo.name);
    setTimezone(condo.timezone ?? "America/Sao_Paulo");
  }, [condo.name, condo.timezone]);

  const handleCopy = () => {
    const url = `${condo.subdomain}.allecto.app`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Subdomínio copiado!");
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = (await updateSettings({
        sessionToken,
        condoId: condo._id,
        name: name.trim(),
        timezone,
      })) as Doc<"condos"> | null;
      if (updated) {
        onCondoUpdated?.(updated);
      }
      toast.success("Configurações do condomínio atualizadas");
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível salvar as configurações");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisable = async () => {
    setIsDisabling(true);
    try {
      const result = (await disableCondo({ sessionToken, condoId: condo._id })) as
        | { success: boolean; condo?: Doc<"condos"> | null }
        | null;
      if (result?.success) {
        if (result.condo) {
          onCondoUpdated?.(result.condo);
        }
        toast.success("Condomínio desabilitado");
      } else {
        toast.info("O condomínio já está desabilitado");
      }
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível desabilitar o condomínio");
    } finally {
      setIsDisabling(false);
    }
  };

  const isActive = condo.isActive !== false;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Informações do Condomínio</CardTitle>
            <CardDescription>Edite dados administrativos do condomínio selecionado.</CardDescription>
          </div>
          <Badge variant={isActive ? "default" : "destructive"} className="flex items-center gap-1">
            {isActive ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
            {isActive ? "Ativo" : "Desabilitado"}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" value={name} onChange={(event) => setName(event.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subdomain">Subdomínio</Label>
            <div className="flex gap-2">
              <Input id="subdomain" value={condo.subdomain} readOnly className="bg-muted" />
              <Button variant="outline" onClick={handleCopy}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-muted-foreground text-sm">
              Este é o endereço que os moradores usarão para acessar o sistema
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Fuso Horário</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger id="timezone">
                <SelectValue placeholder="Selecione um fuso" />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-sm">
              Defina o fuso horário padrão para agendas e envio de notificações.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
          <CardDescription>Ações irreversíveis que afetam todo o condomínio.</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={!isActive || isDisabling}>
                <AlertTriangle className="mr-2 h-4 w-4" />
                {isActive ? "Desabilitar Condomínio" : "Condomínio Desabilitado"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Todos os moradores perderão acesso ao sistema.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDisable}
                  disabled={isDisabling}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDisabling ? "Desabilitando..." : "Sim, desabilitar"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
