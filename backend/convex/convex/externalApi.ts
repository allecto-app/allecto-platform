import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import { requireCondoRole, requirePlatformRole } from "./guards";
import { randomToken, sha256 } from "./_secu";

type ExternalScope =
  | "units:read"
  | "units:write"
  | "residents:read"
  | "residents:write"
  | "minutes:read"
  | "minutes:write"
  | "minutes:close"
  | "minutes:result:read";

type ExternalAccess = {
  condoId: any;
  residentId: any;
  key: any;
  scopes: ExternalScope[];
};

const ACTIVE_BILLING_STATUSES = new Set(["active", "trialing"]);
const API_TOKEN_TTL_MS = 15 * 60 * 1000;
const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 25;
const ALL_SCOPES: ExternalScope[] = [
  "units:read",
  "units:write",
  "residents:read",
  "residents:write",
  "minutes:read",
  "minutes:write",
  "minutes:close",
  "minutes:result:read",
];

function normalizeTier(value: string | null | undefined): "essencial" | "plus" | "pro" | null {
  if (!value) return null;
  const normalized = value.toLowerCase().trim();
  if (normalized === "essencial" || normalized === "plus" || normalized === "pro") {
    return normalized;
  }
  return null;
}

function assert(condition: unknown, errorCode: string) {
  if (!condition) {
    throw new Error(errorCode);
  }
}

function normalizeScopes(scopes?: string[] | null): ExternalScope[] {
  const values = Array.isArray(scopes) ? scopes : ALL_SCOPES;
  const normalized = Array.from(new Set(values.map((item) => item.trim()).filter(Boolean)));
  const invalid = normalized.find((value) => !ALL_SCOPES.includes(value as ExternalScope));
  assert(!invalid, "EXT_VALIDATION_INVALID_SCOPE");
  return normalized as ExternalScope[];
}

function requireScope(access: ExternalAccess, required: ExternalScope) {
  assert(access.scopes.includes(required), "EXT_FORBIDDEN_SCOPE");
}

function normalizeIp(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.trim();
}

function assertIpAllowed(allowlist: string[] | undefined, clientIp: string | null) {
  if (!allowlist || allowlist.length === 0) return;
  assert(clientIp, "EXT_AUTH_IP_REQUIRED");
  assert(allowlist.includes(clientIp), "EXT_AUTH_IP_NOT_ALLOWED");
}

function clampPage(limit?: number | null, page?: number | null) {
  const safeLimit = Math.max(1, Math.min(MAX_PAGE_SIZE, Math.floor(limit ?? DEFAULT_PAGE_SIZE)));
  const safePage = Math.max(1, Math.floor(page ?? 1));
  const offset = (safePage - 1) * safeLimit;
  return { safeLimit, safePage, offset };
}

