import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { FileText, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Label } from "../components/ui/label";
import { EmptyState } from "../components/admin/EmptyState";
import { PageHeader } from "../components/layout/PageHeader";
import { ViewPdfButton } from "../components/documents/ViewPdfButton";
import { api, Doc, Id } from "../lib/convexGenerated";

type ResidentUnitLink = {
  unitId: Id<"units">;
  code: string;
  block: string | null;
  role: string | null;
};

interface ResidentMinuteDetailPageProps {
  minuteId: Id<"minutes"> | null;
  condo: Doc<"condos"> | null;
  condoId: Id<"condos"> | null;
  residentId: Id<"residents">;
  sessionToken: string;
  units: ResidentUnitLink[];
  onBack: () => void;
}

const formatDateTime = (timestamp: number) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(timestamp));

export function ResidentMinuteDetailPage({
  minuteId,
  condo,
  condoId,
  residentId,
  sessionToken,
  units,
  onBack,
}: ResidentMinuteDetailPageProps) {
  const [selectedUnitId, setSelectedUnitId] = useState<Id<"units"> | null>(
    null
  );

  const minuteArgs = (minuteId ? { minuteId } : "skip") as
    | { minuteId: Id<"minutes"> }
    | "skip";
const minute = useQuery(api.minutes.get, minuteArgs) as
  | Doc<"minutes">
  | null
  | undefined;

const myVotesRaw = useQuery(
  api.votes.getMine,
  minuteId ? { residentId, minuteId } : "skip"
) as Doc<"votes">[] | undefined;
const myVotes = myVotesRaw ?? [];

const unitById = useMemo(() => {
  const map = new Map<string, ResidentUnitLink>();
  units.forEach((unit) => {
    map.set(String(unit.unitId), unit);
  });
  return map;
}, [units]);

type ResidentVoteSummary = {
  unitCode: string;
  choice: "agree" | "disagree";
  createdAt: number;
};

const myVotesSummary: ResidentVoteSummary[] = useMemo(
  () =>
    myVotes.map((vote) => ({
      unitCode: unitById.get(String(vote.unitId))?.code ?? "Unidade",
      choice: vote.choice === "agree" ? "agree" : "disagree",
      createdAt:
        typeof vote.createdAt === "number" ? vote.createdAt : Date.now(),
    })),
  [myVotes, unitById]
);

const minuteStatus = minute?.status ?? null;
  const voteSummary = useQuery(
    api.votes.summary,
    minuteId && minuteStatus === "closed" ? { minuteId } : "skip"
  );

  const unitVotes = useMemo(
    () => new Set(myVotes.map((vote) => String(vote.unitId))),
    [myVotes]
  );
  const availableUnits = useMemo(
    () => units.filter((unit) => !unitVotes.has(String(unit.unitId))),
    [units, unitVotes]
  );

  useEffect(() => {
    if (availableUnits.length > 0) {
      setSelectedUnitId((prev) => {
        if (prev && availableUnits.some((unit) => unit.unitId === prev)) {
          return prev;
        }
        return availableUnits[0]?.unitId ?? null;
      });
    } else {
      setSelectedUnitId(null);
    }
  }, [availableUnits]);

  const castVote = useMutation(api.votes.cast);
  const canVote = minuteStatus === "open" && availableUnits.length > 0;
  const condoName = condo?.name ?? null;

  if (!minuteId) {
    return (
      <EmptyState
        icon={FileText}
        title="Selecione uma ata"
        description="Escolha uma assembleia para visualizar os detalhes."
        primaryAction={{ label: "Voltar para Atas", onClick: onBack }}
      />
    );
  }

  if (minute === undefined) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!minute) {
    return (
      <EmptyState
        icon={FileText}
        title="Ata não encontrada"
        description="Não foi possível localizar esta assembleia."
        primaryAction={{ label: "Voltar para Atas", onClick: onBack }}
      />
    );
  }

  const handleVote = async (choice: "agree" | "disagree") => {
    if (!selectedUnitId) return;
    try {
      await castVote({
        minuteId,
        unitId: selectedUnitId,
        residentId,
        choice,
      });
      toast.success("Seu voto foi registrado com sucesso!");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível registrar o voto";
      toast.error(message);
    }
  };

  const documentId =
    (minute.documentId as Id<"documents"> | undefined) ?? undefined;
  const orgId = condoId
    ? String(condoId)
    : condo
    ? String(condo._id)
    : undefined;

  const alreadyVotedUnits = units.filter((unit) =>
    unitVotes.has(String(unit.unitId))
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={minute.title}
        breadcrumb={["Atas", minute.title]}
        contextPill={
          condoName && condo?.subdomain
            ? {
                name: condoName,
                subdomain: condo.subdomain,
              }
            : undefined
        }
        secondaryAction={{
          label: "Voltar",
          onClick: onBack,
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>Resumo</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="text-sm text-muted-foreground">Status</div>
            <Badge variant={minute.status === "open" ? "default" : "secondary"}>
              {minute.status === "open" ? "Aberta" : "Encerrada"}
            </Badge>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Publicado em</div>
            <div className="text-sm text-foreground">
              {formatDateTime(minute.publishedAt)}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Encerramento</div>
            <div className="text-sm text-foreground">
              {formatDateTime(minute.closesAt)}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Descrição</div>
            <div className="text-sm text-foreground">
              {minute.summary ?? "Sem descrição fornecida."}
            </div>
          </div>
        </CardContent>
      </Card>

      {documentId && orgId && (
        <Card>
          <CardHeader>
            <CardTitle>Documento da assembleia</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              O documento completo está disponível em PDF. Revise antes de
              registrar seu voto.
            </p>
            <ViewPdfButton
              docId={documentId}
              sessionToken={sessionToken}
              orgId={orgId}
              label="Abrir documento"
              variant="outline"
              className="mt-3"
            />
          </CardContent>
        </Card>
      )}

      {minute.status === "open" ? (
        <Card>
          <CardHeader>
            <CardTitle>Votação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {availableUnits.length === 0 ? (
              <div className="rounded-md border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                Todas as suas unidades já registraram voto nesta assembleia.
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Selecione a unidade</Label>
                  <Select
                    value={selectedUnitId ?? undefined}
                    onValueChange={(value) =>
                      setSelectedUnitId(value as Id<"units">)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha a unidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUnits.map((unit) => (
                        <SelectItem
                          key={unit.unitId as string}
                          value={unit.unitId}
                        >
                          {unit.code}
                          {unit.block ? ` • ${unit.block}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    onClick={() => handleVote("agree")}
                    disabled={!canVote || !selectedUnitId}
                    className="flex items-center gap-2 hover:bg-secondary hover:text-primary"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Concordo
                  </Button>
                  <Button
                    onClick={() => handleVote("disagree")}
                    variant="outline"
                    disabled={!canVote || !selectedUnitId}
                    className="flex items-center gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Discordo
                  </Button>
                </div>
              </>
            )}

            {alreadyVotedUnits.length > 0 && (
              <div className="rounded-lg border border-border/60 bg-muted/20 p-4 text-sm">
                <div className="font-medium text-foreground">
                  Unidades com voto registrado
                </div>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-muted-foreground">
                  {alreadyVotedUnits.map((unit) => (
                    <li key={unit.unitId as string}>
                      {unit.code}
                      {unit.block ? ` • ${unit.block}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {myVotesSummary.length > 0 && (
              <div className="rounded-lg border border-border/60 bg-muted/20 p-4 text-sm">
                <div className="font-medium text-foreground">
                  Seus votos
                </div>
                <ul className="mt-2 space-y-2">
                  {myVotesSummary.map((vote, index) => (
                    <li
                      key={`${vote.unitCode}-${index}`}
                      className="flex flex-col gap-1"
                    >
                      <span className="text-foreground">
                        {vote.unitCode} —{" "}
                        {vote.choice === "agree"
                          ? "Concordo"
                          : "Discordo"}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        Registrado em{" "}
                        {formatDateTime(vote.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Resultado</CardTitle>
          </CardHeader>
          <CardContent>
            {voteSummary ? (
              <div className="grid gap-4 sm:grid-cols-3">
                <ResultBadge
                  label="Total de votos"
                  value={voteSummary.total}
                  variant="default"
                />
                <ResultBadge
                  label="Votos a favor"
                  value={voteSummary.agree}
                  variant="success"
                />
                <ResultBadge
                  label="Votos contra"
                  value={voteSummary.disagree}
                  variant="destructive"
                />
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                O resultado estará disponível após o encerramento oficial da
                assembleia.
              </p>
            )}

            {myVotesSummary.length > 0 && (
              <div className="mt-6 rounded-lg border border-border/60 bg-muted/20 p-4 text-sm">
                <div className="font-medium text-foreground">
                  Seus votos
                </div>
                <ul className="mt-2 space-y-2">
                  {myVotesSummary.map((vote, index) => (
                    <li
                      key={`${vote.unitCode}-${index}`}
                      className="flex flex-col gap-1"
                    >
                      <span className="text-foreground">
                        {vote.unitCode} —{" "}
                        {vote.choice === "agree"
                          ? "Concordo"
                          : "Discordo"}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        Registrado em {formatDateTime(vote.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ResultBadge({
  label,
  value,
  variant,
}: {
  label: string;
  value: number;
  variant: "default" | "success" | "destructive";
}) {
  const variantClass =
    variant === "success"
      ? "bg-emerald-500/10 text-emerald-600"
      : variant === "destructive"
      ? "bg-destructive/10 text-destructive"
      : "bg-primary/10 text-primary";

  return (
    <div className="rounded-lg border border-border/60 p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className={`text-2xl font-semibold ${variantClass}`}>{value}</div>
    </div>
  );
}
