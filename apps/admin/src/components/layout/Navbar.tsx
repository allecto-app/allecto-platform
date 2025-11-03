import { useMemo } from "react";
import { useQuery } from "convex/react";
import { Bell, User, Menu, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "../ui/button";
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
import { api, Doc, Id } from "../../lib/convexGenerated";
import { useEntitlements } from "../../hooks/useEntitlements";
import { notificationFormatter } from "src/utils/textFormatter";

interface NavbarProps {
  onToggleSidebar?: () => void;
  onNavigate: (page: string) => void;
  mode?: "platform" | "tenant";
  condos?: Doc<"condos">[] | undefined;
  selectedCondo?: Doc<"condos"> | null;
  onSelectCondo?: (condoId: Id<"condos"> | null) => void;
  onLogout?: () => void;
  userName?: string;
  sessionToken?: string;
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
  sessionToken,
}: NavbarProps) {
  const isPlatformMode = mode === "platform";
  const userInitial = userName ? userName.charAt(0).toUpperCase() : null;
  const condoId = selectedCondo?._id ?? null;
  const notificationArgs = useMemo(() => {
    if (!sessionToken) return "skip" as const;
    return {
      condoId: condoId ?? undefined,
      limit: 5,
    } as const;
  }, [condoId, sessionToken]);
  const notifications = useQuery(api.notifications.listLogs, notificationArgs);
  const isLoadingNotifications =
    condoId !== null && notifications === undefined;
  const headerNotifications = Array.isArray(notifications)
    ? notifications.slice(0, 5)
    : [];
  const unreadCount = headerNotifications.length;
  const { data: entitlements } = useEntitlements(
    condoId ? selectedCondo?._id ?? null : null
  );
  const showDunningBanner = Boolean(entitlements?.inDunning);

  return (
    <>
      {isPlatformMode && (
        <Alert className="rounded-none border-x-0 border-t-0 bg-info/10">
          <AlertDescription className="text-center">
            <strong>Super Admin Mode</strong> — Condo:{" "}
            {selectedCondo
              ? `${selectedCondo.name} (${selectedCondo.subdomain})`
              : "None selected"}
          </AlertDescription>
        </Alert>
      )}
      {showDunningBanner && (
        <Alert
          variant="destructive"
          className="rounded-none border-x-0 border-t-0"
        >
          <AlertDescription className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" />
              <span>
                Pagamento pendente detectado. Atualize seus dados de cobrança
                para evitar interrupções.
              </span>
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onNavigate("billing")}
            >
              Revisar assinatura
            </Button>
          </AlertDescription>
        </Alert>
      )}
      <header className="flex items-center gap-3 border-b border-border bg-background px-4 py-3 md:h-16 md:flex-nowrap md:gap-4 md:px-6 md:py-0">
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

        {isPlatformMode && onSelectCondo && (
          <CondoSwitcher
            condos={condos ?? []}
            selectedCondoId={selectedCondo?._id ?? null}
            onSelectCondo={onSelectCondo}
          />
        )}

        <div className="flex w-full items-center justify-end gap-2 md:ml-auto md:w-auto">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {isLoadingNotifications ? (
                  <Loader2 className="absolute -right-1 -top-1 h-3.5 w-3.5 animate-spin text-muted-foreground" />
                ) : unreadCount > 0 ? (
                  <Badge
                    variant="destructive"
                    className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]"
                  >
                    {unreadCount}
                  </Badge>
                ) : null}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notificações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isLoadingNotifications ? (
                <DropdownMenuItem disabled>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando notificações...
                  </div>
                </DropdownMenuItem>
              ) : headerNotifications.length === 0 ? (
                <DropdownMenuItem disabled>
                  <span className="text-muted-foreground">
                    Nenhuma notificação recente.
                  </span>
                </DropdownMenuItem>
              ) : (
                headerNotifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification._id as string}
                    onClick={() => onNavigate("notifications")}
                  >
                    <div className="flex flex-col gap-1">
                      <span className="capitalize">
                        {notificationFormatter(notification.template)}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {new Intl.DateTimeFormat("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "2-digit",
                          month: "2-digit",
                        }).format(new Date(notification.createdAt))}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onNavigate("notifications")}>
                Ver todas as notificações
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
