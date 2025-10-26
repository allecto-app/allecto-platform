import { useCallback, useState, type ComponentProps } from "react";
import { useMutation } from "convex/react";
import { Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../lib/convexGenerated";
import { Button } from "../ui/button";

type ButtonProps = ComponentProps<typeof Button>;

type ViewPdfButtonProps = {
  docId: string;
  sessionToken?: string | null;
  orgId?: string | null;
  label?: string;
  onOpened?: (url: string) => void;
} & ButtonProps;

export function ViewPdfButton({
  docId,
  sessionToken,
  orgId,
  label = "Visualizar",
  onOpened,
  disabled,
  ...buttonProps
}: ViewPdfButtonProps) {
  const getToken = useMutation(api.documents.getViewToken);
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = useCallback(async () => {
    if (!convexUrl) {
      toast.error("A URL do Convex não está configurada.");
      return;
    }

    try {
      setIsLoading(true);
      const { token } = await getToken({
        docId: docId as any,
        sessionToken: sessionToken ?? undefined,
        orgId: orgId ?? undefined,
      });
      if (!token) {
        throw new Error("Token de visualização inválido.");
      }
      const url = `${convexUrl}/api/docs/view?token=${encodeURIComponent(token)}`;
      window.open(url, "_blank", "noopener,noreferrer");
      onOpened?.(url);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível abrir o documento.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [convexUrl, docId, getToken, onOpened, sessionToken]);

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={disabled || isLoading}
      {...buttonProps}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Eye className="mr-2 h-4 w-4" />
      )}
      {label}
    </Button>
  );
}
