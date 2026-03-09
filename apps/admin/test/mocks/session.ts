import type { AdminAuthSession } from "../../src/lib/authSession";
import type { Id } from "../../src/lib/convexGenerated";

const defaultPlatformId = "platformUser_mock" as Id<"platformUsers">;
const defaultResidentId = "resident_mock" as Id<"residents">;
const defaultCondoId = "condo_mock" as Id<"condos">;

export function createPlatformSession(overrides: Partial<AdminAuthSession> = {}): AdminAuthSession {
  const base: AdminAuthSession = {
    type: "platform",
    token: "mock-platform-token",
    userId: overrides.type === "resident" ? defaultPlatformId : defaultPlatformId,
    roles: ["super_admin"],
    name: "Test Admin",
    expiresAt: Date.now() + 60 * 60 * 1000,
  };
  return { ...base, ...overrides } as AdminAuthSession;
}

export function createResidentSession(overrides: Partial<AdminAuthSession> = {}): AdminAuthSession {
  const base: AdminAuthSession = {
    type: "resident",
    token: "mock-resident-token",
    userId: defaultResidentId,
    roles: ["syndic"],
    name: "Resident Admin",
    expiresAt: Date.now() + 60 * 60 * 1000,
    condoId: defaultCondoId,
    condoName: "Alpha",
    condoSubdomain: "alpha",
  };
  return { ...base, ...overrides } as AdminAuthSession;
}
