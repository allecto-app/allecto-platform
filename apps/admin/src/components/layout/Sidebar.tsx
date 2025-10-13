import { Home, FileText, Users, Building2, Settings, ChevronLeft, ChevronRight, Globe, Wrench, Bell, BarChart3 } from "lucide-react";
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
  { name: "Tenants", icon: Globe, page: "tenants" },
  { name: "Onboarding", icon: Building2, page: "onboarding" },
  { name: "Audit", icon: BarChart3, page: "audit" },
  { name: "Support", icon: Wrench, page: "support" },
];

const tenantNavigation = [
  { name: "Dashboard", icon: Home, page: "dashboard" },
  { name: "Atas", icon: FileText, page: "minutes" },
  { name: "Moradores", icon: Users, page: "residents" },
  { name: "Unidades", icon: Building2, page: "units" },
  { name: "Notificações", icon: Bell, page: "notifications" },
  { name: "Configurações", icon: Settings, page: "settings" },
];

export function Sidebar({ currentPage, onNavigate, collapsed, onToggleCollapse, mode = "tenant", selectedCondo }: SidebarProps) {
  const isPlatformMode = mode === "platform";
  const hasCondoSelected = !!selectedCondo;

  const renderNavItem = (item: typeof platformNavigation[0], disabled = false) => {
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
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <span className="text-primary-foreground">A</span>
            </div>
            <span className="text-foreground">Allecto Admin</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className={cn("h-8 w-8", collapsed && "mx-auto")}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
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
      </ScrollArea>
    </div>
  );
}
