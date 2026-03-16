import { useEffect, useMemo, useState } from "react";
import { Copy, KeyRound, RefreshCw, ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Doc, Id } from "../lib/convexGenerated";
import { cn } from "../components/ui/utils";

const AVAILABLE_SCOPES = [
  "units:read",
  "units:write",
  "residents:read",
  "residents:write",
  "minutes:read",
  "minutes:write",
  "minutes:close",
  "minutes:result:read",
] as const;

type ExternalApiKeyItem = {
  _id: Id<"externalApiKeys">;
  name: string | null;
  keyPrefix: string;
  scopes: string[];
  allowedIps: string[];
  status: "active" | "revoked";
  createdAt: number;
  updatedAt: number;
  lastUsedAt: number | null;
  expiresAt: number | null;
  revokedAt: number | null;
};

interface SettingsApiPageProps {
  condo: Doc<"condos">;
}

function formatDate(value: number | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export function SettingsApiPage({ condo }: SettingsApiPageProps) {
  const [keys, setKeys] = useState<ExternalApiKeyItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyExpiresAt, setNewKeyExpiresAt] = useState("");
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>([...AVAILABLE_SCOPES]);
  const [allowedIpsRaw, setAllowedIpsRaw] = useState("");
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    keyId: string;
    apiKey: string;
    apiSecret: string;
  } | null>(null);

  const hasActiveKey = useMemo(() => keys.some((item) => item.status === "active"), [keys]);

  const loadKeys = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/external/keys?condoId=${encodeURIComponent(String(condo._id))}`, {
        method: "GET",
        credentials: "same-origin",
      });
      const payload = (await response.json()) as { ok?: boolean; items?: ExternalApiKeyItem[]; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Não foi possível carregar chaves de API");
      }
      setKeys(payload.items ?? []);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Não foi possível carregar chaves de API");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadKeys();
  }, [condo._id]);

  const handleCreateKey = async () => {
    setIsCreating(true);
    try {
      const expiresMs = newKeyExpiresAt ? new Date(newKeyExpiresAt).getTime() : undefined;
      const response = await fetch("/api/external/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          condoId: condo._id,
          name: newKeyName.trim() || undefined,
          expiresAt: expiresMs,
          scopes: newKeyScopes,
          allowedIps: allowedIpsRaw
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean),
        }),
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        keyId?: string;
        apiKey?: string;
        apiSecret?: string;
      };

      if (!response.ok || !payload.ok || !payload.apiKey || !payload.apiSecret || !payload.keyId) {
        throw new Error(payload.error ?? "Não foi possível gerar chave de API");
      }

      setGeneratedCredentials({
        keyId: payload.keyId,
        apiKey: payload.apiKey,
        apiSecret: payload.apiSecret,
      });
      setNewKeyName("");
      setNewKeyExpiresAt("");
      setNewKeyScopes([...AVAILABLE_SCOPES]);
      setAllowedIpsRaw("");
      toast.success("Chave de API criada. Copie o segredo agora.");
      await loadKeys();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Não foi possível gerar chave de API");
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevoke = async (keyId: string) => {
    try {
      const response = await fetch(`/api/external/keys/${encodeURIComponent(keyId)}/revoke`, {
        method: "POST",
        credentials: "same-origin",
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Não foi possível revogar a chave");
      }
      toast.success("Chave revogada.");
      await loadKeys();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Não foi possível revogar a chave");
    }
  };

  const copyText = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copiado.`);
    } catch {
      toast.error(`Não foi possível copiar ${label.toLowerCase()}.`);
    }
  };

  const toggleScope = (scope: string) => {
    setNewKeyScopes((prev) => {
      if (prev.includes(scope)) {
        return prev.filter((item) => item !== scope);
      }
      return [...prev, scope];
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>External API (Plano Pro)</CardTitle>
          <CardDescription>
            Gere credenciais para integrações externas do condomínio. A autenticação usa `apiKey + apiSecret`
            para obter um token no endpoint `/api/external/token`.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="api-key-name">Nome da chave (opcional)</Label>
              <Input
                id="api-key-name"
                value={newKeyName}
                onChange={(event) => setNewKeyName(event.target.value)}
                placeholder="Ex: ERP do condomínio"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="api-key-expiration">Expira em (opcional)</Label>
              <Input
                id="api-key-expiration"
                type="datetime-local"
                value={newKeyExpiresAt}
                onChange={(event) => setNewKeyExpiresAt(event.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Escopos da chave</Label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_SCOPES.map((scope) => {
                const selected = newKeyScopes.includes(scope);
                return (
                  <Button
                    key={scope}
                    type="button"
                    variant={selected ? "default" : "outline"}
                    size="sm"
                    className={cn("h-8")}
                    onClick={() => toggleScope(scope)}
                  >
                    {scope}
                  </Button>
                );
              })}
            </div>
            <p className="text-muted-foreground text-xs">Selecione apenas os acessos necessários para a integração.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="api-key-allow-ips">Allowlist de IPs (opcional)</Label>
            <Input
              id="api-key-allow-ips"
              value={allowedIpsRaw}
              onChange={(event) => setAllowedIpsRaw(event.target.value)}
              placeholder="Ex: 203.0.113.5, 198.51.100.10"
            />
            <p className="text-muted-foreground text-xs">
              Se informado, o token só funciona para os IPs listados (separados por vírgula).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => void handleCreateKey()} disabled={isCreating || newKeyScopes.length === 0}>
              <KeyRound className="mr-2 h-4 w-4" />
              {isCreating ? "Gerando..." : "Gerar nova chave"}
            </Button>
            <Button variant="outline" onClick={() => void loadKeys()} disabled={isLoading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
            <Button variant="outline" asChild>
              <a href="/external-api/docs" target="_blank" rel="noreferrer">
                Swagger/OpenAPI
              </a>
            </Button>
          </div>

          {!hasActiveKey && (
            <div className="rounded-md border border-amber-400/50 bg-amber-50 p-3 text-sm text-amber-900">
              <ShieldAlert className="mr-2 inline h-4 w-4" />
              Nenhuma chave ativa no momento.
            </div>
          )}
        </CardContent>
      </Card>

      {generatedCredentials && (
        <Card className="border-primary/40">
          <CardHeader>
            <CardTitle>Credenciais geradas</CardTitle>
            <CardDescription>
              O segredo é exibido apenas agora. Salve em local seguro para usar no `/api/external/token`.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>API Key</Label>
              <div className="flex gap-2">
                <Input value={generatedCredentials.apiKey} readOnly />
                <Button variant="outline" onClick={() => void copyText(generatedCredentials.apiKey, "API Key")}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>API Secret</Label>
              <div className="flex gap-2">
                <Input value={generatedCredentials.apiSecret} readOnly />
                <Button
                  variant="outline"
                  onClick={() => void copyText(generatedCredentials.apiSecret, "API Secret")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Chaves existentes</CardTitle>
          <CardDescription>Somente o prefixo da chave é armazenado para visualização.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-muted-foreground text-sm">Carregando...</div>
          ) : keys.length === 0 ? (
            <div className="text-muted-foreground text-sm">Nenhuma chave cadastrada.</div>
          ) : (
            <div className="space-y-3">
              {keys.map((key) => (
                <div key={String(key._id)} className="rounded-lg border p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{key.name || "Sem nome"}</div>
                      <div className="text-muted-foreground text-sm">Prefixo: {key.keyPrefix}...</div>
                    </div>
                    <Badge variant={key.status === "active" ? "default" : "secondary"}>
                      {key.status === "active" ? "Ativa" : "Revogada"}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground mt-2 grid gap-1 text-xs md:grid-cols-3">
                    <div>Criada: {formatDate(key.createdAt)}</div>
                    <div>Último uso: {formatDate(key.lastUsedAt)}</div>
                    <div>Expira em: {formatDate(key.expiresAt)}</div>
                  </div>
                  <div className="text-muted-foreground mt-2 text-xs">
                    Escopos: {key.scopes.join(", ")}
                    {key.allowedIps.length > 0 ? ` • IPs: ${key.allowedIps.join(", ")}` : ""}
                  </div>
                  {key.status === "active" && (
                    <div className="mt-3 flex justify-end">
                      <Button variant="destructive" size="sm" onClick={() => void handleRevoke(String(key._id))}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Revogar
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
