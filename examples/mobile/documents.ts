// @ts-nocheck
/**
 * Expo React Native helpers for uploading and viewing secure Convex PDFs.
 *
 * These utilities assume that you have a Convex client instance available in your
 * React Native app (for example using `convex/react-native`).
 *
 * Usage:
 *
 * ```ts
 * import { useSecurePdfViewer, pickAndUploadPdf } from "./documents";
 *
 * const { WebView } = useSecurePdfViewer({ convexClient, docId });
 * ```
 */
import { useEffect, useMemo, useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Crypto from "expo-crypto";
import { WebView } from "react-native-webview";

const MAX_PDF_BYTES = 10 * 1024 * 1024;

async function toUint8Array(uri: string) {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const binary = global.atob(base64);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    buffer[i] = binary.charCodeAt(i);
  }
  return buffer;
}

export async function pickAndUploadPdf(convexClient: any, meta: {
  orgId: string;
  sessionToken?: string;
  title?: string;
  visibility?: "org" | "assembly" | "private";
  assemblyId?: string;
  allowedRoles?: string[];
  allowedUserIds?: string[];
}) {
  const result = await DocumentPicker.getDocumentAsync({
    type: "application/pdf",
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;

  const file = result.assets?.[0];
  if (!file) return null;
  if ((file.size ?? 0) > MAX_PDF_BYTES) {
    throw new Error("O PDF deve ter no máximo 10 MB.");
  }

  const upload = await convexClient.mutation("documents:generateUploadUrl", {
    sessionToken: meta.sessionToken,
    orgId: meta.orgId,
  });

  const binary = await toUint8Array(file.uri);
  const response = await fetch(upload.url, {
    method: "POST",
    headers: { "Content-Type": "application/pdf" },
    body: binary,
  });

  if (!response.ok) {
    throw new Error("Falha ao enviar PDF para o armazenamento.");
  }

  const { storageId } = await response.json();
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    await FileSystem.readAsStringAsync(file.uri, {
      encoding: FileSystem.EncodingType.Base64,
    }),
    { encoding: Crypto.CryptoEncoding.HEX },
  );

  return convexClient.mutation("documents:finalizeUpload", {
    sessionToken: meta.sessionToken,
    storageId,
    title: meta.title ?? file.name?.replace(/\.pdf$/i, "") ?? "Documento",
    contentType: "application/pdf",
    size: file.size ?? binary.byteLength,
    sha256: hash,
    visibility: meta.visibility ?? "org",
    assemblyId: meta.assemblyId,
    allowedRoles: meta.allowedRoles ?? ["admin", "syndic", "resident"],
    allowedUserIds: meta.allowedUserIds ?? [],
    orgId: meta.orgId,
  });
}

export function useSecurePdfViewer({ convexClient, docId, sessionToken, convexUrl, orgId }: {
  convexClient: any;
  docId: string;
  sessionToken?: string;
  convexUrl: string;
  orgId?: string;
}) {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { token: nextToken } = await convexClient.mutation("documents:getViewToken", {
          docId,
          sessionToken,
          orgId,
        });
        if (mounted) {
          setToken(nextToken);
        }
      } catch (error) {
        console.error("Failed to obtain view token", error);
        if (mounted) {
          setToken(null);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [convexClient, docId, orgId, sessionToken]);

  const url = useMemo(() => {
    if (!token) return null;
    return `${convexUrl}/api/docs/view?token=${encodeURIComponent(token)}`;
  }, [convexUrl, token]);

  return {
    token,
    url,
    WebView: url
      ? () => <WebView source={{ uri: url }} originWhitelist={["*"]} />
      : () => null,
  };
}
