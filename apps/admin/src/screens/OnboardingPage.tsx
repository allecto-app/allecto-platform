import { useState } from "react";
import { useMutation } from "convex/react";
import { Upload } from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { api, Id } from "../lib/convexGenerated";

interface OnboardingPageProps {
  onNavigate: (page: string) => void;
  onSelectCondo: (condoId: Id<"condos">) => void;
  sessionToken: string;
}

export function OnboardingPage({ onNavigate, onSelectCondo, sessionToken }: OnboardingPageProps) {
  const [condoName, setCondoName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#042940");
  const [secondaryColor, setSecondaryColor] = useState("#9FC131");
  const [accentColor, setAccentColor] = useState("#005C53");
  const [syndicName, setSyndicName] = useState("");
  const [syndicEmail, setSyndicEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createCondo = useMutation(api.platform.createCondo);

  const handleCreate = async () => {
    if (!condoName || !subdomain || !syndicName || !syndicEmail) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (!sessionToken) {
      toast.error("Sessão expirada. Faça login novamente.");
      return;
    }

    try {
      setIsSubmitting(true);
      const { condoId } = await createCondo({
        sessionToken,
        name: condoName,
        subdomain,
        branding: {
          displayName: condoName,
          primaryColor,
          secondaryColor,
          accentColor,
        },
        syndicEmail,
        syndicName,
      });

      toast.success(`Condomínio ${condoName} criado com sucesso!`);
      onSelectCondo(condoId);
      onNavigate("dashboard");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao criar o condomínio";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Criar Condomínio"
        breadcrumb={["Allecto App", "Criar Condomínio"]}
        secondaryAction={{
          label: "Cancelar",
          onClick: () => onNavigate("tenants"),
        }}
      />

      <div className="space-y-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Condomínio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="condo-name">Nome do Condomínio *</Label>
                <Input
                  id="condo-name"
                  value={condoName}
                  onChange={(e) => setCondoName(e.target.value)}
                  placeholder="e.g., Jardim das Flores"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subdomain">Subdomínio *</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="subdomain"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value)}
                    placeholder="jardim-flores"
                    required
                  />
                  <span className="text-muted-foreground whitespace-nowrap">
                    .allecto.app
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Branding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="logo">Logo</Label>
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted">
                  <span className="text-muted-foreground">Logo</span>
                </div>
                <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </Button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="primary-color">Cor Primária</Label>
                <div className="flex gap-2">
                  <div
                    className="h-10 w-10 rounded-md border border-border shrink-0"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <Input
                    id="primary-color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondary-color">Cor Secundária</Label>
                <div className="flex gap-2">
                  <div
                    className="h-10 w-10 rounded-md border border-border shrink-0"
                    style={{ backgroundColor: secondaryColor }}
                  />
                  <Input
                    id="secondary-color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="accent-color">Cor de Destaque</Label>
                <div className="flex gap-2">
                  <div
                    className="h-10 w-10 rounded-md border border-border shrink-0"
                    style={{ backgroundColor: accentColor }}
                  />
                  <Input
                    id="accent-color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informações do Síndico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="syndic-name">Nome do Síndico *</Label>
                <Input
                  id="syndic-name"
                  value={syndicName}
                  onChange={(e) => setSyndicName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="syndic-email">E-mail do Síndico *</Label>
                <Input
                  id="syndic-email"
                  type="email"
                  value={syndicEmail}
                  onChange={(e) => setSyndicEmail(e.target.value)}
                  placeholder="sindico@exemplo.com"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onNavigate("tenants")} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={isSubmitting}>
            {isSubmitting ? "Criando..." : "Criar Condomínio"}
          </Button>
        </div>
      </div>
    </div>
  );
}