async function assertProPlan(ctx: any, condoId: any) {
  const condo = await ctx.db.get(condoId);
  assert(condo, "EXT_NOT_FOUND_CONDO");

  const subscriptions = await ctx.db
    .query("subscriptions")
    .withIndex("byTenant", (q: any) => q.eq("tenantId", condoId))
    .collect();

  subscriptions.sort((a: any, b: any) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
  const current = subscriptions[0] ?? null;
  const now = Date.now();

  const status = (current?.status ?? condo.billingStatus ?? "").toLowerCase();
  const periodEnd = current?.currentPeriodEnd ?? 0;
  const isWithinPeriod = periodEnd === 0 || periodEnd >= now - 60_000;
  const isActive = ACTIVE_BILLING_STATUSES.has(status) && isWithinPeriod;

  const tier = normalizeTier(current?.tierKey ?? condo.billingTier ?? null);
  assert(isActive && tier === "pro", "EXT_FORBIDDEN_PRO_REQUIRED");

  return condo;
}

async function requireExternalAccess(
  ctx: any,
  accessToken: string,
  requiredScope: ExternalScope,
  clientIp?: string,
): Promise<ExternalAccess> {
  assert(accessToken && accessToken.length >= 32, "EXT_AUTH_INVALID_TOKEN");

  const tokenHash = await sha256(accessToken);
  const tokenRecord = await ctx.db
    .query("externalApiTokens")
    .withIndex("byTokenHash", (q: any) => q.eq("tokenHash", tokenHash))
    .unique();

  assert(tokenRecord, "EXT_AUTH_INVALID_TOKEN");
  assert(tokenRecord.revokedAt === undefined, "EXT_AUTH_TOKEN_REVOKED");
  assert(tokenRecord.expiresAt > Date.now(), "EXT_AUTH_TOKEN_EXPIRED");

  const key = await ctx.db.get(tokenRecord.keyId);
  assert(key && key.status === "active", "EXT_AUTH_KEY_REVOKED");
  assert(key.expiresAt === undefined || key.expiresAt > Date.now(), "EXT_AUTH_KEY_EXPIRED");

  const normalizedClientIp = normalizeIp(clientIp);
  const keyAllowlist = Array.isArray(key.allowedIps) ? key.allowedIps : undefined;
  assertIpAllowed(keyAllowlist, normalizedClientIp);

  const tokenIp = normalizeIp(tokenRecord.issuedForIp);
  if (tokenIp) {
    assert(normalizedClientIp === tokenIp, "EXT_AUTH_TOKEN_IP_MISMATCH");
  }

  const resident = await ctx.db.get(key.residentId);
  assert(
    resident && resident.deletedAt === undefined && resident.isActive === true && resident.role === "syndic",
    "EXT_AUTH_KEY_OWNER_INACTIVE",
  );

  await assertProPlan(ctx, key.condoId);

  const scopes = normalizeScopes(tokenRecord.scopes ?? key.scopes);
  const access: ExternalAccess = {
    condoId: key.condoId,
    residentId: key.residentId,
    key,
    scopes,
  };
  requireScope(access, requiredScope);
  return access;
}

async function requireApiKeyManagerAccess(ctx: any, token: string, condoId: any) {
  try {
    const { resident } = await requireCondoRole(ctx, condoId, ["syndic"], token);
    if (!resident || resident.role !== "syndic") {
      throw new Error("EXT_FORBIDDEN_API_KEY_MANAGEMENT");
    }
    return;
  } catch {
    await requirePlatformRole(ctx, ["super_admin"], token);
  }
}

export const createApiKey = mutation({
  args: {
    token: v.string(),
    condoId: v.id("condos"),
    name: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    scopes: v.optional(v.array(v.string())),
    allowedIps: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { token, condoId, name, expiresAt, scopes, allowedIps }) => {
    await requireApiKeyManagerAccess(ctx, token, condoId);
    await assertProPlan(ctx, condoId);

    const now = Date.now();
    if (expiresAt !== undefined && expiresAt <= now) {
      throw new Error("EXT_VALIDATION_INVALID_EXPIRES_AT");
    }

    const normalizedScopes = normalizeScopes(scopes);
    const normalizedAllowedIps = Array.isArray(allowedIps)
      ? Array.from(new Set(allowedIps.map((ip) => ip.trim()).filter(Boolean)))
      : undefined;

    const apiKey = `alk_${randomToken(20)}`;
    const apiSecret = `als_${randomToken(24)}`;

    const keyHash = await sha256(apiKey);
    const secretHash = await sha256(apiSecret);

    let ownerResidentId: any = null;
    try {
      const auth = await requireCondoRole(ctx, condoId, ["syndic"], token);
      ownerResidentId = auth?.resident?._id ?? null;
    } catch {
      // super_admin path falls back to first active syndic in condo
    }

    if (!ownerResidentId) {
      const condoResidents = await ctx.db
        .query("residents")
        .withIndex("byCondo", (q: any) => q.eq("condoId", condoId))
        .collect();
      ownerResidentId =
        condoResidents.find(
          (resident: any) =>
            resident.role === "syndic" &&
            resident.isActive === true &&
            resident.deletedAt === undefined,
        )?._id ?? null;
    }
    assert(ownerResidentId, "EXT_NOT_FOUND_ACTIVE_SYNDIC");

    const keyId = await ctx.db.insert("externalApiKeys", {
      condoId,
      residentId: ownerResidentId,
      name: name?.trim() || undefined,
      keyHash,
      secretHash,
      keyPrefix: apiKey.slice(0, 12),
      scopes: normalizedScopes,
      allowedIps: normalizedAllowedIps,
      status: "active",
      createdAt: now,
      updatedAt: now,
      lastUsedAt: undefined,
      expiresAt,
      revokedAt: undefined,
    });

    return {
      keyId,
      apiKey,
      apiSecret,
      condoId,
      scopes: normalizedScopes,
      allowedIps: normalizedAllowedIps ?? [],
      createdAt: now,
      expiresAt: expiresAt ?? null,
    };
  },
});

export const listApiKeys = query({
  args: {
    token: v.string(),
    condoId: v.id("condos"),
  },
  handler: async (ctx, { token, condoId }) => {
    await requireApiKeyManagerAccess(ctx, token, condoId);

    const keys = await ctx.db
      .query("externalApiKeys")
      .withIndex("byCondo", (q: any) => q.eq("condoId", condoId))
      .collect();

    return keys
      .sort((a: any, b: any) => b.createdAt - a.createdAt)
      .map((key: any) => ({
        _id: key._id,
        name: key.name ?? null,
        keyPrefix: key.keyPrefix,
        scopes: normalizeScopes(key.scopes),
        allowedIps: Array.isArray(key.allowedIps) ? key.allowedIps : [],
        status: key.status,
        createdAt: key.createdAt,
        updatedAt: key.updatedAt,
        lastUsedAt: key.lastUsedAt ?? null,
        expiresAt: key.expiresAt ?? null,
        revokedAt: key.revokedAt ?? null,
      }));
  },
});

export const revokeApiKey = mutation({
  args: {
    token: v.string(),
    keyId: v.id("externalApiKeys"),
  },
  handler: async (ctx, { token, keyId }) => {
    const key = await ctx.db.get(keyId);
    assert(key, "EXT_NOT_FOUND_API_KEY");

    await requireApiKeyManagerAccess(ctx, token, key.condoId);

    if (key.status === "revoked") {
      return true;
    }

    const now = Date.now();
    await ctx.db.patch(keyId, {
      status: "revoked",
      revokedAt: now,
      updatedAt: now,
    });

    const activeTokens = await ctx.db
      .query("externalApiTokens")
      .withIndex("byKey", (q: any) => q.eq("keyId", keyId))
      .collect();

    await Promise.all(
      activeTokens
        .filter((token: any) => token.revokedAt === undefined)
        .map((token: any) => ctx.db.patch(token._id, { revokedAt: now, updatedAt: now })),
    );

    return true;
  },
});

export const issueToken = mutation({
  args: {
    apiKey: v.string(),
    apiSecret: v.string(),
    clientIp: v.optional(v.string()),
  },
  handler: async (ctx, { apiKey, apiSecret, clientIp }) => {
    const trimmedKey = apiKey.trim();
    const trimmedSecret = apiSecret.trim();
    assert(trimmedKey && trimmedSecret, "EXT_AUTH_INVALID_CREDENTIALS");

    const keyHash = await sha256(trimmedKey);
    const keyRecord = await ctx.db
      .query("externalApiKeys")
      .withIndex("byKeyHash", (q: any) => q.eq("keyHash", keyHash))
      .unique();

    assert(keyRecord && keyRecord.status === "active", "EXT_AUTH_INVALID_CREDENTIALS");
    assert(keyRecord.expiresAt === undefined || keyRecord.expiresAt > Date.now(), "EXT_AUTH_KEY_EXPIRED");

    const secretHash = await sha256(trimmedSecret);
    assert(secretHash === keyRecord.secretHash, "EXT_AUTH_INVALID_CREDENTIALS");

    const normalizedClientIp = normalizeIp(clientIp);
    assertIpAllowed(Array.isArray(keyRecord.allowedIps) ? keyRecord.allowedIps : undefined, normalizedClientIp);

    const resident = await ctx.db.get(keyRecord.residentId);
    assert(
      resident && resident.deletedAt === undefined && resident.isActive === true && resident.role === "syndic",
      "EXT_AUTH_KEY_OWNER_INACTIVE",
    );

    await assertProPlan(ctx, keyRecord.condoId);

    const now = Date.now();
    const rawAccessToken = `alt_${randomToken(48)}`;
    const tokenHash = await sha256(rawAccessToken);
    const expiresAt = now + API_TOKEN_TTL_MS;
    const tokenScopes = normalizeScopes(keyRecord.scopes);

    await ctx.db.insert("externalApiTokens", {
      keyId: keyRecord._id,
      condoId: keyRecord.condoId,
      residentId: keyRecord.residentId,
      tokenHash,
      scopes: tokenScopes,
      issuedForIp: normalizedClientIp ?? undefined,
      createdAt: now,
      updatedAt: now,
      expiresAt,
      revokedAt: undefined,
      lastUsedAt: now,
    });

    await ctx.db.patch(keyRecord._id, {
      updatedAt: now,
      lastUsedAt: now,
    });

    return {
      accessToken: rawAccessToken,
      tokenType: "Bearer",
      expiresAt,
      expiresInSeconds: Math.floor(API_TOKEN_TTL_MS / 1000),
      condoId: keyRecord.condoId,
      scopes: tokenScopes,
    };
  },
});

export const getUnits = query({
  args: {
    accessToken: v.string(),
    limit: v.optional(v.number()),
    page: v.optional(v.number()),
    clientIp: v.optional(v.string()),
  },
  handler: async (ctx, { accessToken, limit, page, clientIp }) => {
    const access = await requireExternalAccess(ctx, accessToken, "units:read", clientIp);
    const units = await ctx.db
      .query("units")
      .withIndex("byCondo", (q: any) => q.eq("condoId", access.condoId))
      .collect();
    const active = units.filter((unit: any) => unit.deletedAt === undefined).sort((a: any, b: any) => a.code.localeCompare(b.code));
    const { safeLimit, safePage, offset } = clampPage(limit, page);
    const items = active.slice(offset, offset + safeLimit);

    return {
      items,
      page: safePage,
      limit: safeLimit,
      total: active.length,
      hasMore: offset + safeLimit < active.length,
    };
  },
});

export const getUnitDetail = query({
  args: {
    accessToken: v.string(),
    unitId: v.id("units"),
    clientIp: v.optional(v.string()),
  },
  handler: async (ctx, { accessToken, unitId, clientIp }) => {
    const access = await requireExternalAccess(ctx, accessToken, "units:read", clientIp);
    const detail = await ctx.runQuery(api.units.detail, { unitId });
    if (!detail || detail.unit.condoId !== access.condoId) {
      throw new Error("EXT_NOT_FOUND_UNIT");
    }
    return detail;
  },
});

export const createUnit = mutation({
  args: {
    accessToken: v.string(),
    code: v.string(),
    block: v.optional(v.string()),
    floor: v.optional(v.string()),
    clientIp: v.optional(v.string()),
  },
  handler: async (ctx, { accessToken, code, block, floor, clientIp }) => {
    const access = await requireExternalAccess(ctx, accessToken, "units:write", clientIp);
    const unitId = await ctx.runMutation(api.units.upsert, {
      condoId: access.condoId,
      code,
      block,
      floor,
    });
    const detail = await ctx.runQuery(api.units.detail, { unitId });
    return detail?.unit ?? { _id: unitId };
  },
});

export const getResidents = query({
  args: {
    accessToken: v.string(),
    limit: v.optional(v.number()),
    page: v.optional(v.number()),
    clientIp: v.optional(v.string()),
  },
  handler: async (ctx, { accessToken, limit, page, clientIp }) => {
    const access = await requireExternalAccess(ctx, accessToken, "residents:read", clientIp);
    const residents = await ctx.db
      .query("residents")
      .withIndex("byCondo", (q: any) => q.eq("condoId", access.condoId))
      .collect();
    const active = residents
      .filter((resident: any) => resident.deletedAt === undefined)
      .sort((a: any, b: any) => a.name.localeCompare(b.name));
    const { safeLimit, safePage, offset } = clampPage(limit, page);
    const items = active.slice(offset, offset + safeLimit);

    return {
      items,
      page: safePage,
      limit: safeLimit,
      total: active.length,
      hasMore: offset + safeLimit < active.length,
    };
  },
});

export const getResidentDetail = query({
  args: {
    accessToken: v.string(),
    residentId: v.id("residents"),
    clientIp: v.optional(v.string()),
  },
  handler: async (ctx, { accessToken, residentId, clientIp }) => {
    const access = await requireExternalAccess(ctx, accessToken, "residents:read", clientIp);
    const resident = await ctx.db.get(residentId);
    if (!resident || resident.deletedAt !== undefined || resident.condoId !== access.condoId) {
      throw new Error("EXT_NOT_FOUND_RESIDENT");
    }

    const memberships = await ctx.db
      .query("memberships")
      .withIndex("byResident", (q: any) => q.eq("residentId", residentId))
      .collect();

    const units = await Promise.all(memberships.map((membership: any) => ctx.db.get(membership.unitId)));

    return {
      resident,
      memberships: memberships.map((membership: any, index: number) => ({
        membershipId: membership._id,
        role: membership.role ?? null,
        unit: units[index]
          ? {
              id: units[index]!._id,
              code: units[index]!.code,
              block: units[index]!.block ?? null,
              floor: units[index]!.floor ?? null,
            }
          : null,
      })),
    };
  },
});

export const createResident = mutation({
  args: {
    accessToken: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.optional(
      v.union(v.literal("resident"), v.literal("syndic"), v.literal("manager"), v.literal("council")),
    ),
    unitId: v.optional(v.id("units")),
    membershipRole: v.optional(v.union(v.literal("owner"), v.literal("tenant"))),
    clientIp: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const access = await requireExternalAccess(ctx, args.accessToken, "residents:write", args.clientIp);

    let unitLink:
      | {
          unitId: any;
          membershipRole: "owner" | "tenant";
        }
      | undefined;

    if (args.unitId) {
      const unit = await ctx.db.get(args.unitId);
      if (!unit || unit.condoId !== access.condoId || unit.deletedAt !== undefined) {
        throw new Error("EXT_NOT_FOUND_UNIT");
      }
      unitLink = {
        unitId: args.unitId,
        membershipRole: args.membershipRole ?? "owner",
      };
    }

    return await ctx.runMutation(api.residents.create, {
      condoId: access.condoId,
      name: args.name,
      email: args.email,
      phone: args.phone,
      role: args.role,
      unitLink,
    });
  },
});

export const getMinutes = query({
  args: {
    accessToken: v.string(),
    status: v.optional(v.union(v.literal("open"), v.literal("closed"))),
    limit: v.optional(v.number()),
    page: v.optional(v.number()),
    clientIp: v.optional(v.string()),
  },
  handler: async (ctx, { accessToken, status, limit, page, clientIp }) => {
    const access = await requireExternalAccess(ctx, accessToken, "minutes:read", clientIp);
    const rows = await ctx.db
      .query("minutes")
      .withIndex("byCondo", (q: any) => q.eq("condoId", access.condoId))
      .collect();

    const filtered = rows
      .filter((minute: any) => (status ? minute.status === status : true))
      .sort((a: any, b: any) => b.publishedAt - a.publishedAt);

    const { safeLimit, safePage, offset } = clampPage(limit, page);
    const items = filtered.slice(offset, offset + safeLimit);

    return {
      items,
      page: safePage,
      limit: safeLimit,
      total: filtered.length,
      hasMore: offset + safeLimit < filtered.length,
    };
  },
});

export const getMinuteDetail = query({
  args: {
    accessToken: v.string(),
    minuteId: v.id("minutes"),
    clientIp: v.optional(v.string()),
  },
  handler: async (ctx, { accessToken, minuteId, clientIp }) => {
    const access = await requireExternalAccess(ctx, accessToken, "minutes:read", clientIp);
    const minute = await ctx.runQuery(api.minutes.get, { minuteId });
    if (!minute || minute.condoId !== access.condoId) {
      throw new Error("EXT_NOT_FOUND_MINUTE");
    }
    return minute;
  },
});

export const createMinute = mutation({
  args: {
    accessToken: v.string(),
    title: v.string(),
    summary: v.optional(v.string()),
    documentId: v.id("documents"),
    closesAt: v.number(),
    clientIp: v.optional(v.string()),
  },
  handler: async (ctx, { accessToken, title, summary, documentId, closesAt, clientIp }) => {
    const access = await requireExternalAccess(ctx, accessToken, "minutes:write", clientIp);
    const minuteId = await ctx.runMutation(api.minutes.publish, {
      condoId: access.condoId,
      title,
      summary,
      documentId,
      closesAt,
      createdBy: access.residentId,
      sessionToken: undefined,
    });
    return await ctx.runQuery(api.minutes.get, { minuteId });
  },
});

export const closeMinute = mutation({
  args: {
    accessToken: v.string(),
    minuteId: v.id("minutes"),
    clientIp: v.optional(v.string()),
  },
  handler: async (ctx, { accessToken, minuteId, clientIp }) => {
    const access = await requireExternalAccess(ctx, accessToken, "minutes:close", clientIp);
    const minute = await ctx.db.get(minuteId);
    if (!minute || minute.condoId !== access.condoId) {
      throw new Error("EXT_NOT_FOUND_MINUTE");
    }
    await ctx.runMutation(api.minutes.close, { minuteId });
    return await ctx.runQuery(api.minutes.get, { minuteId });
  },
});

export const getMinuteResult = query({
  args: {
    accessToken: v.string(),
    minuteId: v.id("minutes"),
    includeVotes: v.optional(v.boolean()),
    votesLimit: v.optional(v.number()),
    clientIp: v.optional(v.string()),
  },
  handler: async (ctx, { accessToken, minuteId, includeVotes, votesLimit, clientIp }) => {
    const access = await requireExternalAccess(ctx, accessToken, "minutes:result:read", clientIp);
    const minute = await ctx.db.get(minuteId);
    if (!minute || minute.condoId !== access.condoId) {
      throw new Error("EXT_NOT_FOUND_MINUTE");
    }

    const summary = await ctx.runQuery(api.votes.summary, { minuteId });
    const finalReport = await ctx.runQuery(api.minutes.getFinalReport, { minuteId });

    const shouldIncludeVotes = includeVotes === true;
    const safeVotesLimit = Math.max(1, Math.min(100, Math.floor(votesLimit ?? 25)));
    const votes = shouldIncludeVotes
      ? (await ctx.runQuery(api.votes.listForMinute, { minuteId })).slice(0, safeVotesLimit)
      : [];

    return {
      minute: {
        id: minute._id,
        title: minute.title,
        status: minute.status,
        publishedAt: minute.publishedAt,
        closesAt: minute.closesAt,
        updatedAt: minute.updatedAt,
      },
      summary,
      votes,
      votesReturned: votes.length,
      votesTruncated: shouldIncludeVotes ? summary.total > votes.length : false,
      finalReport: finalReport
        ? {
            id: finalReport._id,
            generatedAt: finalReport.generatedAt,
            snapshotHash: finalReport.snapshotHash,
            reportStorageId: finalReport.reportStorageId ?? null,
            reportDocumentId: finalReport.reportDocumentId ?? null,
          }
        : null,
    };
  },
});
