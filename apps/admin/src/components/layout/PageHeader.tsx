import { ChevronRight } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

export type BreadcrumbItem =
  | string
  | {
      label: string;
      onClick: () => void;
    };

interface PageHeaderProps {
  title: string;
  breadcrumb?: BreadcrumbItem[];
  description?: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "destructive";
    disabled?: boolean;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
  contextPill?: {
    name: string;
    subdomain: string;
  };
}

export function PageHeader({
  title,
  breadcrumb,
  description,
  primaryAction,
  secondaryAction,
  contextPill,
}: PageHeaderProps) {
  return (
    <div className="mb-6 space-y-3">
      {breadcrumb && breadcrumb.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {breadcrumb.map((item, index) => {
            const breadcrumbItem =
              typeof item === "string" ? { label: item, onClick: undefined } : item;

            return (
              <div key={`${breadcrumbItem.label}-${index}`} className="flex items-center gap-2">
              {index > 0 && <ChevronRight className="h-4 w-4" />}
                {breadcrumbItem.onClick ? (
                  <button
                    type="button"
                    onClick={breadcrumbItem.onClick}
                    className="transition-colors hover:text-foreground"
                  >
                    {breadcrumbItem.label}
                  </button>
                ) : (
                  <span>{breadcrumbItem.label}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <h1>{title}</h1>
            {contextPill && (
              <Badge variant="outline" className="gap-1">
                <span>Condomínio:</span>
                <span>{contextPill.name}</span>
                <span className="text-muted-foreground">
                  ({contextPill.subdomain})
                </span>
              </Badge>
            )}
          </div>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          {secondaryAction && (
            <Button
              variant="outline"
              onClick={secondaryAction.onClick}
              disabled={secondaryAction.disabled}
              className="w-full sm:w-auto"
            >
              {secondaryAction.label}
            </Button>
          )}
          {primaryAction && (
            <Button
              variant={primaryAction.variant || "default"}
              onClick={primaryAction.onClick}
              disabled={primaryAction.disabled}
              className="w-full sm:w-auto"
            >
              {primaryAction.label}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
