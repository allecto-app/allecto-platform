import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { FileText } from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { EmptyState } from "../components/admin/EmptyState";
import { api, Doc } from "../lib/convexGenerated";

interface MinutesNewPageProps {
  onNavigate: (page: string) => void;
  condo: Doc<"condos"> | null;
}

const CLOSING_OPTIONS = [
  { label: "3 dias", value: 3 },
  { label: "5 dias", value: 5 },
  { label: "7 dias", value: 7 },
];

export function MinutesNewPage({ onNavigate, condo }: MinutesNewPageProps) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [closesIn, setClosesIn] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const residents = useQuery(
    api.residents.list,
    condo ? { condoId: condo._id } : "skip",
  ) as Doc<"residents">[] | undefined;
  const publishMinute = useMutation(api.minutes.publish);

  const author = useMemo(() => {
    if (!residents) return null;
    return (
      residents.find((resident: Doc<"residents">) => resident.role === "syndic") ??
      residents[0] ??
      null
    );
  }, [residents]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!condo) {
      toast.error("Selecione um condomínio para publicar a ata.");
      return;
    }
    if (!author) {
      toast.error("Cadastre ao menos um morador para publicar a ata.");
      return;
    }
    if (!closesIn) {
      toast.error("Selecione o prazo de encerramento.");
      return;
    }

    try {
      setIsSubmitting(true);
      const closesAt = Date.now() + Number(closesIn) * 24 * 60 * 60 * 1000;
      await publishMinute({
        condoId: condo._id,
        title,
        summary,
        pdfUrl,
        closesAt,
        createdBy: author._id,
      });
      toast.success("Ata publicada com sucesso!");
      onNavigate("minutes");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao publicar ata";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!condo) {
    return (
      <EmptyState
        icon={FileText}
        title="Selecione um condomínio"
        description="Você precisa escolher um condomínio antes de publicar uma ata."
        primaryAction={{
          label: "Voltar",
          onClick: () => onNavigate("minutes"),
        }}
      />
    );
  }

  return (
    <div>
      <PageHeader
        title="Nova Ata"
        breadcrumb={["Atas", "Nova"]}
      />

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                placeholder="Digite o título da ata"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Resumo</Label>
              <Textarea
                id="summary"
                placeholder="Digite um resumo da ata"
                rows={5}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                required
              />
              <p className="text-muted-foreground">
                Este resumo será enviado aos moradores
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pdf">URL do PDF</Label>
              <Input
                id="pdf"
                type="url"
                placeholder="https://exemplo.com/ata.pdf"
                value={pdfUrl}
                onChange={(e) => setPdfUrl(e.target.value)}
                required
              />
              <p className="text-muted-foreground">
                Link para o documento PDF da ata
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="closes">Fecha em</Label>
              <Select value={closesIn} onValueChange={setClosesIn} required>
                <SelectTrigger id="closes">
                  <SelectValue placeholder="Selecione o prazo" />
                </SelectTrigger>
                <SelectContent>
                  {CLOSING_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground">
                Prazo para votação dos moradores
              </p>
            </div>

            {author ? (
              <p className="text-muted-foreground text-sm">
                A ata será publicada em nome de <strong>{author.name}</strong>.
              </p>
            ) : (
              <p className="text-destructive text-sm">
                Cadastre um morador para publicar a ata.
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onNavigate("minutes")}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || !author}>
                {isSubmitting ? "Publicando..." : "Publicar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
