import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Loader2, PlayCircle, RefreshCw, ShieldCheck } from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { api, Doc, Id } from "../lib/convexGenerated";

type RetentionTarget =
  | "otps"
  | "invites"
  | "loginAttempts"
  | "sessions"
  | "passwordResets"
  | "notificationReads"
  | "securityEvents";

type PolicyRow = {
  target: RetentionTarget;
  defaults: { retentionDays: number; enabled: boolean };
  globalOverride: { retentionDays: number; enabled: boolean } | null;
  condoOverride: { retentionDays: number; enabled: boolean } | null;
  effective: { retentionDays: number; enabled: boolean };
};

type RetentionRun = {
  _id: Id<"dataRetentionRuns">;
  startedAt: number;
  finishedAt: number;
  dryRun: boolean;
  maxRowsPerTarget: number;
  triggeredBy?: string;
  summary?: {
    totals?: {
      scanned?: number;
      eligible?: number;
      affected?: number;
    };
  };
};

interface RetentionPageProps {
  sessionToken: string;
  condo: Doc<"condos"> | null;
}

const TARGET_LABELS: Record<RetentionTarget, string> = {
  otps: "OTPs",
  invites: "Convites",
  loginAttempts: "Tentativas de login",
  sessions: "Sessões",
  passwordResets: "Reset de senha",
  notificationReads: "Leituras de notificação",
  securityEvents: "Eventos de segurança",
};

