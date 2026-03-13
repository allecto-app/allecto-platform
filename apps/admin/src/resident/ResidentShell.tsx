import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { Sidebar } from "../components/layout/Sidebar";
import { ResidentNavbar } from "./ResidentNavbar";
import { applyBrandingTheme } from "../lib/brandingTheme";
import { api, Id, type Doc } from "../lib/convexGenerated";
import type { AdminAuthSession } from "../lib/authSession";
import type { ResidentRecord } from "../types/resident";
import { ResidentMinutesPage } from "./ResidentMinutesPage";
import { ResidentMinuteDetailPage } from "./ResidentMinuteDetailPage";
import { ResidentUnitPage } from "./ResidentUnitPage";
import { ResidentProfilePage } from "./ResidentProfilePage";
import { ResidentCommunicationsPage } from "./ResidentCommunicationsPage";
import { cn } from "../components/ui/utils";

type ResidentAuth = Extract<AdminAuthSession, { type: "resident" }>;

type ResidentUnitLink = {
  unitId: Id<"units">;
  code: string;
  block: string | null;
  role: string | null;
};

const RESIDENT_PAGE_STORAGE_KEY = "allecto-resident-current-page";

type ResidentPage =
  | "resident:minutes"
  | "resident:minute-detail"
  | "resident:unit"
  | "resident:profile"
  | "resident:communications";

interface ResidentShellProps {
  auth: ResidentAuth;
  onLogout: () => Promise<void> | void;
  onUpdateAuth: (auth: AdminAuthSession | null) => void;
}

export function ResidentShell({ auth, onLogout, onUpdateAuth }: ResidentShellProps) {
  const [currentPage, setCurrentPage] = useState<ResidentPage>(() => {
    if (typeof window === "undefined") return "resident:minutes";
    const stored = window.localStorage.getItem(RESIDENT_PAGE_STORAGE_KEY);
    const allowed: ResidentPage[] = [
      "resident:minutes",
      "resident:minute-detail",
      "resident:unit",
      "resident:profile",
      "resident:communications",
    ];
    return allowed.includes(stored as ResidentPage) ? (stored as ResidentPage) : "resident:minutes";
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedMinuteId, setSelectedMinuteId] = useState<Id<"minutes"> | null>(null);

  const condo = useQuery(api.condos.getBySubdomain, { subdomain: auth.condoSubdomain }) as Doc<"condos"> | undefined;
  const residentDetail = useQuery(api.residentDetail.get, { residentId: auth.userId }) as
    | {
        resident: ResidentRecord;
        units: ResidentUnitLink[];
        activities: unknown[];
      }
    | null
    | undefined;

  const resident = residentDetail?.resident ?? null;
  const units = residentDetail?.units ?? [];

  useEffect(() => {
    if (!condo?.branding) return;
    applyBrandingTheme(condo.branding);
  }, [
    condo?.branding?.primaryColor,
    condo?.branding?.secondaryColor,
    condo?.branding?.accentColor,
    condo?.branding?.logoUrl,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(RESIDENT_PAGE_STORAGE_KEY, currentPage);
  }, [currentPage]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const msUntilExpiry = Math.max(auth.expiresAt - Date.now(), 0);
    const timer = window.setTimeout(() => {
      onUpdateAuth(null);
    }, msUntilExpiry);
    return () => window.clearTimeout(timer);
  }, [auth, onUpdateAuth]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = isMobileSidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isMobileSidebarOpen]);

  const handleNavigate = (page: ResidentPage) => {
    setIsMobileSidebarOpen(false);
    if (page !== "resident:minute-detail") {
      setSelectedMinuteId(null);
    }
    setCurrentPage(page);
  };

  const handleSidebarNavigate = (page: string) => {
    if (page === "__logout") {
      void handleLogout();
      return;
    }
    handleNavigate(page as ResidentPage);
  };

  const handleSelectMinute = (minute: Doc<"minutes">) => {
    setSelectedMinuteId(minute._id);
    setCurrentPage("resident:minute-detail");
    setIsMobileSidebarOpen(false);
  };

  const handleToggleSidebar = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsMobileSidebarOpen((prev) => !prev);
      return;
    }
    setSidebarCollapsed((prev) => !prev);
  };

  const handleLogout = async () => {
    setIsMobileSidebarOpen(false);
    await onLogout();
  };

  const condoName = condo?.name ?? auth.condoName;

  return (
    <>
      <div className="flex h-screen overflow-hidden">
        <div className="hidden md:flex md:flex-shrink-0">
          <Sidebar
            currentPage={currentPage}
            onNavigate={handleSidebarNavigate}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
            mode="resident"
            selectedCondo={condo ?? null}
          />
        </div>
        <div className="flex flex-1 flex-col overflow-hidden">
          <ResidentNavbar
            onToggleSidebar={handleToggleSidebar}
            condoName={condoName}
            userName={resident?.name ?? auth.name}
            onNavigateProfile={() => handleNavigate("resident:profile")}
            onLogout={handleLogout}
          />
          <main className="flex-1 overflow-y-auto bg-muted/30 p-4 sm:p-6">
            <div className="mx-auto max-w-5xl">
              {currentPage === "resident:minutes" && (
                <ResidentMinutesPage
                  condoId={auth.condoId}
                  residentId={auth.userId}
                  onSelectMinute={handleSelectMinute}
                  units={units}
                />
              )}
              {currentPage === "resident:minute-detail" && (
                <ResidentMinuteDetailPage
                  minuteId={selectedMinuteId}
                  condo={condo ?? null}
                  condoId={auth.condoId}
                  residentId={auth.userId}
                  sessionToken={auth.token}
                  units={units}
                  onBack={() => handleNavigate("resident:minutes")}
                />
              )}
              {currentPage === "resident:unit" && <ResidentUnitPage units={units} />}
              {currentPage === "resident:profile" && <ResidentProfilePage resident={resident} />}
              {currentPage === "resident:communications" && (
                <ResidentCommunicationsPage condoId={auth.condoId} sessionToken={auth.token} />
              )}
            </div>
          </main>
        </div>
      </div>
      <div
        className={cn(
          "fixed inset-0 z-40 flex transform transition-transform duration-300 md:hidden",
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
        )}
        aria-hidden={!isMobileSidebarOpen}
      >
        <button
          type="button"
          className={cn(
            "absolute inset-0 bg-black/40 transition-opacity",
            isMobileSidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
          )}
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-label="Fechar menu lateral"
        />
        <div
          className="relative h-full w-72 max-w-[85vw] shadow-xl"
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navegação"
        >
          <Sidebar
            currentPage={currentPage}
            onNavigate={handleSidebarNavigate}
            collapsed={false}
            onToggleCollapse={() => setIsMobileSidebarOpen(false)}
            mode="resident"
            selectedCondo={condo ?? null}
          />
        </div>
      </div>
    </>
  );
}
