"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { Sidebar } from "./components/layout/Sidebar";
import { Navbar } from "./components/layout/Navbar";
import { AuthPage } from "./screens/AuthPage";
import { DashboardPage } from "./screens/DashboardPage";
import { DesignTokensPage } from "./screens/DesignTokensPage";
import { ComponentLibraryPage } from "./screens/ComponentLibraryPage";
import { MinutesListPage } from "./screens/MinutesListPage";
import { MinutesNewPage } from "./screens/MinutesNewPage";
import { MinutesDetailPage } from "./screens/MinutesDetailPage";
import { ResidentsListPage } from "./screens/ResidentsListPage";
import { ResidentDetailPage } from "./screens/ResidentDetailPage";
import { ResidentEditPage } from "./screens/ResidentEditPage";
import { UnitsListPage } from "./screens/UnitsListPage";
import { UnitDetailPage } from "./screens/UnitDetailPage";
import { UnitEditPage } from "./screens/UnitEditPage";
import { SettingsPage } from "./screens/SettingsPage";
import { NotificationsPage } from "./screens/NotificationsPage";
import { TenantsPage } from "./screens/TenantsPage";
import { OnboardingPage } from "./screens/OnboardingPage";
import { AuditPage } from "./screens/AuditPage";
import { SupportPage } from "./screens/SupportPage";
import { Toaster } from "./components/ui/sonner";
import { Button } from "./components/ui/button";
import { Palette, Package, Loader2 } from "lucide-react";
import { api, Doc, Id } from "./lib/convexGenerated";
import { applyBrandingTheme } from "./lib/brandingTheme";
import type { ResidentRecord } from "./types/resident";
import type { UnitRecord } from "./types/unit";
import { AdminAuthSession } from "./lib/authSession";
import { useHostInfo } from "./lib/hostContext";

type UserMode = "platform" | "tenant";

type CondoDoc = Doc<"condos">;


const AUTH_STORAGE_KEY = "allecto-admin-auth";
const PAGE_STORAGE_KEY = "allecto-admin-current-page";

function readStoredSession(
  hostSubdomain: string | null,
  isCondoHost: boolean,
): AdminAuthSession | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!stored) return null;
  try {
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
      baseValid && parsed.type === "platform" && typeof parsed.userId === "string";
    const residentValid =
      baseValid &&
      parsed.type === "resident" &&
      typeof parsed.userId === "string" &&
      typeof parsed.condoId === "string" &&
      typeof parsed.condoName === "string" &&
      typeof parsed.condoSubdomain === "string";
    const hostAligned = !isCondoHost
      ? true
      : parsed?.type === "resident" && parsed.condoSubdomain === hostSubdomain;

    if (hostAligned && (platformValid || residentValid)) {
      return parsed as AdminAuthSession;
    }
  } catch {
    // fall through and clear below
  }
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  return null;
}

