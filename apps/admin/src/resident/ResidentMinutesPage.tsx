import { useMemo } from "react";
import { useQuery } from "convex/react";
import { FileText, Loader2, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { EmptyState } from "../components/admin/EmptyState";
import { PageHeader } from "../components/layout/PageHeader";
import { api, Doc, Id } from "../lib/convexGenerated";

type ResidentUnitLink = {
  unitId: Id<"units">;
  code: string;
  block: string | null;
  role: string | null;
};

interface ResidentMinutesPageProps {
  condoId: Id<"condos"> | null;
  residentId: Id<"residents">;
  onSelectMinute: (minute: Doc<"minutes">) => void;
  units: ResidentUnitLink[];
}

const formatDateTime = (timestamp: number) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(timestamp));

export function ResidentMinutesPage({
  condoId,
  residentId,
  onSelectMinute,
  units,
}: ResidentMinutesPageProps) {
  const minutes = useQuery(
    api.minutes.list,
    condoId ? { condoId } : "skip",
  ) as Doc<"minutes">[] | undefined;
  const myVotes = useQuery(api.votes.getMine, { residentId }) ?? [];

  const minutesByStatus = useMemo(() => {
    if (!minutes) return { open: undefined, closed: undefined };
    const open = minutes.filter((minute) => minute.status === "open").sort((a, b) => b.publishedAt - a.publishedAt);
    const closed = minutes.filter((minute) => minute.status === "closed").sort((a, b) => b.publishedAt - a.publishedAt);
    return { open, closed };
  }, [minutes]);

  const votesByMinute = useMemo(() => {
    const map = new Map<string, { unitId: Id<"units">; createdAt: number }>();
    for (const vote of myVotes) {
      map.set(String(vote.minuteId), { unitId: vote.unitId, createdAt: vote.createdAt });
    }
    return map;
  }, [myVotes]);

  if (!condoId) {
    return (
      <EmptyState
        icon={FileText}
        title="Condomínio não encontrado"
        description="Não foi possível identificar o condomínio associado a este acesso."
      />
    );
  }

  if (minutes === undefined) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasUnits = units.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Atas"
        breadcrumb={["Minha Conta", "Atas"]}
        description={
          hasUnits
            ? "Vote nas assembleias abertas do seu condomínio."
            : "Nenhuma unidade vinculada. Entre em contato com a administração do condomínio."
        }
      />

      {!hasUnits && (
        <EmptyState
          icon={FileText}
          title="Nenhuma unidade vinculada"
          description="Você precisa estar vinculado a uma unidade para votar nas assembleias."
        />
      )}

      {hasUnits && (
        <>
          <Section
            title="Atas em andamento"
            minutes={minutesByStatus.open ?? []}
            votesByMinute={votesByMinute}
            onSelectMinute={onSelectMinute}
            emptyDescription="Não há assembleias abertas no momento."
          />
          <Section
            title="Atas encerradas"
            minutes={minutesByStatus.closed ?? []}
            votesByMinute={votesByMinute}
            onSelectMinute={onSelectMinute}
            emptyDescription="Nenhuma assembleia encerrada disponível."
          />
        </>
      )}
    </div>
  );
}

function Section({
  title,
  minutes,
  votesByMinute,
  onSelectMinute,
  emptyDescription,
}: {
  title: string;
  minutes: Doc<"minutes">[];
  votesByMinute: Map<string, { unitId: Id<"units">; createdAt: number }>;
  onSelectMinute: (minute: Doc<"minutes">) => void;
  emptyDescription: string;
}) {
  if (minutes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">{emptyDescription}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        {minutes.map((minute) => {
          const vote = votesByMinute.get(String(minute._id));
          const hasVoted = Boolean(vote);
          return (
            <Card key={minute._id as string} className="border border-border/60">
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div className="space-y-1">
                  <CardTitle className="text-base">{minute.title}</CardTitle>
                  <p className="text-muted-foreground text-sm">{minute.summary ?? "Sem descrição fornecida."}</p>
                </div>
                <Badge variant={minute.status === "open" ? "default" : "secondary"}>
                  {minute.status === "open" ? "Aberta" : "Encerrada"}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2 text-sm text-muted-foreground">
                  <div>
                    Publicada em{" "}
                    <span className="text-foreground">{formatDateTime(minute.publishedAt)}</span>
                  </div>
                  <div>
                    Fecha em{" "}
                    <span className="text-foreground">{formatDateTime(minute.closesAt)}</span>
                  </div>
                  <div>
                    Status do voto:{" "}
                    <span className="text-foreground">
                      {hasVoted ? "Voto registrado" : "Pendente"}
                    </span>
                  </div>
                </div>
                <Button
                  onClick={() => onSelectMinute(minute)}
                  className="w-full justify-between"
                  variant="outline"
                >
                  Ver detalhes
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
