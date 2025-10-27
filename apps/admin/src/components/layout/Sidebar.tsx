import { useMemo } from "react";
import { Home, FileText, Users, Building2, Settings, ChevronLeft, ChevronRight, Globe, Wrench, Bell, BarChart3, LogOut, X } from "lucide-react";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { cn } from "../ui/utils";
import { Separator } from "../ui/separator";
import { Doc } from "../../lib/convexGenerated";

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mode?: "platform" | "tenant";
  selectedCondo?: Doc<"condos"> | null;
}

const platformNavigation = [
  { name: "Dashboard", icon: Home, page: "dashboard" },
  { name: "Condomínios", icon: Globe, page: "tenants" },
  { name: "Criar Condomínio", icon: Building2, page: "onboarding" },
  { name: "Auditoria", icon: BarChart3, page: "audit" },
  { name: "Suporte", icon: Wrench, page: "support" },
];

const tenantNavigation = [
  { name: "Dashboard", icon: Home, page: "dashboard" },
  { name: "Atas", icon: FileText, page: "minutes" },
  { name: "Moradores", icon: Users, page: "residents" },
  { name: "Unidades", icon: Building2, page: "units" },
  { name: "Notificações", icon: Bell, page: "notifications" },
  { name: "Configurações", icon: Settings, page: "settings" },
];

const logoutNavigation = { name: "Sair", icon: LogOut, page: "__logout" } as const;

export function Sidebar({ currentPage, onNavigate, collapsed, onToggleCollapse, mode = "tenant", selectedCondo }: SidebarProps) {
  const isPlatformMode = mode === "platform";
  const hasCondoSelected = !!selectedCondo;
  const branding = selectedCondo?.branding;
  const condoName = branding?.displayName?.trim() || selectedCondo?.name || "Allecto Admin";

  const condoInitials = useMemo(() => {
    if (!condoName) return "A";
    const parts = condoName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "A";
    const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
    return initials || "A";
  }, [condoName]);

  const condoLogoUrl = branding?.logoUrl ?? null;

  const renderNavItem = (
    item:
      | (typeof platformNavigation)[number]
      | (typeof tenantNavigation)[number]
      | typeof logoutNavigation,
    disabled = false,
  ) => {
    const Icon = item.icon;
    const isActive = currentPage === item.page;

    const button = (
      <button
        key={item.page}
        onClick={() => !disabled && onNavigate(item.page)}
        disabled={disabled}
        className={cn(
          "flex w-full items-center gap-3 rounded-md px-3 py-2 transition-colors",
          disabled && "cursor-not-allowed opacity-50",
          !disabled && isActive && "bg-sidebar-primary text-sidebar-primary-foreground",
          !disabled && !isActive && "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )}
      >
        <Icon className="h-5 w-5 shrink-0" />
        {!collapsed && <span>{item.name}</span>}
      </button>
    );

    if (disabled && !collapsed) {
      return (
        <TooltipProvider key={item.page}>
          <Tooltip>
            <TooltipTrigger asChild>{button}</TooltipTrigger>
            <TooltipContent side="right">
              Select a condo to enter tenant view
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return button;
  };

  return (
    <div
      className={cn(
        "relative h-screen border-r border-border bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        <div
          className={cn(
            "flex items-center gap-2 transition-opacity",
            collapsed ? "justify-center" : "justify-start",
          )}
        >
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-md bg-primary text-primary-foreground">
            {condoLogoUrl ? (
              <img src={condoLogoUrl} alt={condoName} className="h-full w-full object-cover" />
            ) : (
              <span>{condoInitials}</span>
            )}
          </div>
          {!collapsed && (
            <span className="max-w-[160px] truncate text-foreground">
              {condoName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="h-8 w-8 shrink-0 md:hidden"
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className={cn("hidden h-8 w-8 md:inline-flex", collapsed && "mx-auto")}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-4rem)]">
        <nav className="space-y-1 p-2">
          {isPlatformMode ? (
            <>
              {!collapsed && (
                <div className="px-3 py-2 text-muted-foreground">Platform</div>
              )}
              {platformNavigation.map((item) => renderNavItem(item))}

              <Separator className="my-2" />

              {!collapsed && (
                <div className="px-3 py-2 text-muted-foreground">Tenant Views</div>
              )}
              {tenantNavigation.map((item) => renderNavItem(item, !hasCondoSelected))}
            </>
          ) : (
            tenantNavigation.map((item) => renderNavItem(item))
          )}
        </nav>
        <div className="p-2">
          {renderNavItem(logoutNavigation)}
        </div>
      </ScrollArea>
    </div>
  );
}
