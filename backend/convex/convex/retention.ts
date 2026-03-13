import { internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { requireCondoRole, requirePlatformRole } from "./guards";
import { recordAdminAuditEvent } from "./lib/adminAudit";

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_MAX_ROWS_PER_TARGET = 500;
const MAX_ALLOWED_ROWS_PER_TARGET = 2000;

const TARGET_VALUES = [
  "otps",
  "invites",
  "loginAttempts",
  "sessions",
  "passwordResets",
  "notificationReads",
  "securityEvents",
] as const;

type RetentionTarget = (typeof TARGET_VALUES)[number];

const targetValidator = v.union(
  v.literal("otps"),
  v.literal("invites"),
  v.literal("loginAttempts"),
  v.literal("sessions"),
  v.literal("passwordResets"),
  v.literal("notificationReads"),
  v.literal("securityEvents"),
);

const DEFAULT_POLICIES: Record<RetentionTarget, { retentionDays: number; enabled: boolean }> = {
  otps: { retentionDays: 30, enabled: true },
  invites: { retentionDays: 90, enabled: true },
  loginAttempts: { retentionDays: 180, enabled: true },
  sessions: { retentionDays: 180, enabled: true },
  passwordResets: { retentionDays: 30, enabled: true },
  notificationReads: { retentionDays: 365, enabled: true },
  securityEvents: { retentionDays: 365, enabled: true },
};

function clampRows(value: number | undefined): number {
  if (!value || Number.isNaN(value)) return DEFAULT_MAX_ROWS_PER_TARGET;
  if (value < 1) return 1;
  if (value > MAX_ALLOWED_ROWS_PER_TARGET) return MAX_ALLOWED_ROWS_PER_TARGET;
  return Math.floor(value);
}

function buildPolicyMaps(records: any[]) {
  const globalPolicy = new Map<RetentionTarget, { retentionDays: number; enabled: boolean }>();
  const condoPolicy = new Map<string, { retentionDays: number; enabled: boolean }>();

  for (const record of records) {
    const keyTarget = record.target as RetentionTarget;
    if (!TARGET_VALUES.includes(keyTarget)) continue;
    if (record.condoId) {
      condoPolicy.set(`${String(record.condoId)}:${keyTarget}`, {
        retentionDays: record.retentionDays,
        enabled: record.enabled,
      });
    } else {
      globalPolicy.set(keyTarget, {
        retentionDays: record.retentionDays,
        enabled: record.enabled,
      });
    }
  }

  return { globalPolicy, condoPolicy };
}

function resolvePolicy(
  maps: ReturnType<typeof buildPolicyMaps>,
  target: RetentionTarget,
  condoId?: string | null,
) {
  if (condoId) {
    const byCondo = maps.condoPolicy.get(`${condoId}:${target}`);
    if (byCondo) return byCondo;
  }
  return maps.globalPolicy.get(target) ?? DEFAULT_POLICIES[target];
}

function isPastCutoff(refTimestamp: number | undefined, cutoff: number): boolean {
  if (typeof refTimestamp !== "number") return false;
  return refTimestamp <= cutoff;
}

async function authorizeRetentionScope(
  ctx: any,
  token: string,
  condoId?: any,
): Promise<{ actor: string }> {
  if (!condoId) {
    const { user } = await requirePlatformRole(ctx, ["super_admin", "ops", "support"], token);
    return { actor: `platform:${String(user._id)}` };
  }

  try {
    const { user } = await requirePlatformRole(ctx, ["super_admin", "ops", "support"], token);
    return { actor: `platform:${String(user._id)}` };
  } catch {
    const { resident, user } = await requireCondoRole(ctx, condoId, ["syndic", "manager"], token);
    if (resident) return { actor: `resident:${String(resident._id)}` };
    return { actor: `platform:${String(user._id)}` };
  }
}

type TargetSummary = {
  target: RetentionTarget;
  scanned: number;
  eligible: number;
  affected: number;
  dryRun: boolean;
};

async function cleanupTarget(
  ctx: any,
  target: RetentionTarget,
  maps: ReturnType<typeof buildPolicyMaps>,
  now: number,
  dryRun: boolean,
  maxRowsPerTarget: number,
): Promise<TargetSummary> {
  const scanLimit = Math.min(maxRowsPerTarget * 4, MAX_ALLOWED_ROWS_PER_TARGET);
  let scanned = 0;
  let eligible = 0;
  let affected = 0;

  if (target === "otps") {
    const rows = await ctx.db.query("otps").take(scanLimit);
    scanned = rows.length;
    for (const row of rows) {
      if (affected >= maxRowsPerTarget) break;
      const policy = resolvePolicy(maps, target, row.condoId ? String(row.condoId) : null);
      if (!policy.enabled) continue;
      const cutoff = now - policy.retentionDays * DAY_MS;
      const ref = row.consumedAt ?? row.expiresAt;
      if (!isPastCutoff(ref, cutoff)) continue;
      eligible += 1;
      if (!dryRun) {
        await ctx.db.delete(row._id);
      }
      affected += 1;
    }
  }

  if (target === "invites") {
    const rows = await ctx.db.query("invites").take(scanLimit);
    scanned = rows.length;
    for (const row of rows) {
      if (affected >= maxRowsPerTarget) break;
      const policy = resolvePolicy(maps, target, row.condoId ? String(row.condoId) : null);
      if (!policy.enabled) continue;
      const cutoff = now - policy.retentionDays * DAY_MS;
      const statusRef = row.updatedAt ?? row.createdAt;
      const isOldExpired = isPastCutoff(row.expiresAt, cutoff);
      const isOldFinalStatus = row.status !== "pending" && isPastCutoff(statusRef, cutoff);
      if (!isOldExpired && !isOldFinalStatus) continue;
      eligible += 1;
      if (!dryRun) {
        await ctx.db.delete(row._id);
      }
      affected += 1;
    }
  }

  if (target === "loginAttempts") {
    const rows = await ctx.db.query("loginAttempts").take(scanLimit);
    scanned = rows.length;
    for (const row of rows) {
      if (affected >= maxRowsPerTarget) break;
      const policy = resolvePolicy(maps, target, null);
      if (!policy.enabled) continue;
      const cutoff = now - policy.retentionDays * DAY_MS;
      if (!isPastCutoff(row.lastAttemptAt, cutoff)) continue;
      eligible += 1;
      if (!dryRun) {
        await ctx.db.delete(row._id);
      }
      affected += 1;
    }
  }

  if (target === "sessions") {
    const rows = await ctx.db.query("sessions").take(scanLimit);
    scanned = rows.length;
    for (const row of rows) {
      if (affected >= maxRowsPerTarget) break;
      const policy = resolvePolicy(maps, target, row.condoId ? String(row.condoId) : null);
      if (!policy.enabled) continue;
      const cutoff = now - policy.retentionDays * DAY_MS;
      const ref = row.revokedAt ?? row.expiresAt;
      if (!isPastCutoff(ref, cutoff)) continue;
      eligible += 1;
      if (!dryRun) {
        await ctx.db.delete(row._id);
      }
      affected += 1;
    }
  }

  if (target === "passwordResets") {
    const rows = await ctx.db.query("passwordResets").take(scanLimit);
    scanned = rows.length;
    for (const row of rows) {
      if (affected >= maxRowsPerTarget) break;
      const policy = resolvePolicy(maps, target, null);
      if (!policy.enabled) continue;
      const cutoff = now - policy.retentionDays * DAY_MS;
      const ref = row.usedAt ?? row.expiresAt;
      if (!isPastCutoff(ref, cutoff)) continue;
      eligible += 1;
      if (!dryRun) {
        await ctx.db.delete(row._id);
      }
      affected += 1;
    }
  }

  if (target === "notificationReads") {
    const rows = await ctx.db.query("notificationReads").take(scanLimit);
    scanned = rows.length;
    for (const row of rows) {
      if (affected >= maxRowsPerTarget) break;
      const policy = resolvePolicy(maps, target, row.condoId ? String(row.condoId) : null);
      if (!policy.enabled) continue;
      const cutoff = now - policy.retentionDays * DAY_MS;
      if (!isPastCutoff(row.lastReadAt, cutoff)) continue;
      eligible += 1;
      if (!dryRun) {
        await ctx.db.delete(row._id);
      }
      affected += 1;
    }
  }

  if (target === "securityEvents") {
    const rows = await ctx.db.query("securityEvents").take(scanLimit);
    scanned = rows.length;
    for (const row of rows) {
      if (affected >= maxRowsPerTarget) break;
      const policy = resolvePolicy(maps, target, null);
      if (!policy.enabled) continue;
      const cutoff = now - policy.retentionDays * DAY_MS;
      if (!isPastCutoff(row.createdAt, cutoff)) continue;
      eligible += 1;
      if (!dryRun) {
        await ctx.db.delete(row._id);
      }
      affected += 1;
    }
  }

  return { target, scanned, eligible, affected, dryRun };
}

export const getPolicies = query({
  args: {
    token: v.string(),
    condoId: v.optional(v.id("condos")),
  },
  handler: async (ctx, { token, condoId }) => {
    await authorizeRetentionScope(ctx, token, condoId);

    const records = await ctx.db.query("dataRetentionPolicies").collect();
    const maps = buildPolicyMaps(records);

    return TARGET_VALUES.map((target) => {
      const effective = resolvePolicy(maps, target, condoId ? String(condoId) : null);
      const condoOverride =
        condoId !== undefined ? maps.condoPolicy.get(`${String(condoId)}:${target}`) : undefined;
      const globalOverride = maps.globalPolicy.get(target);
      return {
        target,
        defaults: DEFAULT_POLICIES[target],
        globalOverride: globalOverride ?? null,
        condoOverride: condoOverride ?? null,
        effective,
      };
    });
  },
});

export const upsertPolicy = mutation({
  args: {
    token: v.string(),
    target: targetValidator,
    retentionDays: v.number(),
    enabled: v.boolean(),
    condoId: v.optional(v.id("condos")),
    note: v.optional(v.string()),
  },
  handler: async (ctx, { token, target, retentionDays, enabled, condoId, note }) => {
    if (retentionDays < 1 || retentionDays > 3650) {
      throw new Error("Retention days must be between 1 and 3650");
    }

    const { actor: updatedBy } = await authorizeRetentionScope(ctx, token, condoId);

    const now = Date.now();
    const existing = condoId
      ? await ctx.db
          .query("dataRetentionPolicies")
          .withIndex("byCondoTarget", (q) => q.eq("condoId", condoId).eq("target", target))
          .unique()
      : (
          await ctx.db
            .query("dataRetentionPolicies")
            .withIndex("byTarget", (q) => q.eq("target", target))
            .collect()
        ).find((record) => record.condoId === undefined);

    if (existing) {
      const before = {
        target: existing.target,
        condoId: existing.condoId ?? null,
        retentionDays: existing.retentionDays,
        enabled: existing.enabled,
        note: existing.note ?? null,
      };
      await ctx.db.patch(existing._id, {
        retentionDays,
        enabled,
        note,
        updatedAt: now,
        updatedBy,
      });
      await recordAdminAuditEvent(ctx, {
        action: "retention.policy.updated",
        actor: updatedBy.startsWith("resident:")
          ? { type: "resident", id: updatedBy.replace("resident:", "") }
          : { type: "platform", id: updatedBy.replace("platform:", "") },
        condoId,
        entityType: "dataRetentionPolicy",
        entityId: String(existing._id),
        before,
        after: {
          target,
          condoId: condoId ?? null,
          retentionDays,
          enabled,
          note: note ?? null,
        },
      });
      return { id: existing._id, updated: true };
    }

    const id = await ctx.db.insert("dataRetentionPolicies", {
      target,
      condoId,
      retentionDays,
      enabled,
      note,
      createdAt: now,
      updatedAt: now,
      updatedBy,
    });
    await recordAdminAuditEvent(ctx, {
      action: "retention.policy.created",
      actor: updatedBy.startsWith("resident:")
        ? { type: "resident", id: updatedBy.replace("resident:", "") }
        : { type: "platform", id: updatedBy.replace("platform:", "") },
      condoId,
      entityType: "dataRetentionPolicy",
      entityId: String(id),
      before: null,
      after: {
        target,
        condoId: condoId ?? null,
        retentionDays,
        enabled,
        note: note ?? null,
      },
    });
    return { id, updated: false };
  },
});

export const executeRetention = internalMutation({
  args: {
    dryRun: v.boolean(),
    maxRowsPerTarget: v.number(),
    triggeredBy: v.optional(v.string()),
  },
  handler: async (ctx, { dryRun, maxRowsPerTarget, triggeredBy }) => {
    const now = Date.now();
    const startedAt = now;
    const safeMaxRows = clampRows(maxRowsPerTarget);
    const policyRecords = await ctx.db.query("dataRetentionPolicies").collect();
    const maps = buildPolicyMaps(policyRecords);

    const perTarget: TargetSummary[] = [];
    for (const target of TARGET_VALUES) {
      const result = await cleanupTarget(ctx, target, maps, now, dryRun, safeMaxRows);
      perTarget.push(result);
    }

    const summary = {
      totals: {
        scanned: perTarget.reduce((acc, item) => acc + item.scanned, 0),
        eligible: perTarget.reduce((acc, item) => acc + item.eligible, 0),
        affected: perTarget.reduce((acc, item) => acc + item.affected, 0),
      },
      targets: perTarget,
    };

    const finishedAt = Date.now();
    const runId = await ctx.db.insert("dataRetentionRuns", {
      startedAt,
      finishedAt,
      dryRun,
      maxRowsPerTarget: safeMaxRows,
      triggeredBy,
      summary,
      createdAt: finishedAt,
    });

    await recordAdminAuditEvent(ctx, {
      action: "retention.run.completed",
      actor: triggeredBy?.startsWith("platform:")
        ? { type: "platform", id: triggeredBy.replace("platform:", "") }
        : triggeredBy?.startsWith("resident:")
          ? { type: "resident", id: triggeredBy.replace("resident:", "") }
          : { type: "system", id: triggeredBy ?? "system" },
      entityType: "dataRetentionRun",
      entityId: String(runId),
      after: {
        dryRun,
        maxRowsPerTarget: safeMaxRows,
        summary,
      },
      metadata: { triggeredBy: triggeredBy ?? "system" },
    });

    return {
      runId,
      dryRun,
      startedAt,
      finishedAt,
      summary,
    };
  },
});

export const triggerRun = mutation({
  args: {
    token: v.string(),
    dryRun: v.optional(v.boolean()),
    maxRowsPerTarget: v.optional(v.number()),
  },
  handler: async (ctx, { token, dryRun, maxRowsPerTarget }) => {
    const { user } = await requirePlatformRole(ctx, ["super_admin", "ops", "support"], token);
    const now = Date.now();
    const safeRows = clampRows(maxRowsPerTarget);
    await ctx.scheduler.runAfter(0, internal.retention.executeRetention, {
      dryRun: dryRun ?? true,
      maxRowsPerTarget: safeRows,
      triggeredBy: `platform:${String(user._id)}`,
    });
    await recordAdminAuditEvent(ctx, {
      action: "retention.run.queued",
      actor: { type: "platform", id: String(user._id) },
      entityType: "dataRetentionRun",
      after: {
        dryRun: dryRun ?? true,
        maxRowsPerTarget: safeRows,
      },
    });
    return { queued: true, queuedAt: now };
  },
});

export const listRuns = query({
  args: {
    token: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { token, limit }) => {
    await requirePlatformRole(ctx, ["super_admin", "ops", "support"], token);
    const rows = await ctx.db
      .query("dataRetentionRuns")
      .withIndex("byStartedAt", (q) => q.gte("startedAt", 0))
      .order("desc")
      .take(limit ?? 20);
    return rows;
  },
});
