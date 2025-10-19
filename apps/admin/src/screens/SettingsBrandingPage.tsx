import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { Upload, Trash2, Image as ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { api, Doc, Id } from "../lib/convexGenerated";
import { DEFAULT_BRANDING_COLORS } from "../lib/brandingTheme";

interface SettingsBrandingPageProps {
  condoId: Id<"condos">;
  branding: Doc<"condos">["branding"];
  onBrandingApplied?: (branding: Doc<"condos">["branding"] | null | undefined) => void;
  onCondoUpdated?: (condo: Doc<"condos">) => void;
}

type PendingLogoState = {
  storageId: string | null;
  previewUrl: string | null;
} | null;

const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2MB

export function SettingsBrandingPage({
  condoId,
  branding,
  onBrandingApplied,
  onCondoUpdated,
}: SettingsBrandingPageProps) {
  const [displayName, setDisplayName] = useState(branding?.displayName ?? "");
  const [primaryColor, setPrimaryColor] = useState(branding?.primaryColor ?? DEFAULT_BRANDING_COLORS.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(
    branding?.secondaryColor ?? DEFAULT_BRANDING_COLORS.secondaryColor,
  );
  const [accentColor, setAccentColor] = useState(branding?.accentColor ?? DEFAULT_BRANDING_COLORS.accentColor);
  const [logoPreview, setLogoPreview] = useState<string | null>(branding?.logoUrl ?? null);
  const [pendingLogo, setPendingLogo] = useState<PendingLogoState>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const uploadUrlMutation = useMutation(api.condos.generateLogoUploadUrl);
  const updateBrandingMutation = useMutation(api.condos.updateBranding);

  const logoObjectUrlRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const openFileSelector = () => {
    fileInputRef.current?.click();
  };

  useEffect(() => {
    setDisplayName(branding?.displayName ?? "");
    setPrimaryColor(branding?.primaryColor ?? DEFAULT_BRANDING_COLORS.primaryColor);
    setSecondaryColor(branding?.secondaryColor ?? DEFAULT_BRANDING_COLORS.secondaryColor);
    setAccentColor(branding?.accentColor ?? DEFAULT_BRANDING_COLORS.accentColor);
    setLogoPreview(branding?.logoUrl ?? null);
    setPendingLogo(null);
  }, [branding?.displayName, branding?.primaryColor, branding?.secondaryColor, branding?.accentColor, branding?.logoUrl]);

  useEffect(() => {
    return () => {
      if (logoObjectUrlRef.current) {
        URL.revokeObjectURL(logoObjectUrlRef.current);
      }
    };
  }, []);

  const currentLogoPreview = useMemo(() => {
    if (pendingLogo) {
      return pendingLogo.previewUrl;
    }
    return logoPreview;
  }, [logoPreview, pendingLogo]);

  const handleLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_LOGO_SIZE) {
      toast.error("O arquivo excede o limite de 2MB");
      return;
    }

    setIsUploading(true);
    try {
      const { uploadUrl } = await uploadUrlMutation({});
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!response.ok) {
        throw new Error("Upload falhou");
      }

      const json = (await response.json()) as { storageId?: string };
      if (!json.storageId) {
        throw new Error("Resposta inválida do armazenamento");
      }

      if (logoObjectUrlRef.current) {
        URL.revokeObjectURL(logoObjectUrlRef.current);
      }
      const objectUrl = URL.createObjectURL(file);
      logoObjectUrlRef.current = objectUrl;
      setPendingLogo({ storageId: json.storageId, previewUrl: objectUrl });
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível carregar o logo");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const handleRemoveLogo = () => {
    if (logoObjectUrlRef.current) {
      URL.revokeObjectURL(logoObjectUrlRef.current);
      logoObjectUrlRef.current = null;
    }
    setPendingLogo({ storageId: null, previewUrl: null });
  };

  const handleSave = async () => {
    if (!condoId) return;
    setIsSaving(true);
    try {
      const payload: Record<string, unknown> = {
        displayName: displayName.trim() || undefined,
        primaryColor: primaryColor.trim(),
        secondaryColor: secondaryColor.trim(),
        accentColor: accentColor.trim(),
      };

      if (pendingLogo) {
        payload.logoStorageId = pendingLogo.storageId;
      }

      const updated = (await updateBrandingMutation({
        condoId,
        branding: payload,
      })) as Doc<"condos"> | null;

      const updatedBranding = updated?.branding;
      if (updatedBranding) {
        setLogoPreview(updatedBranding.logoUrl ?? null);
        setPendingLogo(null);
        onBrandingApplied?.(updatedBranding);
        if (updated) {
          onCondoUpdated?.(updated);
        }
        toast.success("Branding atualizado com sucesso");
      } else {
        toast.success("Branding atualizado");
      }
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível salvar as configurações");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Identidade Visual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border bg-muted">
              {currentLogoPreview ? (
                <img src={currentLogoPreview} alt="Logo do condomínio" className="h-full w-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-8 w-8" />
                  <span className="mt-2 text-sm">Sem logo</span>
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="logo">Logo do condomínio</Label>
              <div className="flex flex-wrap gap-2">
                <Input
                  ref={fileInputRef}
                  id="logo"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <Button type="button" variant="outline" onClick={openFileSelector} disabled={isUploading || isSaving}>
                  <Upload className="mr-2 h-4 w-4" />
                  {isUploading ? "Enviando..." : "Selecionar"}
                </Button>
                {currentLogoPreview && (
                  <Button type="button" variant="ghost" onClick={handleRemoveLogo} disabled={isUploading || isSaving}>
                    <Trash2 className="mr-2 h-4 w-4" /> Remover
                  </Button>
                )}
              </div>
              <p className="text-muted-foreground text-sm">
                Formatos aceitos: PNG, JPG, SVG. Tamanho máximo: 2MB.
              </p>
              <div className="space-y-2 pt-2">
                <Label htmlFor="display-name">Nome de Exibição</Label>
                <Input
                  id="display-name"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Nome do condomínio exibido aos moradores"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cores da Marca</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="primary-color">Cor Primária</Label>
              <div className="flex gap-2">
                <div className="h-10 w-10 shrink-0 rounded-md border border-border" style={{ backgroundColor: primaryColor }} />
                <Input id="primary-color" type="text" value={primaryColor} onChange={(event) => setPrimaryColor(event.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondary-color">Cor Secundária</Label>
              <div className="flex gap-2">
                <div className="h-10 w-10 shrink-0 rounded-md border border-border" style={{ backgroundColor: secondaryColor }} />
                <Input id="secondary-color" type="text" value={secondaryColor} onChange={(event) => setSecondaryColor(event.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accent-color">Cor de Destaque</Label>
              <div className="flex gap-2">
                <div className="h-10 w-10 shrink-0 rounded-md border border-border" style={{ backgroundColor: accentColor }} />
                <Input id="accent-color" type="text" value={accentColor} onChange={(event) => setAccentColor(event.target.value)} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prévia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-md" style={{ backgroundColor: primaryColor }}>
                <span className="text-white">A</span>
              </div>
              <span className="text-foreground">{displayName || "Allecto Admin"}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button style={{ backgroundColor: primaryColor, color: "#FFFFFF" }}>Primário</Button>
              <Button style={{ backgroundColor: secondaryColor, color: "#1F2933" }}>Secundário</Button>
              <Button style={{ backgroundColor: accentColor, color: "#FFFFFF" }}>Destaque</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving || isUploading}>
          {isSaving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>
    </div>
  );
}
