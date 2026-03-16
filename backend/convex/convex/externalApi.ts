import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import { requireCondoRole, requirePlatformRole } from "./guards";
import { randomToken, sha256 } from "./_secu";

type ExternalAccess = {
  condoId: any;
  residentId: any;
  key: any;
};

const ACTIVE_BILLING_STATUSES = new Set(["active", "trialing"]);
const API_TOKEN_TTL_MS = 15 * 60 * 1000;

function normalizeTier(value: string | null | undefined): "essencial" | "plus" | "pro" | null {
  if (!value) return null;
  const normalized = value.toLowerCase().trim();
  if (normalized === "essencial" || normalized === "plus" || normalized === "pro") {
    return normalized;
  }
  return null;
}

async function assertProPlan(ctx: any, condoId: any) {
  const condo = await ctx.db.get(condoId);
  if (!condo) {
    throw new Error("Condominium not found");
  }

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

  if (!isActive || tier !== "pro") {
    throw new Error("Pro plan required");
  }

  return condo;
}

async function requireExternalAccess(ctx: any, accessToken: string): Promise<ExternalAccess> {
  if (!accessToken || accessToken.length < 32) {
    throw new Error("Invalid access token");
  }

  const tokenHash = await sha256(accessToken);
  const tokenRecord = await ctx.db
    .query("externalApiTokens")
    .withIndex("byTokenHash", (q: any) => q.eq("tokenHash", tokenHash))
    .unique();

  if (!tokenRecord || tokenRecord.revokedAt !== undefined || tokenRecord.expiresAt <= Date.now()) {
    throw new Error("Invalid or expired access token");
  }

  const key = await ctx.db.get(tokenRecord.keyId);
  if (!key || key.status !== "active") {
    throw new Error("API key revoked");
  }
  if (key.expiresAt !== undefined && key.expiresAt <= Date.now()) {
    throw new Error("API key expired");
  }

  const resident = await ctx.db.get(key.residentId);
  if (!resident || resident.deletedAt !== undefined || resident.isActive !== true || resident.role !== "syndic") {
    throw new Error("API key owner is not active");
  }

  await assertProPlan(ctx, key.condoId);

  return {
    condoId: key.condoId,
    residentId: key.residentId,
    key,
  };
}

