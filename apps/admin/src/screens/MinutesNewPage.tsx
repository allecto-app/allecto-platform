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
import { PdfUploader } from "../components/documents/PdfUploader";
import { ViewPdfButton } from "../components/documents/ViewPdfButton";
import { useDocuments } from "../hooks/useDocuments";
import { api, Doc, Id } from "../lib/convexGenerated";

interface MinutesNewPageProps {
  onNavigate: (page: string) => void;
  condo: Doc<"condos"> | null;
  sessionToken: string;
}

const CLOSING_OPTIONS = [
  { label: "3 dias", value: 3 },
  { label: "5 dias", value: 5 },
  { label: "7 dias", value: 7 },
];

export function MinutesNewPage({ onNavigate, condo, sessionToken }: MinutesNewPageProps) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [closesIn, setClosesIn] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [selectedDocumentTitle, setSelectedDocumentTitle] = useState<string | null>(null);

  const condoId = condo?._id ?? null;
  const orgId = condo ? (condo._id as unknown as string) : null;

  const residents = useQuery(
    api.residents.list,
    condoId ? { condoId } : "skip",
  ) as Doc<"residents">[] | undefined;
  const publishMinute = useMutation(api.minutes.publish);
  const { documents, isLoading: documentsLoading } = useDocuments({
    orgId,
    sessionToken,
  });

  const author = useMemo(() => {
    if (!residents) return null;
    return (
      residents.find((resident: Doc<"residents">) => resident.role === "syndic") ??
      residents[0] ??
      null
    );
  }, [residents]);

  const selectedDocument = useMemo(() => {
    if (!documents || !selectedDocumentId) return null;
    return (
      documents.find(
        (doc) => (doc._id as unknown as string) === selectedDocumentId,
      ) ?? null
    );
  }, [documents, selectedDocumentId]);

  const effectiveDocumentTitle = selectedDocument?.title ?? selectedDocumentTitle ?? null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!condoId) {
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
    if (!selectedDocumentId) {
      toast.error("Anexe ou selecione um documento PDF para a ata.");
      return;
    }

    try {
      setIsSubmitting(true);
      const closesAt = Date.now() + Number(closesIn) * 24 * 60 * 60 * 1000;
      await publishMinute({
        sessionToken,
        condoId,
        title,
        summary,
        documentId: selectedDocumentId as unknown as Id<"documents">,
        closesAt,
        createdBy: author._id,
      });
      toast.success("Ata publicada com sucesso!");
      setTitle("");
      setSummary("");
      setClosesIn("");
      setSelectedDocumentId(null);
      setSelectedDocumentTitle(null);
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
                onChange={(event) => setTitle(event.target.value)}
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
                onChange={(event) => setSummary(event.target.value)}
                required
              />
              <p className="text-muted-foreground">
                Este resumo será enviado aos moradores
              </p>
            </div>

            <div className="space-y-2">
              <Label>Documento PDF</Label>
              {documentsLoading ? (
                <p className="text-muted-foreground text-sm">Carregando documentos...</p>
              ) : documents && documents.length > 0 ? (
                <Select
                  value={selectedDocumentId ?? undefined}
                  onValueChange={(value) => setSelectedDocumentId(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um documento recém-enviado" />
                  </SelectTrigger>
                  <SelectContent>
                    {documents.map((doc) => {
                      const docId = doc._id as unknown as string;
                      return (
                        <SelectItem key={docId} value={docId}>
                          {doc.title}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Envie um PDF abaixo para vinculá-lo à ata.
                </p>
              )}
              {effectiveDocumentTitle ? (
                <div className="flex items-center gap-3 rounded-md border border-dashed border-muted-foreground/40 p-3 text-sm text-muted-foreground">
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">{effectiveDocumentTitle}</span>
                    {selectedDocument ? (
                      <>
                        <span>{selectedDocument.viewCount} visualizações</span>
                        {selectedDocument.lastViewedAt ? (
                          <span>
                            Último acesso{" "}
                            {new Intl.DateTimeFormat("pt-BR", {
                              dateStyle: "short",
                              timeStyle: "short",
                            }).format(new Date(selectedDocument.lastViewedAt))}
                          </span>
                        ) : (
                          <span>Ainda não visualizado</span>
                        )}
                      </>
                    ) : (
                      <span>Documento recém-enviado</span>
                    )}
                  </div>
                  {selectedDocumentId && (
                    <ViewPdfButton
                      docId={selectedDocumentId}
                      sessionToken={sessionToken}
                      orgId={selectedDocument?.orgId ?? orgId ?? undefined}
                      label="Abrir PDF"
                      variant="outline"
                      size="sm"
                    />
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Vincule um documento existente ou envie um novo PDF abaixo.
                </p>
              )}
            </div>

            <PdfUploader
              orgId={orgId}
              sessionToken={sessionToken}
              onUploaded={({ id, title: uploadedTitle }) => {
                setSelectedDocumentId(id);
                setSelectedDocumentTitle(uploadedTitle);
              }}
            />

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