export function RetentionPage({ sessionToken, condo }: RetentionPageProps) {
  const [selectedTarget, setSelectedTarget] = useState<RetentionTarget>("otps");
  const [retentionDays, setRetentionDays] = useState("90");
  const [enabled, setEnabled] = useState(true);
  const [maxRowsPerTarget, setMaxRowsPerTarget] = useState("500");
  const [isSubmittingPolicy, setIsSubmittingPolicy] = useState(false);
  const [isTriggeringRun, setIsTriggeringRun] = useState<"dry" | "live" | null>(null);

  const policiesResult = useQuery(api.retention.getPolicies, { token: sessionToken }) as
    | PolicyRow[]
    | undefined;
  const condoPoliciesResult = useQuery(
    api.retention.getPolicies,
    condo?._id ? { token: sessionToken, condoId: condo._id } : "skip",
  ) as PolicyRow[] | undefined;
  const runsResult = useQuery(api.retention.listRuns, { token: sessionToken, limit: 10 }) as
    | RetentionRun[]
    | undefined;

  const upsertPolicy = useMutation(api.retention.upsertPolicy);
  const triggerRun = useMutation(api.retention.triggerRun);

  const policies = policiesResult ?? [];
  const condoPolicies = condoPoliciesResult ?? [];
  const runs = runsResult ?? [];

  const selectedPolicy = useMemo(
    () => policies.find((item) => item.target === selectedTarget) ?? null,
    [policies, selectedTarget],
  );

  const selectedCondoPolicy = useMemo(
    () => condoPolicies.find((item) => item.target === selectedTarget) ?? null,
    [condoPolicies, selectedTarget],
  );

  const isLoadingPolicies = policiesResult === undefined;
  const isLoadingRuns = runsResult === undefined;

  const handlePrefillFrom = (scope: "default" | "global" | "condo" | "effective") => {
    const source =
      scope === "default"
        ? selectedPolicy?.defaults
        : scope === "global"
          ? selectedPolicy?.globalOverride
          : scope === "condo"
            ? selectedCondoPolicy?.condoOverride
            : selectedCondoPolicy?.effective ?? selectedPolicy?.effective;
    if (!source) return;
    setRetentionDays(String(source.retentionDays));
    setEnabled(source.enabled);
  };

  const handleSaveGlobalPolicy = async () => {
    const days = Number(retentionDays);
    if (!Number.isFinite(days) || days < 1 || days > 3650) {
      toast.error("Os dias de retenção devem estar entre 1 e 3650");
      return;
    }

    setIsSubmittingPolicy(true);
    try {
      await upsertPolicy({
        token: sessionToken,
        target: selectedTarget,
        retentionDays: Math.floor(days),
        enabled,
      });
      toast.success("Política global atualizada");
    } catch (error) {
      console.error("Failed to save global retention policy", error);
      toast.error("Não foi possível salvar a política global");
    } finally {
      setIsSubmittingPolicy(false);
    }
  };

  const handleSaveCondoPolicy = async () => {
    if (!condo?._id) {
      toast.error("Selecione um condomínio para criar override");
      return;
    }
    const days = Number(retentionDays);
    if (!Number.isFinite(days) || days < 1 || days > 3650) {
      toast.error("Os dias de retenção devem estar entre 1 e 3650");
      return;
    }

    setIsSubmittingPolicy(true);
    try {
      await upsertPolicy({
        token: sessionToken,
        target: selectedTarget,
        retentionDays: Math.floor(days),
        enabled,
        condoId: condo._id,
      });
      toast.success("Override por condomínio atualizado");
    } catch (error) {
      console.error("Failed to save condo retention policy", error);
      toast.error("Não foi possível salvar o override por condomínio");
    } finally {
      setIsSubmittingPolicy(false);
    }
  };

  const handleTriggerRun = async (dryRun: boolean) => {
    const parsedLimit = Number(maxRowsPerTarget);
    const safeLimit = Number.isFinite(parsedLimit) ? Math.floor(parsedLimit) : 500;
    setIsTriggeringRun(dryRun ? "dry" : "live");
    try {
      await triggerRun({
        token: sessionToken,
        dryRun,
        maxRowsPerTarget: safeLimit,
      });
      toast.success(dryRun ? "Dry-run enfileirado" : "Execução real enfileirada");
    } catch (error) {
      console.error("Failed to trigger retention run", error);
      toast.error("Não foi possível iniciar a execução");
    } finally {
      setIsTriggeringRun(null);
    }
  };

  const formatDateTime = (timestamp: number) =>
    new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
      new Date(timestamp),
    );

  return (
    <div className="space-y-6">
      <PageHeader title="Retenção LGPD" breadcrumb={["Allecto App", "Retenção LGPD"]} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Execução de retenção
          </CardTitle>
          <CardDescription>
            Rode um dry-run para validar impacto antes da limpeza definitiva.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:max-w-xs">
            <Label htmlFor="max-rows">Limite por alvo (1 a 2000)</Label>
            <Input
              id="max-rows"
              type="number"
              min={1}
              max={2000}
              value={maxRowsPerTarget}
              onChange={(event) => setMaxRowsPerTarget(event.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => void handleTriggerRun(true)}
              disabled={isTriggeringRun !== null}
            >
              {isTriggeringRun === "dry" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PlayCircle className="mr-2 h-4 w-4" />
              )}
              Rodar dry-run
            </Button>
            <Button onClick={() => void handleTriggerRun(false)} disabled={isTriggeringRun !== null}>
              {isTriggeringRun === "live" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Rodar limpeza real
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Políticas</CardTitle>
          <CardDescription>
            Gerencie retenção por alvo. Você pode salvar valor global e override por condomínio.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingPolicies ? (
            <div className="text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando políticas...
            </div>
          ) : (
            <>
              <div className="grid gap-3 md:grid-cols-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="target">Alvo</Label>
                  <select
                    id="target"
                    className="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
                    value={selectedTarget}
                    onChange={(event) => setSelectedTarget(event.target.value as RetentionTarget)}
                  >
                    {(Object.keys(TARGET_LABELS) as RetentionTarget[]).map((target) => (
                      <option key={target} value={target}>
                        {TARGET_LABELS[target]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="days">Dias de retenção</Label>
                  <Input
                    id="days"
                    type="number"
                    min={1}
                    max={3650}
                    value={retentionDays}
                    onChange={(event) => setRetentionDays(event.target.value)}
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Switch checked={enabled} onCheckedChange={setEnabled} id="enabled" />
                  <Label htmlFor="enabled">Habilitado</Label>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => handlePrefillFrom("default")}>
                  Usar default
                </Button>
                <Button variant="outline" onClick={() => handlePrefillFrom("global")}>
                  Usar global
                </Button>
                {condo?._id && (
                  <Button variant="outline" onClick={() => handlePrefillFrom("condo")}>
                    Usar override do condomínio
                  </Button>
                )}
                <Button variant="outline" onClick={() => handlePrefillFrom("effective")}>
                  Usar efetiva
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={() => void handleSaveGlobalPolicy()} disabled={isSubmittingPolicy}>
                  {isSubmittingPolicy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Salvar política global
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => void handleSaveCondoPolicy()}
                  disabled={isSubmittingPolicy || !condo?._id}
                >
                  {isSubmittingPolicy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Salvar override de {condo?.name ?? "condomínio"}
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Alvo</TableHead>
                    <TableHead>Padrão</TableHead>
                    <TableHead>Global</TableHead>
                    <TableHead>Condomínio</TableHead>
                    <TableHead>Efetiva</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {policies.map((policy) => {
                    const condoRow = condoPolicies.find((item) => item.target === policy.target);
                    return (
                      <TableRow key={policy.target}>
                        <TableCell>{TARGET_LABELS[policy.target]}</TableCell>
                        <TableCell>
                          {policy.defaults.retentionDays}d / {policy.defaults.enabled ? "on" : "off"}
                        </TableCell>
                        <TableCell>
                          {policy.globalOverride
                            ? `${policy.globalOverride.retentionDays}d / ${policy.globalOverride.enabled ? "on" : "off"}`
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {condoRow?.condoOverride
                            ? `${condoRow.condoOverride.retentionDays}d / ${condoRow.condoOverride.enabled ? "on" : "off"}`
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={policy.effective.enabled ? "default" : "secondary"}>
                            {`${(condoRow?.effective ?? policy.effective).retentionDays}d / ${(condoRow?.effective ?? policy.effective).enabled ? "on" : "off"}`}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Últimas execuções</CardTitle>
          <CardDescription>Histórico de dry-runs e execuções reais.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingRuns ? (
            <div className="text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando execuções...
            </div>
          ) : runs.length === 0 ? (
            <div className="text-muted-foreground">Nenhuma execução registrada.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Início</TableHead>
                  <TableHead>Fim</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Analisados</TableHead>
                  <TableHead>Elegíveis</TableHead>
                  <TableHead>Affected</TableHead>
                  <TableHead>Origem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((run) => (
                  <TableRow key={String(run._id)}>
                    <TableCell>{formatDateTime(run.startedAt)}</TableCell>
                    <TableCell>{formatDateTime(run.finishedAt)}</TableCell>
                    <TableCell>
                      <Badge variant={run.dryRun ? "secondary" : "default"}>
                        {run.dryRun ? "dry-run" : "real"}
                      </Badge>
                    </TableCell>
                    <TableCell>{run.summary?.totals?.scanned ?? 0}</TableCell>
                    <TableCell>{run.summary?.totals?.eligible ?? 0}</TableCell>
                    <TableCell>{run.summary?.totals?.affected ?? 0}</TableCell>
                    <TableCell className="text-muted-foreground">{run.triggeredBy ?? "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
