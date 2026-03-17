import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useQuery } from "convex/react";
import { PageHeader } from "../components/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { SettingsBrandingPage } from "./SettingsBrandingPage";
import { SettingsCondoPage } from "./SettingsCondoPage";
import { SettingsApiPage } from "./SettingsApiPage";
import { api, Doc } from "../lib/convexGenerated";

interface SettingsPageProps {
  condo: Doc<"condos"> | null;
  sessionToken: string;
  canManageExternalApi?: boolean;
  onBrandingApplied?: (branding: Doc<"condos">["branding"] | null | undefined) => void;
  onCondoUpdated?: (condo: Doc<"condos">) => void;
}

export function SettingsPage({
  condo,
  sessionToken,
  canManageExternalApi = false,
  onBrandingApplied,
  onCondoUpdated,
}: SettingsPageProps) {
  const condoId = condo?._id ?? null;

  const detail = useQuery(
    api.condos.getAdmin,
    condoId ? { sessionToken, condoId } : "skip",
  ) as Doc<"condos"> | null | undefined;

  const isLoading = condoId !== null && detail === undefined;
  const fallbackCondo = useMemo(() => detail ?? condo ?? null, [detail, condo]);
  const [editableCondo, setEditableCondo] = useState<Doc<"condos"> | null>(fallbackCondo);

  useEffect(() => {
    setEditableCondo((prev) => {
      if (!fallbackCondo) return null;
      if (!prev) return fallbackCondo;
      if (prev._id !== fallbackCondo._id) {
        return fallbackCondo;
      }
      if (prev.updatedAt !== fallbackCondo.updatedAt) {
        return fallbackCondo;
      }
      return prev;
    });
  }, [
    fallbackCondo?._id,
    fallbackCondo?.updatedAt,
    fallbackCondo?.name,
    fallbackCondo?.timezone,
    fallbackCondo?.branding?.logoUrl,
    fallbackCondo?.branding?.primaryColor,
    fallbackCondo?.branding?.secondaryColor,
    fallbackCondo?.branding?.accentColor,
    fallbackCondo?.branding?.displayName,
    fallbackCondo?.isActive,
    fallbackCondo?.disabledAt,
  ]);

  const currentCondo = editableCondo ?? fallbackCondo;

  if (!condoId) {
    return (
      <div>
        <PageHeader title="Configurações" />
        <div className="rounded-md border border-dashed border-border p-8 text-center text-muted-foreground">
          Selecione um condomínio para gerenciar as configurações.
        </div>
      </div>
    );
  }

  if (isLoading && !currentCondo) {
    return (
      <div className="flex h-full items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando configurações...
      </div>
    );
  }

  if (!currentCondo) {
    return (
      <div>
        <PageHeader title="Configurações" />
        <div className="rounded-md border border-dashed border-border p-8 text-center text-muted-foreground">
          Não foi possível carregar os dados do condomínio selecionado.
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Configurações" />

      <Tabs defaultValue="branding" className="space-y-6">
        <TabsList>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="condo">Condomínio</TabsTrigger>
          {canManageExternalApi ? <TabsTrigger value="api">API</TabsTrigger> : null}
        </TabsList>
        <TabsContent value="branding">
          <SettingsBrandingPage
            condoId={currentCondo._id}
            sessionToken={sessionToken}
            branding={currentCondo.branding}
            onBrandingApplied={onBrandingApplied}
            onCondoUpdated={(updated) => {
              setEditableCondo(updated);
              onCondoUpdated?.(updated);
            }}
          />
        </TabsContent>
        <TabsContent value="condo">
          <SettingsCondoPage
            condo={currentCondo}
            sessionToken={sessionToken}
            onCondoUpdated={(updated) => {
              setEditableCondo(updated);
              onCondoUpdated?.(updated);
            }}
          />
        </TabsContent>
        {canManageExternalApi ? (
          <TabsContent value="api">
            <SettingsApiPage condo={currentCondo} />
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
}
