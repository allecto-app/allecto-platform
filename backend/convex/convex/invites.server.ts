import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  inviteError,
  CONDO_RATE_LIMIT,
  EMAIL_RATE_LIMIT,
  RATE_LIMIT_WINDOW_MS,
} from "./invites.shared";
import { requireCondoRole, requirePlatformRole } from "./guards";
import type { Id } from "./_generated/dataModel";
import { recordAdminAuditEvent } from "./lib/adminAudit";

type SubtleDigest = {
  digest: (algorithm: string, data: ArrayBuffer) => Promise<ArrayBuffer>;
};

function getSubtleCrypto(): SubtleDigest {
  const subtle = (globalThis as { crypto?: { subtle?: SubtleDigest } }).crypto?.subtle;
  if (!subtle) {
    throw new Error("SHA-256 not available");
  }
  return subtle;
}

async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await getSubtleCrypto().digest("SHA-256", data.buffer);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function enforceRateLimit(ctx: any, key: string, limit: number, now: number) {
  const record = await ctx.db
    .query("inviteRate")
    .withIndex("byKey", (q: any) => q.eq("key", key))
    .unique();

  if (!record) {
    await ctx.db.insert("inviteRate", {
      key,
      windowStart: now,
      count: 1,
      blockedUntil: undefined,
      updatedAt: now,
    });
    return;
  }

  if (record.blockedUntil && record.blockedUntil > now) {
    throw inviteError();
  }

  const withinWindow = now - record.windowStart < RATE_LIMIT_WINDOW_MS;
  if (!withinWindow) {
    await ctx.db.patch(record._id, {
      windowStart: now,
      count: 1,
      blockedUntil: undefined,
      updatedAt: now,
    });
    return;
  }

  if (record.count >= limit) {
    await ctx.db.patch(record._id, {
      count: record.count + 1,
      blockedUntil: now + RATE_LIMIT_WINDOW_MS,
      updatedAt: now,
    });
    throw inviteError();
  }

  await ctx.db.patch(record._id, {
    count: record.count + 1,
    updatedAt: now,
  });
}

export const _authorizeInviteCreator = internalMutation({
  args: { token: v.string(), condoId: v.id("condos") },
  handler: async (ctx, { token, condoId }) => {
    try {
      const { user } = await requirePlatformRole(
        ctx,
        ["super_admin", "ops", "support"],
        token,
      );
      return {
        mode: "platform" as const,
        createdBy: user._id,
      };
    } catch {
      try {
        await requireCondoRole(ctx, condoId, ["syndic", "manager"], token);
        return {
          mode: "resident" as const,
          createdBy: undefined,
        };
      } catch {
        throw inviteError();
      }
    }
  },
});

export const _createInviteRecord = internalMutation({
  args: {
    condoId: v.id("condos"),
    email: v.string(),
    name: v.optional(v.string()),
    tokenHash: v.string(),
    expiresAt: v.number(),
    createdBy: v.optional(v.id("platformUsers")),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    const { condoId, email, name, tokenHash, expiresAt, createdBy, now } = args;

    await enforceRateLimit(ctx, `invite:condo:${condoId}`, CONDO_RATE_LIMIT, now);
    await enforceRateLimit(ctx, `invite:email:${email}`, EMAIL_RATE_LIMIT, now);

    const pending = await ctx.db
      .query("invites")
      .withIndex("byCondoEmail", (q: any) => q.eq("condoId", condoId).eq("email", email))
      .collect();

    for (const invite of pending) {
      if (invite.status === "pending") {
        await ctx.db.patch(invite._id, {
          status: "revoked",
          updatedAt: now,
        });
      }
    }

    const inviteId = await ctx.db.insert("invites", {
      condoId,
      email,
      name,
      role: "syndic",
      tokenHash,
      expiresAt,
      usedAt: undefined,
      createdBy,
      createdAt: now,
      updatedAt: now,
      status: "pending",
      attempts: 0,
    });

    return { inviteId };
  },
});

export const _markInviteRevoked = internalMutation({
  args: { inviteId: v.id("invites") },
  handler: async (ctx, { inviteId }) => {
    await ctx.db.patch(inviteId, {
      status: "revoked",
      updatedAt: Date.now(),
    });
  },
});

