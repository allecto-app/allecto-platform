import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <Card className="flex flex-col items-center justify-center p-12 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mb-2">{title}</h3>
      <p className="mb-6 text-muted-foreground max-w-md">{description}</p>
      <div className="flex items-center gap-2">
        {secondaryAction && (
          <Button variant="outline" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </Button>
        )}
        {primaryAction && (
          <Button onClick={primaryAction.onClick}>
            {primaryAction.label}
          </Button>
        )}
      </div>
    </Card>
  );
}
