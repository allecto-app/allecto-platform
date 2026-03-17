import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

export type SecurityMeta = Record<string, unknown> | undefined;

export const recordSecurityEventInternal = internalMutation({
  args: {
    type: v.string(),
    key: v.string(),
    severity: v.optional(v.union(v.literal("info"), v.literal("warn"), v.literal("critical"))),
    meta: v.optional(v.any()),
  },
  handler: async (ctx, { type, key, severity, meta }) => {
    await ctx.db.insert("securityEvents", {
      type,
      key,
      severity: severity ?? "info",
      createdAt: Date.now(),
      meta,
    });
  },
});

export async function recordSecurityEvent(
  ctx: any,
  type: string,
  key: string,
  meta?: SecurityMeta,
  severity: "info" | "warn" | "critical" = "info",
) {
  await ctx.db.insert("securityEvents", {
    type,
    key,
    severity,
    createdAt: Date.now(),
    meta,
  });
}

type RateLimitOptions = {
  scope: string;
  key: string;
  limit: number;
  windowMs: number;
  blockMs?: number;
  now?: number;
};

export async function enforceRateLimit(ctx: any, options: RateLimitOptions) {
  const now = options.now ?? Date.now();
  const blockMs = options.blockMs ?? options.windowMs;
  const scopeKey = `${options.scope}:${options.key}`;

  const record = await ctx.db
    .query("securityRateLimits")
    .withIndex("byScopeKey", (q: any) => q.eq("scopeKey", scopeKey))
    .unique();

  if (!record) {
    await ctx.db.insert("securityRateLimits", {
      scope: options.scope,
      key: options.key,
      scopeKey,
      windowStart: now,
      count: 1,
      blockedUntil: undefined,
      updatedAt: now,
    });
    return { limited: false as const, remaining: Math.max(0, options.limit - 1), blockedUntil: null };
  }

  if (record.blockedUntil && record.blockedUntil > now) {
    return { limited: true as const, remaining: 0, blockedUntil: record.blockedUntil };
  }

  const withinWindow = now - record.windowStart < options.windowMs;
  if (!withinWindow) {
    await ctx.db.patch(record._id, {
      windowStart: now,
      count: 1,
      blockedUntil: undefined,
      updatedAt: now,
    });
    return { limited: false as const, remaining: Math.max(0, options.limit - 1), blockedUntil: null };
  }

  const nextCount = record.count + 1;
  if (nextCount > options.limit) {
    const blockedUntil = now + blockMs;
    await ctx.db.patch(record._id, {
      count: nextCount,
      blockedUntil,
      updatedAt: now,
    });
    return { limited: true as const, remaining: 0, blockedUntil };
  }

  await ctx.db.patch(record._id, {
    count: nextCount,
    updatedAt: now,
  });
  return { limited: false as const, remaining: Math.max(0, options.limit - nextCount), blockedUntil: null };
}
