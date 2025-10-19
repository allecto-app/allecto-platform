 "use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Search, Mail, Building2, Loader2 } from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
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
import { Id, api } from "../lib/convexGenerated";

interface SupportPageProps {
  onNavigate: (page: string) => void;
  onSelectCondo: (condoId: Id<"condos">) => void;
}

export function SupportPage({ onNavigate, onSelectCondo }: SupportPageProps) {
  const [searchInput, setSearchInput] = useState("");
  const [queryEmail, setQueryEmail] = useState<string | null>(null);

  const resident = useQuery(
    api.residents.findByEmail,
    queryEmail ? { email: queryEmail } : "skip",
  );
  const resendOtp = useMutation(api.auth.requestResidentOtp);

  const trimmedInput = searchInput.trim().toLowerCase();
  const isLoading = queryEmail !== null && resident === undefined;
  const currentResident = resident ?? null;

  useEffect(() => {
    if (!queryEmail) return;
    if (resident === undefined) return;
    if (resident) {
      toast.success("Residente encontrado");
    } else {
      toast.error("Nenhum residente encontrado para este email");
    }
  }, [resident, queryEmail]);

  const handleFindResident = () => {
    if (!trimmedInput) {
      toast.error("Informe um email para buscar");
      return;
    }
    setQueryEmail(trimmedInput);
  };

  const handleResendOTP = async () => {
    if (!currentResident) {
      toast.error("Residente não encontrado");
      return;
    }
    if (!currentResident.condoSubdomain || !currentResident.email) {
      toast.error("Dados insuficientes para reenviar OTP");
      return;
    }
    try {
      await resendOtp({
        subdomain: currentResident.condoSubdomain,
        email: currentResident.email,
      });
      toast.success("OTP reenviado com sucesso");
    } catch (error) {
      console.error("Failed to resend OTP", error);
      toast.error("Não foi possível reenviar o OTP");
    }
  };

  const handleEnterTenantView = () => {
    if (!currentResident || !currentResident.condoId) {
      toast.error("Condomínio não disponível");
      return;
    }
    onSelectCondo(currentResident.condoId as Id<"condos">);
    onNavigate("dashboard");
    toast.success(
      `Entrando no condomínio ${currentResident.condoName ?? currentResident.condoSubdomain ?? ""}`,
    );
  };

  return (
    <div>
      <PageHeader title="Suporte" breadcrumb={["Allecto App", "Suporte"]} />

      <div className="space-y-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Encontrar Usuário</CardTitle>
            <CardDescription>
              Procure um morador em todos os condomínios para dar suporte
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search-email">E-mail</Label>
              <div className="flex gap-2">
                <Input
                  id="search-email"
                  type="email"
                  placeholder="resident@example.com"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                <Button onClick={handleFindResident} disabled={isLoading || !trimmedInput}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="mr-2 h-4 w-4" />
                  )}
                  Buscar
                </Button>
              </div>
            </div>

            {queryEmail && resident === undefined && (
              <Card className="bg-muted/50">
                <CardContent className="flex items-center gap-2 py-6 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Buscando residente...
                </CardContent>
              </Card>
            )}

            {queryEmail && resident === null && (
              <Card className="bg-muted/50">
                <CardContent className="py-6 text-center text-muted-foreground">
                  Nenhum residente encontrado para {queryEmail}.
                </CardContent>
              </Card>
            )}

            {currentResident && (
              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-muted-foreground">Nome</div>
                        <div>{currentResident.name}</div>
                      </div>
                      <Badge>{currentResident.isActive ? "Active" : "Inactive"}</Badge>
                    </div>
                    <div>
                      <div className="text-muted-foreground">E-mail</div>
                      <div>{currentResident.email ?? "-"}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Condomínio</div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {currentResident.condoName ?? "Condomínio"}
                        </Badge>
                        {currentResident.condoSubdomain && (
                          <span className="text-muted-foreground">
                            ({currentResident.condoSubdomain})
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEnterTenantView}
                        disabled={!currentResident.condoId}
                      >
                        <Building2 className="mr-2 h-4 w-4" />
                        Entrar na visualização do locatário
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!currentResident.email || !currentResident.condoSubdomain}
                          >
                            <Mail className="mr-2 h-4 w-4" />
                            Re-enviar código OTP
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Re-enviar código OTP</AlertDialogTitle>
                            <AlertDialogDescription>
                              Isso enviará uma nova senha de uso único para {" "}
                              {currentResident.email}. Continuar?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleResendOTP}>
                              Enviar OTP
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ações</CardTitle>
            <CardDescription>
              Operações de suporte comuns
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => onNavigate("tenants")}
            >
              <Building2 className="mr-2 h-4 w-4" />
              Vizualizar todos os condomínios
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => onNavigate("audit")}
            >
              <Search className="mr-2 h-4 w-4" />
              Exibir log de auditoria global
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
