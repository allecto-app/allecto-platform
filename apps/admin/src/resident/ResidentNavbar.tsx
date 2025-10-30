import { Menu, User } from "lucide-react";
import { Button } from "../components/ui/button";
import { cn } from "../components/ui/utils";

interface ResidentNavbarProps {
  onToggleSidebar?: () => void;
  condoName?: string | null;
  userName?: string | null;
  onNavigateProfile: () => void;
  onLogout: () => void;
}

export function ResidentNavbar({
  onToggleSidebar,
  condoName,
  userName,
  onNavigateProfile,
  onLogout,
}: ResidentNavbarProps) {
  const userInitial = userName ? userName.charAt(0).toUpperCase() : null;

  return (
    <header className="flex items-center justify-between gap-3 border-b border-border bg-background px-4 py-3 md:h-16 md:px-6">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onToggleSidebar}
            aria-label="Abrir menu de navegação"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground">Condomínio</span>
          <span className="text-base font-semibold text-foreground">
            {condoName ?? "Meu Condomínio"}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          className="hidden sm:inline-flex"
          onClick={onNavigateProfile}
        >
          Minha Conta
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="inline-flex sm:hidden"
          onClick={onNavigateProfile}
          aria-label="Minha Conta"
        >
          <User className="h-4 w-4" />
        </Button>
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground",
            "text-sm font-medium"
          )}
        >
          {userInitial ?? <User className="h-4 w-4" />}
        </div>
        <Button variant="outline" onClick={onLogout}>
          Sair
        </Button>
      </div>
    </header>
  );
}
