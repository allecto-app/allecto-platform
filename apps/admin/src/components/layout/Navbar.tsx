import { Search, Bell, User, Menu } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Badge } from "../ui/badge";
import { Alert, AlertDescription } from "../ui/alert";
import { CondoSwitcher } from "./CondoSwitcher";
import { Doc, Id } from "../../lib/convexGenerated";

interface NavbarProps {
  onToggleSidebar?: () => void;
  onNavigate: (page: string) => void;
  mode?: "platform" | "tenant";
  condos?: Doc<"condos">[] | undefined;
  selectedCondo?: Doc<"condos"> | null;
  onSelectCondo?: (condoId: Id<"condos"> | null) => void;
  onLogout?: () => void;
  userName?: string;
}

export function Navbar({
  onToggleSidebar,
  onNavigate,
  mode = "tenant",
  condos,
  selectedCondo,
  onSelectCondo,
  onLogout,
  userName,
}: NavbarProps) {
  const isPlatformMode = mode === "platform";
  const userInitial = userName ? userName.charAt(0).toUpperCase() : null;

  return (
    <>
      {isPlatformMode && (
        <Alert className="rounded-none border-x-0 border-t-0 bg-info/10">
          <AlertDescription className="text-center">
            <strong>Super Admin Mode</strong> — Condo:{" "}
            {selectedCondo ? `${selectedCondo.name} (${selectedCondo.subdomain})` : "None selected"}
          </AlertDescription>
        </Alert>
      )}
      <header className="flex h-16 items-center gap-4 border-b border-border bg-background px-6">
        {/* <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onToggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {isPlatformMode && onSelectCondo && (
          <CondoSwitcher
            condos={condos ?? []}
            selectedCondoId={selectedCondo?._id ?? null}
            onSelectCondo={onSelectCondo}
          />
        )}

        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar..."
            className="w-full pl-9"
          />
        </div> */}

        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]"
                >
                  3
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notificações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onNavigate("notifications")}>
                <div className="flex flex-col gap-1">
                  <span>Nova ata publicada</span>
                  <span className="text-muted-foreground">Há 2 horas</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onNavigate("notifications")}>
                <div className="flex flex-col gap-1">
                  <span>Lembrete enviado</span>
                  <span className="text-muted-foreground">Há 5 horas</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onNavigate("notifications")}>
                <div className="flex flex-col gap-1">
                  <span>Voto contabilizado</span>
                  <span className="text-muted-foreground">Há 1 dia</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  {userInitial ? (
                    <span className="font-medium">{userInitial}</span>
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                {userName ? `Bem-vindo, ${userName}` : "Minha Conta"}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onNavigate("settings")}>
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  if (onLogout) {
                    void onLogout();
                  } else {
                    onNavigate("auth");
                  }
                }}
              >
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </>
  );
}
