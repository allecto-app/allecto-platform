import { mockConvexMutation, mockConvexQuery } from "../mocks/runtime/convexReactMock";
import { api, type Doc } from "../../lib/convexGenerated";

let initialized = false;

const MOCK_ADMIN_EMAIL =
  process.env.NEXT_PUBLIC_MOCK_ADMIN_EMAIL ?? "admin@allecto.app";
const MOCK_ADMIN_PASSWORD =
  process.env.NEXT_PUBLIC_MOCK_ADMIN_PASSWORD ?? "Password123";
const MOCK_ADMIN_NAME =
  process.env.NEXT_PUBLIC_MOCK_ADMIN_NAME ?? "Mock Admin";

const shouldUseMockConvex = () => {
  if (typeof process !== "undefined" && typeof process.env === "object") {
    const flag = process.env["NEXT_PUBLIC_USE_MOCK_CONVEX"];
    if (typeof flag === "string") {
      return flag.toLowerCase() === "true";
    }
  }
  if (typeof globalThis !== "undefined") {
    const flag = (globalThis as Record<string, unknown>).__USE_CONVEX_MOCKS__;
    if (typeof flag === "boolean") {
      return flag;
    }
  }
  return false;
};

const now = Date.now();
const condos: Doc<"condos">[] = [
  {
    _id: "condo_1" as Doc<"condos">["_id"],
    _creationTime: now,
    name: "Residencial Alpha",
    subdomain: "alpha",
    branding: { displayName: "Residencial Alpha" },
    createdAt: now,
    updatedAt: now,
  },
  {
    _id: "condo_2" as Doc<"condos">["_id"],
    _creationTime: now,
    name: "Residencial Beta",
    subdomain: "beta",
    branding: { displayName: "Residencial Beta" },
    createdAt: now,
    updatedAt: now,
  },
];

