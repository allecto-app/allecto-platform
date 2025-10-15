import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { Sidebar } from "./components/layout/Sidebar";
import { Navbar } from "./components/layout/Navbar";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DesignTokensPage } from "./pages/DesignTokensPage";
import { ComponentLibraryPage } from "./pages/ComponentLibraryPage";
import { MinutesListPage } from "./pages/MinutesListPage";
import { MinutesNewPage } from "./pages/MinutesNewPage";
import { MinutesDetailPage } from "./pages/MinutesDetailPage";
import { ResidentsListPage } from "./pages/ResidentsListPage";
import { ResidentDetailPage } from "./pages/ResidentDetailPage";
import { ResidentEditPage } from "./pages/ResidentEditPage";
import { UnitsListPage } from "./pages/UnitsListPage";
import { UnitDetailPage } from "./pages/UnitDetailPage";
import { UnitEditPage } from "./pages/UnitEditPage";
import { SettingsPage } from "./pages/SettingsPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { TenantsPage } from "./pages/TenantsPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { AuditPage } from "./pages/AuditPage";
import { SupportPage } from "./pages/SupportPage";
import { Toaster } from "./components/ui/sonner";
import { Button } from "./components/ui/button";
import { Palette, Package } from "lucide-react";
import { api, Doc, Id } from "./lib/convexGenerated";
import { AdminAuthSession } from "./lib/authSession";

type UserMode = "platform" | "tenant";

type CondoDoc = Doc<"condos">;


const AUTH_STORAGE_KEY = "allecto-admin-auth";

export default function App() {
  const [auth, setAuth] = useState<AdminAuthSession | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored) as Partial<AdminAuthSession>;
      const baseValid =
        parsed &&
        typeof parsed.token === "string" &&
        parsed.token.length >= 32 &&
        Array.isArray(parsed.roles) &&
        typeof parsed.expiresAt === "number" &&
        parsed.expiresAt > Date.now() &&
        (parsed.type === "platform" || parsed.type === "resident");
      const platformValid =
        baseValid &&
        parsed.type === "platform" &&
        typeof parsed.userId === "string";
      const residentValid =
        baseValid &&
        parsed.type === "resident" &&
        typeof parsed.userId === "string" &&
        typeof parsed.condoId === "string" &&
        typeof parsed.condoName === "string" &&
        typeof parsed.condoSubdomain === "string";
      if (platformValid || residentValid) {
        setAuth(parsed as AdminAuthSession);
      } else {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (auth) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
    } else {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [auth]);

  const handleLogin = (session: AdminAuthSession) => {
    if (!session.token || session.token.length < 32 || session.expiresAt <= Date.now()) {
      return;
    }
    if (session.type === "resident") {
      if (!session.condoId || !session.condoName || !session.condoSubdomain) {
        return;
      }
    }
    setAuth(session);
  };

  const handleLogout = async () => {
    if (auth?.token && typeof window !== "undefined") {
      try {
        await fetch("/api/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: auth.token }),
        });
      } catch {
        // swallow network errors; we'll still clear the local session
      }
    }
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    setAuth(null);
  };

  if (!auth) {
    return (
      <>
        <AuthPage onLogin={handleLogin} />
        <Toaster />
      </>
    );
  }

  return (
    <>
      <AuthenticatedShell auth={auth} onUpdateAuth={setAuth} onLogout={handleLogout} />
      <Toaster />
    </>
  );
}