export default function App() {
  const hostInfo = useHostInfo();
  const hostSubdomain = hostInfo.subdomain ?? null;
  const isCondoHost = hostInfo.isCondoSubdomain;
  const [auth, setAuth] = useState<AdminAuthSession | null>(null);
  const [isAuthResolved, setIsAuthResolved] = useState(false);

  async function syncSessionCookie(token: string, expiresAt: number) {
    try {
      await fetch("/api/session/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, expiresAt }),
        credentials: "same-origin",
      });
    } catch (error) {
      console.error("Failed to sync admin session cookie", error);
    }
  }

  useEffect(() => {
    const stored = readStoredSession(hostSubdomain, isCondoHost);
    setAuth(stored);
    setIsAuthResolved(true);
  }, [hostSubdomain, isCondoHost]);

  useEffect(() => {
    if (!isAuthResolved || typeof window === "undefined") return;
    if (auth) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
    } else {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [auth, isAuthResolved]);

  useEffect(() => {
    if (!auth || !auth.token || auth.token.length < 32 || auth.expiresAt <= Date.now()) {
      return;
    }
    void syncSessionCookie(auth.token, auth.expiresAt);
  }, [auth?.token, auth?.expiresAt]);

  const handleLogin = (session: AdminAuthSession) => {
    if (!session.token || session.token.length < 32 || session.expiresAt <= Date.now()) {
      return;
    }
    if (session.type === "resident") {
      if (!session.condoId || !session.condoName || !session.condoSubdomain) {
        return;
      }
    }
    if (isCondoHost) {
      if (session.type !== "resident") {
        console.warn("Platform sessions are not allowed on condo subdomains");
        return;
      }
      if (session.condoSubdomain !== hostSubdomain) {
        console.warn("Resident session does not match current subdomain");
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
      try {
        await fetch("/api/session/sync", {
          method: "DELETE",
          credentials: "same-origin",
        });
      } catch (error) {
        console.error("Failed to clear admin session cookie", error);
      }
    }
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    setAuth(null);
  };

  if (!isAuthResolved) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Carregando...</span>
        </div>
        <Toaster />
      </div>
    );
  }

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
  const hostInfo = useHostInfo();
  const isPortalDomain = hostInfo.isPortal;
  const isCondoDomain = hostInfo.isCondoSubdomain;

  const canSeePlatform =
    isPortalDomain &&
    auth.type === "platform" &&
    (auth.roles.includes("super_admin") || auth.roles.includes("support"));
  const canPlatformInvite =
    isPortalDomain &&
    auth.type === "platform" &&
    (auth.roles.includes("super_admin") ||
      auth.roles.includes("support") ||
      auth.roles.includes("ops"));
  const isResident = auth.type === "resident";

  const defaultPage = canSeePlatform ? "tenants" : isResident || isCondoDomain ? "minutes" : "dashboard";
  const storedPage = typeof window !== "undefined" ? window.localStorage.getItem(PAGE_STORAGE_KEY) : null;
  const initialPage = storedPage ?? defaultPage;
  const [currentPage, setCurrentPage] = useState<string>(initialPage);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMode, setUserMode] = useState<UserMode>(canSeePlatform ? "platform" : "tenant");
  const initialCondoId = auth.type === "resident" ? auth.condoId : null;
  const [selectedCondoId, setSelectedCondoId] = useState<Id<"condos"> | null>(initialCondoId);
  const [selectedResidentId, setSelectedResidentId] = useState<Id<"residents"> | null>(null);
  const [selectedResident, setSelectedResident] = useState<ResidentRecord | null>(null);
  const [selectedCondoOverride, setSelectedCondoOverride] = useState<CondoDoc | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<Id<"units"> | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<UnitRecord | null>(null);
  const [selectedMinuteId, setSelectedMinuteId] = useState<Id<"minutes"> | null>(null);
  const [selectedMinute, setSelectedMinute] = useState<Doc<"minutes"> | null>(null);

  const platformCondos = useQuery(
    api.platform.listCondos,
    canSeePlatform ? { sessionToken: auth.token, limit: 500 } : "skip",
  );

  const residentSubdomain = isResident
    ? auth.condoSubdomain ?? hostInfo.subdomain ?? null
    : null;

  const residentCondo = useQuery(
    api.condos.getBySubdomain,
    isResident && residentSubdomain ? { subdomain: residentSubdomain } : "skip",
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
    if (!canSeePlatform || isCondoDomain) {
      setUserMode("tenant");
    }
  }, [canSeePlatform, isCondoDomain]);

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

  const baseSelectedCondo: CondoDoc | null = useMemo(() => {
    if (!selectedCondoId || !condos) return null;
    return condos.find((condo) => condo._id === selectedCondoId) ?? null;
  }, [condos, selectedCondoId]);

  useEffect(() => {
    if (!baseSelectedCondo) {
      setSelectedCondoOverride(null);
      return;
    }
    setSelectedCondoOverride((prev) => {
      if (!prev) return prev;
      if (prev._id !== baseSelectedCondo._id) {
        return null;
      }
      if ((prev.updatedAt ?? 0) < (baseSelectedCondo.updatedAt ?? 0)) {
        return null;
      }
      return prev;
    });
  }, [baseSelectedCondo?._id, baseSelectedCondo?.updatedAt]);

  const selectedCondo: CondoDoc | null = useMemo(() => {
    if (selectedCondoOverride && selectedCondoOverride._id === baseSelectedCondo?._id) {
      if (
        !baseSelectedCondo ||
        (selectedCondoOverride.updatedAt ?? 0) >= (baseSelectedCondo.updatedAt ?? 0)
      ) {
        return selectedCondoOverride;
      }
    }
    return baseSelectedCondo ?? selectedCondoOverride ?? null;
  }, [baseSelectedCondo, selectedCondoOverride]);

  useEffect(() => {
    applyBrandingTheme(selectedCondo?.branding);
  }, [
    selectedCondo?.branding?.primaryColor,
    selectedCondo?.branding?.secondaryColor,
    selectedCondo?.branding?.accentColor,
    selectedCondo?.branding?.logoUrl,
  ]);

  useEffect(() => {
    if (!selectedCondo) {
      setSelectedUnitId(null);
      setSelectedUnit(null);
      setSelectedMinuteId(null);
      setSelectedMinute(null);
    }
  }, [selectedCondo]);

  const restrictedPlatformPages = new Set(["tenants", "onboarding", "audit", "support"]);

  useEffect(() => {
    if ((!canSeePlatform || isCondoDomain) && restrictedPlatformPages.has(currentPage)) {
      setCurrentPage(isResident ? "minutes" : "dashboard");
    }
  }, [canSeePlatform, currentPage, isResident, isCondoDomain]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(PAGE_STORAGE_KEY, currentPage);
  }, [currentPage]);

  const handleNavigate = (page: string) => {
    if ((!canSeePlatform || isCondoDomain) && restrictedPlatformPages.has(page)) {
      return;
    }
    if (page !== "minutes-detail") {
      setSelectedMinuteId(null);
      setSelectedMinute(null);
    }
    setCurrentPage(page);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(PAGE_STORAGE_KEY, page);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(PAGE_STORAGE_KEY, currentPage);
  }, [currentPage]);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  const handleSelectCondo = (condoId: Id<"condos"> | null) => {
    if (!canSeePlatform || isCondoDomain) {
      return;
    }
    setSelectedCondoId(condoId);
    setUserMode(condoId ? "tenant" : "platform");
    setSelectedMinuteId(null);
    setSelectedMinute(null);
  };

  const handleLogout = async () => {
    await onLogout();
  };

  const handleSelectMinute = (minute: Doc<"minutes">) => {
    setSelectedMinuteId(minute._id);
    setSelectedMinute(minute);
    setCurrentPage("minutes-detail");
  };

  const isLoadingCondos =
    canSeePlatform && !isCondoDomain
      ? platformCondos === undefined
      : isResident
      ? condos === undefined
      : false;

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

  const sidebarMode: UserMode = canSeePlatform && !isCondoDomain ? userMode : "tenant";
  const showPlatformSections = canSeePlatform && !isCondoDomain;
  const canInviteSyndic =
    (canPlatformInvite && !isCondoDomain) ||
    (isResident && (auth.roles.includes("syndic") || auth.roles.includes("manager")));

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
          sessionToken={auth.token}
        />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
          <div className="mx-auto max-w-7xl">
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
              <MinutesListPage
                onNavigate={handleNavigate}
                condoId={selectedCondo?._id ?? null}
                sessionToken={auth.token}
                onSelectMinute={handleSelectMinute}
              />
            )}
            {currentPage === "minutes-new" && (
              <MinutesNewPage
                onNavigate={handleNavigate}
                condo={selectedCondo}
                sessionToken={auth.token}
              />
            )}
            {currentPage === "minutes-detail" && (
              <MinutesDetailPage
                onNavigate={handleNavigate}
                condoId={selectedCondo?._id ?? null}
                condo={selectedCondo}
                minuteId={selectedMinuteId}
                minuteFallback={selectedMinute}
                sessionToken={auth.token}
              />
            )}
            {currentPage === "residents" && (
              <ResidentsListPage
                onNavigate={handleNavigate}
                condo={selectedCondo}
                canInviteSyndic={canInviteSyndic}
                onSelectResident={(resident) => {
                  const record: ResidentRecord = {
                    id: resident._id,
                    name: resident.name,
                    email: resident.email ?? null,
                    phone: resident.phone ?? null,
                    role: resident.role,
                    isActive: resident.isActive,
                    condoId: resident.condoId,
                    condoName: null,
                    condoSubdomain: null,
                    createdAt: resident.createdAt,
                    updatedAt: resident.updatedAt,
                  };
                  setSelectedResidentId(record.id);
                  setSelectedResident(record);
                }}
              />
            )}
            {currentPage === "resident-detail" && (
              <ResidentDetailPage
                onNavigate={handleNavigate}
                condoId={selectedCondo?._id ?? null}
                residentId={selectedResidentId}
                residentFallback={selectedResident}
                onResidentLoaded={(resident) => {
                  setSelectedResidentId(resident.id);
                  setSelectedResident(resident);
                }}
              />
            )}
            {currentPage === "resident-edit" && (
              <ResidentEditPage
                onNavigate={handleNavigate}
                condoId={selectedCondo?._id ?? null}
                residentId={selectedResidentId}
                residentFallback={selectedResident}
                onResidentUpdated={(resident) => {
                  setSelectedResidentId(resident.id);
                  setSelectedResident(resident);
                }}
              />
            )}
            {currentPage === "units" && (
              <UnitsListPage
                onNavigate={handleNavigate}
                condo={selectedCondo}
                onSelectUnit={(unit) => {
                  const record: UnitRecord = {
                    id: unit._id,
                    condoId: unit.condoId,
                    code: unit.code,
                    block: unit.block ?? null,
                    floor: unit.floor ?? null,
                    createdAt: unit.createdAt,
                    updatedAt: unit.updatedAt,
                    condoName: selectedCondo?.name ?? null,
                  };
                  setSelectedUnitId(record.id);
                  setSelectedUnit(record);
                }}
              />
            )}
            {currentPage === "unit-detail" && (
              <UnitDetailPage
                onNavigate={handleNavigate}
                condoId={selectedCondo?._id ?? null}
                unitId={selectedUnitId}
                unitFallback={selectedUnit}
                onUnitLoaded={(unit) => {
                  setSelectedUnitId(unit.id);
                  setSelectedUnit(unit);
                }}
              />
            )}
            {currentPage === "unit-edit" && (
              <UnitEditPage
                onNavigate={handleNavigate}
                condoId={selectedCondo?._id ?? null}
                unitId={selectedUnitId}
                unitFallback={selectedUnit}
                onUnitLoaded={(unit) => {
                  setSelectedUnitId(unit.id);
                  setSelectedUnit(unit);
                }}
                onUnitUpdated={(unit) => {
                  setSelectedUnitId(unit.id);
                  setSelectedUnit(unit);
                }}
                onUnitDeleted={() => {
                  setSelectedUnitId(null);
                  setSelectedUnit(null);
                }}
              />
            )}
            {currentPage === "settings" && (
              <SettingsPage
                condo={selectedCondo}
                onBrandingApplied={(branding) => applyBrandingTheme(branding)}
                onCondoUpdated={(condoDoc) => {
                  setSelectedCondoOverride(condoDoc);
                  applyBrandingTheme(condoDoc.branding);
                }}
              />
            )}
            {currentPage === "notifications" && (
              <NotificationsPage
                condoId={selectedCondo?._id ?? null}
                condo={selectedCondo}
                sessionToken={auth.token}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