export const _logSecurityEvent = internalMutation({
  args: {
    type: v.string(),
    key: v.string(),
    meta: v.any(),
  },
  handler: async (ctx, { type, key, meta }) => {
    await ctx.db.insert("securityEvents", {
      type,
      key,
      createdAt: Date.now(),
      meta,
    });
  },
});

export const accept = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const now = Date.now();
    const tokenHash = await sha256Hex(token);
    const invite = await ctx.db
      .query("invites")
      .withIndex("byTokenHash", (q: any) => q.eq("tokenHash", tokenHash))
      .unique();

    if (!invite) {
      throw new Error("Invalid or expired invite");
    }

    const markAttempt = async (status: string) => {
      await ctx.db.patch(invite._id, {
        status,
        attempts: invite.attempts + 1,
        updatedAt: Date.now(),
      });
    };

    if (invite.status !== "pending") {
      await markAttempt(invite.status);
      throw new Error("Invalid or expired invite");
    }

    if (invite.expiresAt < now) {
      await markAttempt("expired");
      throw new Error("Invalid or expired invite");
    }

    const residents = await ctx.db
      .query("residents")
      .withIndex("byCondoEmail", (q: any) =>
        q.eq("condoId", invite.condoId).eq("email", invite.email),
      )
      .collect();

    const existingResident = residents[0];
    let residentId: Id<"residents">;

    if (existingResident) {
      await ctx.db.patch(existingResident._id, {
        role: "syndic",
        isActive: true,
        updatedAt: now,
      });
      residentId = existingResident._id;
    } else {
      residentId = await ctx.db.insert("residents", {
        condoId: invite.condoId,
        name: invite.name ?? invite.email,
        email: invite.email,
        phone: undefined,
        role: "syndic",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    await ctx.db.patch(invite._id, {
      status: "used",
      usedAt: now,
      attempts: invite.attempts + 1,
      updatedAt: now,
    });

    await ctx.db.insert("securityEvents", {
      type: "invite_accept",
      key: invite.email,
      createdAt: now,
      meta: { condoId: invite.condoId, residentId, inviteId: invite._id },
    });

    return {
      ok: true,
      condoId: invite.condoId,
      residentId,
      email: invite.email,
    };
  },
});

export const listByCondo = query({
  args: { condoId: v.id("condos") },
  handler: async (ctx, { condoId }) => {
    return await ctx.db
      .query("invites")
      .withIndex("byCondoEmail", (q: any) => q.eq("condoId", condoId))
      .collect();
  },
});

export const revoke = mutation({
  args: {
    token: v.string(),
    inviteId: v.id("invites"),
  },
  handler: async (ctx, { token, inviteId }) => {
    const invite = await ctx.db.get(inviteId);
    if (!invite) {
      throw inviteError();
    }

    let actor: { type: "platform" | "resident"; id: string } | null = null;
    try {
      const { user } = await requirePlatformRole(ctx, ["super_admin", "ops", "support"], token);
      actor = { type: "platform", id: String(user._id) };
    } catch {
      try {
        const { resident } = await requireCondoRole(ctx, invite.condoId, ["syndic", "manager"], token);
        actor = { type: "resident", id: String(resident._id) };
      } catch {
        throw inviteError();
      }
    }

    const now = Date.now();
    if (invite.status !== "pending") {
      return { ok: true, status: invite.status };
    }

    const beforeStatus = invite.status;
    await ctx.db.patch(invite._id, {
      status: "revoked",
      updatedAt: now,
    });

    await ctx.db.insert("securityEvents", {
      type: "invite_revoke",
      key: invite.email,
      createdAt: now,
      meta: { condoId: invite.condoId, inviteId: invite._id },
    });

    await recordAdminAuditEvent(ctx, {
      action: "invite.revoked",
      actor: actor ?? { type: "unknown" },
      condoId: invite.condoId,
      entityType: "invite",
      entityId: String(invite._id),
      before: { status: beforeStatus },
      after: { status: "revoked" },
      metadata: { email: invite.email },
    });

    return { ok: true, status: "revoked" };
  },
});
