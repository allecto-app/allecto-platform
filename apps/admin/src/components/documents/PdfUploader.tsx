import { useCallback, useMemo, useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { usePdfUpload, type UploadDocumentMeta } from "../../hooks/usePdfUpload";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Checkbox } from "../ui/checkbox";
import { Textarea } from "../ui/textarea";
import { cn } from "../ui/utils";

const ROLE_OPTIONS = ["admin", "syndic", "resident"] as const;
type RoleOption = (typeof ROLE_OPTIONS)[number];

type Visibility = UploadDocumentMeta["visibility"];

type PdfUploaderProps = {
  orgId: string | null;
  sessionToken?: string | null;
  className?: string;
  onUploaded?: (doc: { id: string; title: string }) => void;
};

export function PdfUploader({ orgId, sessionToken, className, onUploaded }: PdfUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("org");
  const [assemblyId, setAssemblyId] = useState("");
  const [allowedRoles, setAllowedRoles] = useState<RoleOption[]>(["admin", "syndic", "resident"]);
  const [allowedUsersRaw, setAllowedUsersRaw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { uploadPdf, isUploading } = usePdfUpload({ sessionToken, orgId });

  const parsedAllowedUserIds = useMemo(() => {
    return allowedUsersRaw
      .split(/[\s,;]+/)
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
  }, [allowedUsersRaw]);

  const applyFile = useCallback((nextFile: File | null) => {
    setFile(nextFile);
    setError(null);
    if (nextFile && title.trim().length === 0) {
      const base = nextFile.name.replace(/\.pdf$/i, "").trim();
      if (base.length > 0) {
        setTitle(base);
      }
    }
  }, [title]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    if (nextFile && nextFile.type !== "application/pdf") {
      setError("Selecione apenas arquivos PDF.");
      applyFile(null);
      return;
    }
    applyFile(nextFile);
  }, [applyFile]);

  const toggleRole = useCallback((role: RoleOption) => {
    setAllowedRoles((prev) => {
      if (prev.includes(role)) {
        return prev.filter((item) => item !== role);
      }
      return [...prev, role];
    });
  }, []);

  const handleVisibilityChange = useCallback((value: Visibility) => {
    setVisibility(value);
    if (value !== "private") {
      setAllowedRoles(["admin", "syndic", "resident"]);
      setAllowedUsersRaw("");
    } else {
      setAllowedRoles([]);
    }
  }, []);

  const handleUpload = useCallback(async () => {
    if (!file) {
      setError("Selecione um arquivo PDF para enviar.");
      return;
    }
    if (!orgId) {
      setError("Selecione um condomínio antes de enviar o PDF.");
      return;
    }
    if (title.trim().length === 0) {
      setError("Informe um título para o documento.");
      return;
    }

    if (visibility === "assembly" && assemblyId.trim().length === 0) {
      setError("Informe o ID da assembleia para documentos restritos à assembleia.");
      return;
    }

    if (visibility === "private" && allowedRoles.length === 0 && parsedAllowedUserIds.length === 0) {
      setError("Informe pelo menos um papel ou usuário autorizado para documentos privados.");
      return;
    }

    setError(null);
    try {
      const result = await uploadPdf(file, {
        title: title.trim(),
        visibility,
        assemblyId: visibility === "assembly" ? assemblyId.trim() : undefined,
        allowedRoles,
        allowedUserIds: parsedAllowedUserIds,
      });

      if (!result?.id) {
        throw new Error("Não foi possível concluir o upload do PDF.");
      }

      toast.success("PDF enviado com sucesso!");
      onUploaded?.({ id: result.id as string, title: title.trim() });
      setFile(null);
      setTitle("");
      setAssemblyId("");
      setAllowedUsersRaw("");
    } catch (uploadError) {
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : "Não foi possível enviar o PDF. Tente novamente.";
      setError(message);
      toast.error(message);
    }
  }, [allowedRoles, assemblyId, file, onUploaded, orgId, parsedAllowedUserIds, title, uploadPdf, visibility]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.currentTarget.contains(event.relatedTarget as Node)) return;
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const droppedFile = event.dataTransfer?.files?.[0] ?? null;
    if (!droppedFile) return;
    if (droppedFile.type !== "application/pdf") {
      setError("Arraste apenas arquivos PDF.");
      return;
    }
    applyFile(droppedFile);
  }, [applyFile]);

  const triggerFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        triggerFilePicker();
      }
    },
    [triggerFilePicker],
  );

  const selectedFileName = file?.name ?? "Nenhum arquivo selecionado";

  return (
    <div className={cn("space-y-4 rounded-lg border border-border p-4", className)}>
      <div className="space-y-2">
        <Label htmlFor="pdf-file">Arquivo PDF</Label>
        <div
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-6 text-center transition-colors cursor-pointer",
            isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/40 hover:border-primary",
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerFilePicker}
          role="button"
          tabIndex={0}
          onKeyDown={handleKeyDown}
        >
          <Upload className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-foreground">
            Arraste e solte um PDF ou clique para selecionar
          </p>
          <p className="text-xs text-muted-foreground">{selectedFileName}</p>
        </div>
        <Input
          ref={fileInputRef}
          id="pdf-file"
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />
        <p className="text-sm text-muted-foreground">Formato PDF até 10 MB.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pdf-title">Título</Label>
        <Input
          id="pdf-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Título do documento"
          required
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Visibilidade</Label>
          <Select value={visibility} onValueChange={handleVisibilityChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a visibilidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="org">Condomínio inteiro</SelectItem>
              <SelectItem value="assembly">Somente assembleia</SelectItem>
              <SelectItem value="private">Acesso restrito</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {visibility === "assembly" && (
          <div className="space-y-2">
            <Label htmlFor="assembly-id">ID da assembleia</Label>
            <Input
              id="assembly-id"
              value={assemblyId}
              onChange={(event) => setAssemblyId(event.target.value)}
              placeholder="Ex: assembleia-2025"
              required
            />
          </div>
        )}
      </div>

      <div className="space-y-3">
        <Label>Papéis autorizados</Label>
        <div className="grid gap-2 md:grid-cols-3">
          {ROLE_OPTIONS.map((role) => (
            <label key={role} className="flex items-center gap-2">
              <Checkbox
                checked={allowedRoles.includes(role)}
                onCheckedChange={() => toggleRole(role)}
              />
              <span className="text-sm capitalize">{role}</span>
            </label>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Defina quais papéis podem acessar o documento. Para documentos privados, você também pode
          informar usuários específicos abaixo.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="allowed-users">Usuários específicos (opcional)</Label>
        <Textarea
          id="allowed-users"
          value={allowedUsersRaw}
          onChange={(event) => setAllowedUsersRaw(event.target.value)}
          placeholder="Informe IDs de usuários separados por vírgula ou espaço"
          rows={2}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="button" onClick={handleUpload} disabled={isUploading || !file || !orgId}>
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Enviar PDF
          </>
        )}
      </Button>
    </div>
  );
}