const residents: Doc<"residents">[] = [
  {
    _id: "resident_1" as Doc<"residents">["_id"],
    _creationTime: now,
    condoId: condos[0]._id,
    name: "Síndico Alpha",
    email: "sindico@example.com",
    phone: null,
    role: "syndic",
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    _id: "resident_2" as Doc<"residents">["_id"],
    _creationTime: now,
    condoId: condos[0]._id,
    name: "Maria",
    email: "maria@example.com",
    phone: null,
    role: "resident",
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
];

const units: Doc<"units">[] = [
  {
    _id: "unit_1" as Doc<"units">["_id"],
    _creationTime: now,
    condoId: condos[0]._id,
    code: "A11",
    block: "A",
    floor: "1",
    createdAt: now,
    updatedAt: now,
  },
];

const documents = [
  {
    _id: "doc_1",
    title: "Ata inicial",
    createdAt: now,
    updatedAt: now,
  },
];

const minutes: Doc<"minutes">[] = [
  {
    _id: "minute_1" as Doc<"minutes">["_id"],
    _creationTime: now,
    condoId: condos[0]._id,
    title: "Ata inaugural",
    summary: "Boas vindas",
    documentId: "doc_1",
    status: "open",
    createdAt: now,
    updatedAt: now,
    publishedAt: now,
    closesAt: now + 3 * 24 * 60 * 60 * 1000,
  },
];

const notifications = [
  {
    _id: "notif_1",
    template: "convocation",
    createdAt: now,
  },
];

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const baseSnapshot = {
  condos: clone(condos),
  residents: clone(residents),
  units: clone(units),
  documents: clone(documents),
  minutes: clone(minutes),
  notifications: clone(notifications),
};

function resetFixtureState() {
  condos.splice(0, condos.length, ...clone(baseSnapshot.condos));
  residents.splice(0, residents.length, ...clone(baseSnapshot.residents));
  units.splice(0, units.length, ...clone(baseSnapshot.units));
  documents.splice(0, documents.length, ...clone(baseSnapshot.documents));
  minutes.splice(0, minutes.length, ...clone(baseSnapshot.minutes));
  notifications.splice(0, notifications.length, ...clone(baseSnapshot.notifications));
}

const usageSummary = {
  active: true,
  tierKey: "pro" as const,
  limits: {
    tierKey: "pro" as const,
    monthlyAssembliesLimit: "unlimited" as const,
    unitMin: 1,
    unitMax: 9999,
  },
  remaining: "unlimited" as const,
  unitsOk: true,
  usage: {
    monthKey: "2024-01",
    assembliesCount: 1,
  },
  unitsCount: 120,
  unitValidationReason: null,
} as const;

const entitlements = {
  active: true,
  tierKey: "pro" as const,
  subscription: {
    status: "active",
    priceId: "price_mock",
    productId: "prod_mock",
    currentPeriodStart: now,
    currentPeriodEnd: now + 30 * 24 * 60 * 60 * 1000,
    cancelAt: null,
    cancelAtPeriodEnd: false,
    trialEnd: null,
    latestInvoiceId: "inv_mock",
    latestInvoiceStatus: "paid",
    updatedAt: now,
  },
  inDunning: false,
} as const;

export function ensureConvexMockData() {
  if (initialized || !shouldUseMockConvex()) {
    return;
  }
  console.info("[convexMock] registering fixtures");
  initialized = true;
  if (typeof globalThis !== "undefined") {
    (globalThis as Record<string, unknown>).__CONVEX_FIXTURES_READY__ = true;
    (globalThis as Record<string, unknown>).__CONVEX_MOCK_FIXTURES__ = {
      condos,
      residents,
      units,
      documents,
      minutes,
      notifications,
      usageSummary,
      entitlements,
    };
    (globalThis as Record<string, unknown>).__CONVEX_FIXTURES_RESET__ = resetFixtureState;
  }

  mockConvexQuery(api.platform.listCondos, () => condos, "platform.listCondos");
  mockConvexQuery(api.condos.getBySubdomain, ({ subdomain }) =>
    condos.find((condo) => condo.subdomain === subdomain) ?? null,
    "condos.getBySubdomain",
  );
  mockConvexQuery(api.residents.list, ({ condoId }) =>
    residents.filter((resident) => resident.condoId === condoId),
    "residents.list",
  );
  mockConvexQuery(api.invites.listByCondo, () => [], "invites.listByCondo");
  mockConvexQuery(api.units.listByCondo, ({ condoId }) =>
    units.filter((unit) => unit.condoId === condoId),
    "units.listByCondo",
  );
  mockConvexQuery(
    api.units.detail,
    ({ unitId }) => ({
      unit: units.find((unit) => unit._id === unitId) ?? null,
      memberships: [],
      votes: [],
    }),
    "units.detail",
  );
  mockConvexQuery(
    api.residentDetail.get,
    ({ residentId }) => ({
      resident: residents.find((resident) => resident._id === residentId) ?? null,
    }),
    "residentDetail.get",
  );
  mockConvexQuery(api.minutes.list, ({ condoId }) =>
    minutes.filter((minute) => minute.condoId === condoId),
    "minutes.list",
  );
  mockConvexQuery(api.minutes.get, ({ minuteId }) =>
    minutes.find((minute) => minute._id === minuteId) ?? null,
    "minutes.get",
  );
  mockConvexQuery(api.documents.list, () => documents, "documents.list");
  mockConvexQuery(api.notifications.listLogs, () => notifications, "notifications.listLogs");
  mockConvexQuery(
    api.votes.statsByCondo,
    () => ({ votesToday: 3, participationRate: 0.42 }),
    "votes.statsByCondo",
  );
  mockConvexQuery(api.usage.getUsageSummary, () => usageSummary, "usage.getUsageSummary");
  mockConvexQuery(api.billing.entitlements, () => entitlements, "billing.entitlements");

  const mockAdmins = [
    {
      email: MOCK_ADMIN_EMAIL,
      password: MOCK_ADMIN_PASSWORD,
      name: MOCK_ADMIN_NAME,
    },
  ] as const;

  mockConvexMutation(api.auth.adminSignIn, async ({ email, password }) => {
    console.info("[convexMock] adminSignIn attempt", email);
    const match = mockAdmins.find(
      (admin) => admin.email === email && admin.password === password,
    );
    if (!match) {
      return { success: false as const };
    }
    return {
      success: true as const,
      token: "mock-token-1234567890abcdef1234567890abcd",
      type: "platform",
      userId: "platform_user" as const,
      roles: ["super_admin"],
      name: match.name,
      expiresAt: Date.now() + 60 * 60 * 1000,
    };
  }, "auth.adminSignIn");

  mockConvexMutation(api.minutes.publish, async (input) => {
    const newMinute: Doc<"minutes"> = {
      _id: `minute_${minutes.length + 1}` as Doc<"minutes">["_id"],
      _creationTime: Date.now(),
      condoId: input.condoId,
      title: input.title,
      summary: input.summary,
      documentId: input.documentId,
      status: "open",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      publishedAt: Date.now(),
      closesAt: input.closesAt,
    };
    minutes.unshift(newMinute);
    return { minute: newMinute };
  }, "minutes.publish");

  mockConvexMutation(api.residents.update, async ({ residentId, ...fields }) => {
    const resident = residents.find((item) => item._id === residentId);
    if (!resident) {
      throw new Error("Resident not found");
    }
    Object.assign(resident, fields, { updatedAt: Date.now() });
    return { resident };
  }, "residents.update");

  mockConvexMutation(api.units.update, async ({ unitId, ...fields }) => {
    const unit = units.find((item) => item._id === unitId);
    if (!unit) {
      throw new Error("Unit not found");
    }
    Object.assign(unit, fields, { updatedAt: Date.now() });
    return { unit };
  }, "units.update");
}
