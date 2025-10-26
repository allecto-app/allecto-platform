import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../lib/convexGenerated";

type Visibility = "org" | "assembly" | "private";

type UseDocumentsOptions = {
  orgId: string | null;
  sessionToken?: string | null;
  assemblyId?: string | null;
  visibility?: Visibility | null;
  limit?: number;
};

export function useDocuments(options: UseDocumentsOptions) {
  const {
    orgId,
    sessionToken,
    assemblyId = null,
    visibility = null,
    limit,
  } = options;

  const args =
    orgId === null
      ? "skip"
      : {
          orgId,
          sessionToken: sessionToken ?? undefined,
          assemblyId: assemblyId ?? undefined,
          visibility: visibility ?? undefined,
          limit,
        };

  const documents = useQuery(api.documents.list, args);
  const isLoading = orgId !== null && documents === undefined;

  const sortedDocuments = useMemo(() => {
    if (!documents || documents.length === 0) return [];
    return [...documents].sort((a, b) => b.createdAt - a.createdAt);
  }, [documents]);

  return {
    documents: sortedDocuments,
    isLoading,
  };
}
