import { useCallback, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../lib/convexGenerated";

type Visibility = "org" | "private";

export type UploadDocumentMeta = {
  title: string;
  visibility: Visibility;
  allowedRoles?: string[];
  allowedUserIds?: string[];
};

type UsePdfUploadOptions = {
  sessionToken?: string | null;
  orgId?: string | null;
};

async function sha256Of(file: File) {
  const buffer = await file.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function usePdfUpload(options: UsePdfUploadOptions) {
  const { sessionToken, orgId } = options;
  const [isUploading, setIsUploading] = useState(false);
  const generateUploadUrl = useMutation(api.documents.generateUploadUrl);
  const finalizeUpload = useMutation(api.documents.finalizeUpload);

  const uploadPdf = useCallback(
    async (file: File, meta: UploadDocumentMeta) => {
      if (!file) {
        throw new Error("Nenhum arquivo selecionado");
      }
      if (file.type !== "application/pdf") {
        throw new Error("Apenas arquivos PDF são permitidos");
      }
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("O tamanho máximo do arquivo é 10 MB");
      }
      const effectiveOrgId = orgId ?? undefined;
      if (!effectiveOrgId) {
        throw new Error("Nenhum condomínio selecionado");
      }

      setIsUploading(true);
      try {
        const { url } = await generateUploadUrl({
          sessionToken: sessionToken ?? undefined,
          orgId: effectiveOrgId,
        });

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": file.type,
          },
          body: file,
        });

        if (!response.ok) {
          throw new Error("Falha ao enviar arquivo para o armazenamento");
        }

        const result = (await response.json()) as { storageId?: string };
        if (!result.storageId) {
          throw new Error("Resposta inválida ao fazer upload do PDF");
        }

        const sha256 = await sha256Of(file);
        const allowedRoles =
          meta.allowedRoles !== undefined ? meta.allowedRoles : ["admin", "syndic", "resident"];
        const allowedUserIds =
          meta.allowedUserIds?.map((id) => id.trim()).filter(Boolean) ?? [];

        const finalizeResult = await finalizeUpload({
          sessionToken: sessionToken ?? undefined,
          storageId: result.storageId,
          title: meta.title,
          contentType: file.type,
          size: file.size,
          sha256,
          visibility: meta.visibility,
          allowedRoles,
          allowedUserIds,
          orgId: effectiveOrgId,
        });

        return finalizeResult;
      } finally {
        setIsUploading(false);
      }
    },
    [finalizeUpload, generateUploadUrl, orgId, sessionToken],
  );

  return { uploadPdf, isUploading };
}