async function requireApiKeyManagerAccess(ctx: any, token: string, condoId: any) {
  try {
    const { resident } = await requireCondoRole(ctx, condoId, ["syndic"], token);
    if (!resident || resident.role !== "syndic") {
      throw new Error("Only syndic can manage API keys");
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
  },
  handler: async (ctx, { token, condoId, name, expiresAt }) => {
    await requireApiKeyManagerAccess(ctx, token, condoId);

    await assertProPlan(ctx, condoId);

    const now = Date.now();
    if (expiresAt !== undefined && expiresAt <= now) {
      throw new Error("Invalid expiresAt");
    }

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
    if (!ownerResidentId) {
      throw new Error("No active syndic found for condo");
    }

    const keyId = await ctx.db.insert("externalApiKeys", {
      condoId,
      residentId: ownerResidentId,
      name: name?.trim() || undefined,
      keyHash,
      secretHash,
      keyPrefix: apiKey.slice(0, 12),
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
    if (!key) {
      throw new Error("API key not found");
    }

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
  },
  handler: async (ctx, { apiKey, apiSecret }) => {
    const trimmedKey = apiKey.trim();
    const trimmedSecret = apiSecret.trim();

    if (!trimmedKey || !trimmedSecret) {
      throw new Error("Invalid credentials");
    }

    const keyHash = await sha256(trimmedKey);
    const keyRecord = await ctx.db
      .query("externalApiKeys")
      .withIndex("byKeyHash", (q: any) => q.eq("keyHash", keyHash))
      .unique();

    if (!keyRecord || keyRecord.status !== "active") {
      throw new Error("Invalid credentials");
    }

    if (keyRecord.expiresAt !== undefined && keyRecord.expiresAt <= Date.now()) {
      throw new Error("API key expired");
    }

    const secretHash = await sha256(trimmedSecret);
    if (secretHash !== keyRecord.secretHash) {
      throw new Error("Invalid credentials");
    }

    const resident = await ctx.db.get(keyRecord.residentId);
    if (!resident || resident.deletedAt !== undefined || resident.isActive !== true || resident.role !== "syndic") {
      throw new Error("API key owner inactive");
    }

    await assertProPlan(ctx, keyRecord.condoId);

    const now = Date.now();
    const rawAccessToken = `alt_${randomToken(48)}`;
    const tokenHash = await sha256(rawAccessToken);
    const expiresAt = now + API_TOKEN_TTL_MS;

    await ctx.db.insert("externalApiTokens", {
      keyId: keyRecord._id,
      condoId: keyRecord.condoId,
      residentId: keyRecord.residentId,
      tokenHash,
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
    };
  },
});

export const getUnits = query({
  args: {
    accessToken: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { accessToken, limit }) => {
    const access = await requireExternalAccess(ctx, accessToken);
    return await ctx.runQuery(api.units.listByCondo, {
      condoId: access.condoId,
      limit,
    });
  },
});

export const getUnitDetail = query({
  args: {
    accessToken: v.string(),
    unitId: v.id("units"),
  },
  handler: async (ctx, { accessToken, unitId }) => {
    const access = await requireExternalAccess(ctx, accessToken);
    const detail = await ctx.runQuery(api.units.detail, { unitId });
    if (!detail || detail.unit.condoId !== access.condoId) {
      throw new Error("Unit not found");
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
  },
  handler: async (ctx, { accessToken, code, block, floor }) => {
    const access = await requireExternalAccess(ctx, accessToken);
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
  },
  handler: async (ctx, { accessToken, limit }) => {
    const access = await requireExternalAccess(ctx, accessToken);
    return await ctx.runQuery(api.residents.list, {
      condoId: access.condoId,
      limit,
    });
  },
});

export const getResidentDetail = query({
  args: {
    accessToken: v.string(),
    residentId: v.id("residents"),
  },
  handler: async (ctx, { accessToken, residentId }) => {
    const access = await requireExternalAccess(ctx, accessToken);
    const resident = await ctx.db.get(residentId);
    if (!resident || resident.deletedAt !== undefined || resident.condoId !== access.condoId) {
      throw new Error("Resident not found");
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
  },
  handler: async (ctx, args) => {
    const access = await requireExternalAccess(ctx, args.accessToken);

    let unitLink:
      | {
          unitId: any;
          membershipRole: "owner" | "tenant";
        }
      | undefined;

    if (args.unitId) {
      const unit = await ctx.db.get(args.unitId);
      if (!unit || unit.condoId !== access.condoId || unit.deletedAt !== undefined) {
        throw new Error("Unit not found");
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
  },
  handler: async (ctx, { accessToken, status, limit }) => {
    const access = await requireExternalAccess(ctx, accessToken);
    return await ctx.runQuery(api.minutes.list, {
      condoId: access.condoId,
      status,
      limit,
    });
  },
});

export const getMinuteDetail = query({
  args: {
    accessToken: v.string(),
    minuteId: v.id("minutes"),
  },
  handler: async (ctx, { accessToken, minuteId }) => {
    const access = await requireExternalAccess(ctx, accessToken);
    const minute = await ctx.runQuery(api.minutes.get, { minuteId });
    if (!minute || minute.condoId !== access.condoId) {
      throw new Error("Minute not found");
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
  },
  handler: async (ctx, { accessToken, title, summary, documentId, closesAt }) => {
    const access = await requireExternalAccess(ctx, accessToken);
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
  },
  handler: async (ctx, { accessToken, minuteId }) => {
    const access = await requireExternalAccess(ctx, accessToken);
    const minute = await ctx.db.get(minuteId);
    if (!minute || minute.condoId !== access.condoId) {
      throw new Error("Minute not found");
    }
    await ctx.runMutation(api.minutes.close, { minuteId });
    return await ctx.runQuery(api.minutes.get, { minuteId });
  },
});

export const getMinuteResult = query({
  args: {
    accessToken: v.string(),
    minuteId: v.id("minutes"),
  },
  handler: async (ctx, { accessToken, minuteId }) => {
    const access = await requireExternalAccess(ctx, accessToken);
    const minute = await ctx.db.get(minuteId);
    if (!minute || minute.condoId !== access.condoId) {
      throw new Error("Minute not found");
    }

    const summary = await ctx.runQuery(api.votes.summary, { minuteId });
    const votes = await ctx.runQuery(api.votes.listForMinute, { minuteId });
    const finalReport = await ctx.runQuery(api.minutes.getFinalReport, { minuteId });

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
