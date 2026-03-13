import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "../components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { EmptyState } from "../components/admin/EmptyState";
import { PdfUploader } from "../components/documents/PdfUploader";
import { useDocuments } from "../hooks/useDocuments";
import { api, type Doc, type Id } from "../lib/convexGenerated";

interface CommunicationsNewPageProps {
  condo: Doc<"condos"> | null;
  sessionToken: string;
  onNavigate?: (page: string) => void;
}

export function CommunicationsNewPage({ condo, sessionToken, onNavigate }: CommunicationsNewPageProps) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [selectedDocumentId, setSelectedDocumentId] = useState<Id<"documents"> | null>(null);
  const [selectedDocumentTitle, setSelectedDocumentTitle] = useState<string | null>(null);
  const [audienceType, setAudienceType] = useState<"all" | "role" | "block">("all");
  const [targetRole, setTargetRole] = useState<string>("");
  const [targetBlock, setTargetBlock] = useState<string>("");
  const [isPublishing, setIsPublishing] = useState(false);

  const publish = useMutation(api.communications.publish);

  const condoId = condo?._id ?? null;
  const orgId = condo ? String(condo._id) : null;
  const units = useQuery(api.units.listByCondo, condoId ? { condoId } : "skip") as
    | Array<{ _id: Id<"units">; block?: string | null }>
    | undefined;

  const { documents, isLoading: documentsLoading } = useDocuments({
    orgId,
    sessionToken,
  });

  const selectedDocument = useMemo(() => {
    if (!documents || !selectedDocumentId) return null;
    return documents.find((doc) => doc._id === selectedDocumentId) ?? null;
  }, [documents, selectedDocumentId]);

  const effectiveDocumentTitle = selectedDocument?.title ?? selectedDocumentTitle ?? null;
  const availableBlocks = useMemo(() => {
    const normalized = new Set<string>();
    (units ?? []).forEach((unit) => {
      const block = unit.block?.trim();
      if (block) normalized.add(block);
    });
    return Array.from(normalized).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [units]);

  const handlePublish = async () => {
    if (!condoId) {
      toast.error("Selecione um condomínio");
      return;
    }
    if (!title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }
    if (audienceType === "role" && !targetRole) {
      toast.error("Selecione a função para segmentação.");
      return;
    }
    if (audienceType === "block" && !targetBlock) {
      toast.error("Selecione o bloco para segmentação.");
      return;
    }

    setIsPublishing(true);
    try {
      await publish({
        token: sessionToken,
        condoId,
        title: title.trim(),
        message: message.trim() || undefined,
        documentId: selectedDocumentId ?? undefined,
        audienceType,
        targetRole: audienceType === "role" ? targetRole : undefined,
        targetBlock: audienceType === "block" ? targetBlock : undefined,
      });
      toast.success("Comunicado publicado e enviado por e-mail");
      setTitle("");
      setMessage("");
      setSelectedDocumentId(null);
      setSelectedDocumentTitle(null);
      setAudienceType("all");
      setTargetRole("");
      setTargetBlock("");
      onNavigate?.("communications");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao publicar comunicado";
      toast.error(message);
    } finally {
      setIsPublishing(false);
    }
  };

  if (!condo) {
    return (
      <EmptyState
        icon={FileText}
        title="Selecione um condomínio"
        description="Escolha um condomínio para publicar comunicados aos moradores."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Novo Comunicado"
        breadcrumb={["Comunicados", "Novo Comunicado"]}
        description="Escreva e envie um novo comunicado para os moradores."
      />

      <Card>
        <CardHeader>
          <CardTitle>Publicar comunicado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="communication-title">Título</Label>
            <Input
              id="communication-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ex.: Aviso de manutenção do elevador"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="communication-message">Mensagem</Label>
            <Textarea
              id="communication-message"
              rows={4}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Escreva uma mensagem para os moradores."
            />
          </div>

          <div className="space-y-2">
            <Label>Público-alvo</Label>
            <Select
              value={audienceType}
              onValueChange={(value) => {
                const nextValue = value as "all" | "role" | "block";
                setAudienceType(nextValue);
                if (nextValue !== "role") setTargetRole("");
                if (nextValue !== "block") setTargetBlock("");
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os moradores</SelectItem>
                <SelectItem value="role">Por função</SelectItem>
                <SelectItem value="block">Por bloco</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {audienceType === "role" ? (
            <div className="space-y-2">
              <Label>Função</Label>
              <Select value={targetRole} onValueChange={setTargetRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resident">Morador</SelectItem>
                  <SelectItem value="syndic">Síndico</SelectItem>
                  <SelectItem value="manager">Gestor</SelectItem>
                  <SelectItem value="council">Conselho</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {audienceType === "block" ? (
            <div className="space-y-2">
              <Label>Bloco</Label>
              <Select value={targetBlock} onValueChange={setTargetBlock}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o bloco" />
                </SelectTrigger>
                <SelectContent>
                  {availableBlocks.length === 0 ? (
                    <SelectItem value="__empty" disabled>
                      Nenhum bloco cadastrado
                    </SelectItem>
                  ) : (
                    availableBlocks.map((block) => (
                      <SelectItem key={block} value={block}>
                        {block}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label>Documento (opcional)</Label>
            {documentsLoading ? (
              <p className="text-muted-foreground text-sm">Carregando documentos...</p>
            ) : documents && documents.length > 0 ? (
              <Select
                value={selectedDocumentId ?? undefined}
                onValueChange={(value) => setSelectedDocumentId(value as Id<"documents">)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um documento já enviado" />
                </SelectTrigger>
                <SelectContent>
                  {documents.map((doc) => (
                    <SelectItem key={doc._id} value={doc._id}>
                      {doc.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-muted-foreground text-sm">
                Envie um PDF abaixo para anexar ao comunicado.
              </p>
            )}
            {effectiveDocumentTitle ? (
              <div className="rounded-md border border-dashed p-3 text-sm">
                Documento selecionado: <strong>{effectiveDocumentTitle}</strong>
              </div>
            ) : null}
          </div>

          <PdfUploader
            orgId={orgId}
            sessionToken={sessionToken}
            onUploaded={({ id, title: uploadedTitle }) => {
              setSelectedDocumentId(id as Id<"documents">);
              setSelectedDocumentTitle(uploadedTitle);
            }}
          />

          <div className="flex justify-end">
            <Button onClick={handlePublish} disabled={isPublishing}>
              {isPublishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Publicar comunicado
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