function AuthenticatedShell({
  auth,
  onUpdateAuth,
  onLogout,
}: {
  auth: AdminAuthSession;
  onUpdateAuth: (auth: AdminAuthSession | null) => void;
  onLogout: () => Promise<void> | void;
}) {
  const canSeePlatform =
    auth.type === "platform" && (auth.roles.includes("super_admin") || auth.roles.includes("support"));
  const isResident = auth.type === "resident";

  const [currentPage, setCurrentPage] = useState<string>(
    canSeePlatform ? "tenants" : isResident ? "minutes" : "dashboard",
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMode, setUserMode] = useState<UserMode>(canSeePlatform ? "platform" : "tenant");
  const initialCondoId = auth.type === "resident" ? auth.condoId : null;
  const [selectedCondoId, setSelectedCondoId] = useState<Id<"condos"> | null>(initialCondoId);

  const platformCondos = useQuery(
    api.platform.listCondos,
    canSeePlatform ? { sessionToken: auth.token, limit: 500 } : "skip",
  );

  const residentCondo = useQuery(
    api.condos.getBySubdomain,
    isResident && auth.condoSubdomain ? { subdomain: auth.condoSubdomain } : "skip",
  );

  const condos: Doc<"condos">[] | undefined = useMemo(() => {
    if (canSeePlatform) {
      return platformCondos ?? undefined;
    }
    if (isResident) {
      return residentCondo ? [residentCondo] : residentCondo === null ? [] : undefined;
    }
    return undefined;
  }, [canSeePlatform, isResident, platformCondos, residentCondo]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const msUntilExpiry = Math.max(auth.expiresAt - Date.now(), 0);
    const timer = window.setTimeout(() => {
      onUpdateAuth(null);
    }, msUntilExpiry);
    return () => window.clearTimeout(timer);
  }, [auth, onUpdateAuth]);

  useEffect(() => {
    if (!canSeePlatform) {
      setUserMode("tenant");
    }
  }, [canSeePlatform]);

  useEffect(() => {
    if (!condos || condos.length === 0) return;
    if (!selectedCondoId) {
      setSelectedCondoId(condos[0]._id);
    }
  }, [condos, selectedCondoId]);

  useEffect(() => {
    if (!condos || selectedCondoId === null) return;
    const exists = condos.some((condo) => condo._id === selectedCondoId);
    if (!exists) {
      setSelectedCondoId(condos[0]?._id ?? null);
    }
  }, [condos, selectedCondoId]);

  useEffect(() => {
    if (isResident && auth.condoId && selectedCondoId !== auth.condoId) {
      setSelectedCondoId(auth.condoId);
    }
  }, [isResident, auth, selectedCondoId]);

  const selectedCondo: CondoDoc | null = useMemo(() => {
    if (!selectedCondoId || !condos) return null;
    return condos.find((condo) => condo._id === selectedCondoId) ?? null;
  }, [condos, selectedCondoId]);

  const restrictedPlatformPages = new Set(["tenants", "onboarding", "audit", "support"]);

  useEffect(() => {
    if (!canSeePlatform && restrictedPlatformPages.has(currentPage)) {
      setCurrentPage(isResident ? "minutes" : "dashboard");
    }
  }, [canSeePlatform, currentPage, isResident]);

  const handleNavigate = (page: string) => {
    if (!canSeePlatform && restrictedPlatformPages.has(page)) {
      return;
    }
    setCurrentPage(page);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  const handleSelectCondo = (condoId: Id<"condos"> | null) => {
    if (!canSeePlatform) {
      return;
    }
    setSelectedCondoId(condoId);
    setUserMode(condoId ? "tenant" : "platform");
  };

  const handleLogout = async () => {
    await onLogout();
  };

  const isLoadingCondos =
    canSeePlatform ? platformCondos === undefined : isResident ? condos === undefined : false;

  if (currentPage === "design-tokens" || currentPage === "component-library") {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b border-border bg-background">
          <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
                <span className="text-primary-foreground">A</span>
              </div>
              <span className="text-foreground">Allecto Admin - Design System</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant={currentPage === "design-tokens" ? "default" : "ghost"}
                onClick={() => setCurrentPage("design-tokens")}
              >
                <Palette className="mr-2 h-4 w-4" />
                Design Tokens
              </Button>
              <Button
                variant={currentPage === "component-library" ? "default" : "ghost"}
                onClick={() => setCurrentPage("component-library")}
              >
                <Package className="mr-2 h-4 w-4" />
                Components
              </Button>
              <Button variant="outline" onClick={() => setCurrentPage("dashboard")}>
                Back to App
              </Button>
            </div>
          </div>
        </div>
        <div className="container mx-auto max-w-7xl p-6">
          {currentPage === "design-tokens" && <DesignTokensPage />}
          {currentPage === "component-library" && <ComponentLibraryPage />}
        </div>
      </div>
    );
  }

  const sidebarMode: UserMode = canSeePlatform ? userMode : "tenant";
  const showPlatformSections = canSeePlatform;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        currentPage={currentPage}
        onNavigate={(page) => {
          if (page === "__logout") {
            void handleLogout();
            return;
          }
          handleNavigate(page);
        }}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        mode={sidebarMode}
        selectedCondo={selectedCondo}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar
          onToggleSidebar={toggleSidebar}
          onNavigate={handleNavigate}
          mode={showPlatformSections ? userMode : "tenant"}
          condos={condos}
          selectedCondo={selectedCondo}
          onSelectCondo={showPlatformSections ? handleSelectCondo : undefined}
          onLogout={handleLogout}
          userName={auth.name}
        />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
          <div className="mx-auto max-w-7xl">
            {currentPage === "dashboard" && (
              <div className="mb-6 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage("design-tokens")}
                >
                  <Palette className="mr-2 h-4 w-4" />
                  Design Tokens
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage("component-library")}
                >
                  <Package className="mr-2 h-4 w-4" />
                  Component Library
                </Button>
              </div>
            )}

            {showPlatformSections && currentPage === "tenants" && (
              <TenantsPage
                onNavigate={handleNavigate}
                condos={condos}
                isLoading={isLoadingCondos}
                onSelectCondo={handleSelectCondo}
                selectedCondoId={selectedCondoId}
              />
            )}
            {showPlatformSections && currentPage === "onboarding" && (
              <OnboardingPage
                onNavigate={handleNavigate}
                onSelectCondo={handleSelectCondo}
                sessionToken={auth.token}
              />
            )}
            {showPlatformSections && currentPage === "audit" && <AuditPage />}
            {showPlatformSections && currentPage === "support" && (
              <SupportPage onNavigate={handleNavigate} onSelectCondo={handleSelectCondo} />
            )}

            {currentPage === "dashboard" && (
              <DashboardPage condos={condos} selectedCondo={selectedCondo} />
            )}
            {currentPage === "minutes" && (
              <MinutesListPage onNavigate={handleNavigate} condoId={selectedCondo?._id ?? null} />
            )}
            {currentPage === "minutes-new" && (
              <MinutesNewPage onNavigate={handleNavigate} condo={selectedCondo} />
            )}
            {currentPage === "minutes-detail" && (
              <MinutesDetailPage onNavigate={handleNavigate} condoId={selectedCondo?._id ?? null} />
            )}
            {currentPage === "residents" && (
              <ResidentsListPage onNavigate={handleNavigate} condo={selectedCondo} />
            )}
            {currentPage === "resident-detail" && (
              <ResidentDetailPage onNavigate={handleNavigate} condoId={selectedCondo?._id ?? null} />
            )}
            {currentPage === "resident-edit" && (
              <ResidentEditPage onNavigate={handleNavigate} condoId={selectedCondo?._id ?? null} />
            )}
            {currentPage === "units" && (
              <UnitsListPage onNavigate={handleNavigate} condo={selectedCondo} />
            )}
            {currentPage === "unit-detail" && (
              <UnitDetailPage onNavigate={handleNavigate} condoId={selectedCondo?._id ?? null} />
            )}
            {currentPage === "unit-edit" && (
              <UnitEditPage onNavigate={handleNavigate} condoId={selectedCondo?._id ?? null} />
            )}
            {currentPage === "settings" && <SettingsPage />}
            {currentPage === "notifications" && <NotificationsPage />}
          </div>
        </main>
      </div>
    </div>
  );
}
