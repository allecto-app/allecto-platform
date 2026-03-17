import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { Upload, Trash2, Image as ImageIcon } from "lucide-react";
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

type PendingLogoState = {
  storageId: string | null;
  previewUrl: string | null;
} | null;

const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2MB

export function OnboardingPage({ onNavigate, onSelectCondo, sessionToken }: OnboardingPageProps) {
  const [condoName, setCondoName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#042940");
  const [secondaryColor, setSecondaryColor] = useState("#9FC131");
  const [accentColor, setAccentColor] = useState("#005C53");
  const [syndicName, setSyndicName] = useState("");
  const [syndicEmail, setSyndicEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [logoState, setLogoState] = useState<PendingLogoState>(null);

  const createCondo = useMutation(api.platform.createCondo);
  const generateUploadUrl = useMutation(api.condos.generateLogoUploadUrl);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const logoPreview = useMemo(() => logoState?.previewUrl ?? null, [logoState?.previewUrl]);

  useEffect(() => {
    return () => {
      if (logoState?.previewUrl) {
        URL.revokeObjectURL(logoState.previewUrl);
      }
    };
  }, [logoState?.previewUrl]);

  const handleSelectLogo = () => {
    fileInputRef.current?.click();
  };

  const handleLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_LOGO_SIZE) {
      toast.error("O arquivo excede o limite de 2MB");
      return;
    }

    setIsUploading(true);
    try {
      const { uploadUrl } = await generateUploadUrl({ sessionToken });
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!response.ok) {
        throw new Error("Upload falhou");
      }
      const json = (await response.json()) as { storageId?: string };
      if (!json.storageId) {
        throw new Error("Resposta inválida do armazenamento");
      }

      if (logoState?.previewUrl) {
        URL.revokeObjectURL(logoState.previewUrl);
      }

      const objectUrl = URL.createObjectURL(file);
      setLogoState({ storageId: json.storageId, previewUrl: objectUrl });
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível fazer upload do logo");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const handleRemoveLogo = () => {
    if (logoState?.previewUrl) {
      URL.revokeObjectURL(logoState.previewUrl);
    }
    setLogoState({ storageId: null, previewUrl: null });
  };

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
          logoStorageId: logoState?.storageId ?? undefined,
        },
        syndicEmail,
        syndicName,
      });

      toast.success(`Condomínio ${condoName} criado com sucesso!`);
      onSelectCondo(condoId);
      onNavigate("dashboard");
    } catch (error) {
      console.error(error);
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
                  placeholder="Ex.: Jardim das Flores"
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
                  <span className="text-muted-foreground whitespace-nowrap">.allecto.app</span>
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
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border bg-muted">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo do condomínio" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <ImageIcon className="h-5 w-5" />
                      <span className="text-xs">Sem logo</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-wrap gap-2">
                  <Input
                    ref={fileInputRef}
                    id="logo"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                  <Button type="button" variant="outline" onClick={handleSelectLogo} disabled={isUploading || isSubmitting}>
                    <Upload className="mr-2 h-4 w-4" />
                    {isUploading ? "Enviando..." : "Selecionar logo"}
                  </Button>
                  {logoPreview && (
                    <Button type="button" variant="ghost" onClick={handleRemoveLogo} disabled={isUploading || isSubmitting}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remover
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Formatos aceitos: PNG, JPG, SVG. Tamanho máximo de 2MB.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="primary-color">Cor Primária</Label>
                <div className="flex gap-2">
                  <div className="h-10 w-10 shrink-0 rounded-md border border-border" style={{ backgroundColor: primaryColor }} />
                  <Input id="primary-color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondary-color">Cor Secundária</Label>
                <div className="flex gap-2">
                  <div className="h-10 w-10 shrink-0 rounded-md border border-border" style={{ backgroundColor: secondaryColor }} />
                  <Input id="secondary-color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="accent-color">Cor de Destaque</Label>
                <div className="flex gap-2">
                  <div className="h-10 w-10 shrink-0 rounded-md border border-border" style={{ backgroundColor: accentColor }} />
                  <Input id="accent-color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} />
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
                  placeholder="Nome completo"
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
          <Button variant="outline" onClick={() => onNavigate("tenants")} disabled={isSubmitting || isUploading}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={isSubmitting || isUploading}>
            {isSubmitting ? "Criando..." : "Criar Condomínio"}
          </Button>
        </div>
      </div>
    </div>
  );
}
