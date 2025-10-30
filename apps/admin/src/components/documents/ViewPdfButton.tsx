import { useCallback, useState, type ComponentProps } from "react";
import { useMutation } from "convex/react";
import { Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api, type Id } from "../../lib/convexGenerated";
import { Button } from "../ui/button";

type ButtonProps = ComponentProps<typeof Button>;

type ViewPdfButtonProps = {
  docId: Id<"documents">;
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
  const getViewUrl = useMutation(api.documents.getViewToken);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = useCallback(async () => {
    try {
      setIsLoading(true);
      const { url } = await getViewUrl({
        docId,
        sessionToken: sessionToken ?? undefined,
        orgId: orgId ?? undefined,
      });
      if (!url) {
        throw new Error("URL de visualização indisponível.");
      }
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
  }, [docId, getViewUrl, onOpened, orgId, sessionToken]);

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
