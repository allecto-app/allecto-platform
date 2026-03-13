import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requirePlatformRole } from "./guards";
import { normalizeEmail } from "./_secu";
import { anonymizeResidentById } from "./lib/residentPrivacy";
import { recordAdminAuditEvent } from "./lib/adminAudit";

const DAY_MS = 24 * 60 * 60 * 1000;
const DSAR_DUE_DAYS = 15;

type RequestType = "access" | "deletion";
type RequestStatus = "open" | "in_review" | "approved" | "rejected" | "completed";

function actorFromUser(userId: string) {
  return `platform:${userId}`;
}

function randomCode(length: number) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

function buildProtocol(now: number) {
  const date = new Date(now).toISOString().slice(0, 10).replace(/-/g, "");
  return `DSAR-${date}-${randomCode(6)}`;
}

async function logEvent(
  ctx: any,
  requestId: any,
  action: string,
  actor: string,
  note?: string,
  payload?: any,
) {
  await ctx.db.insert("dsarRequestEvents", {
    requestId,
    action,
    actor,
    note,
    payload,
    createdAt: Date.now(),
  });
}

async function resolveResident(ctx: any, residentId?: any, residentEmail?: string) {
  if (residentId) {
    const resident = await ctx.db.get(residentId);
    if (!resident || resident.deletedAt !== undefined) return null;
    return resident;
  }
  if (!residentEmail) return null;
  const normalized = normalizeEmail(residentEmail);
  const resident = await ctx.db
    .query("residents")
    .withIndex("byEmail", (q: any) => q.eq("email", normalized))
    .first();
  if (!resident || resident.deletedAt !== undefined) return null;
  return resident;
}

export const createRequest = mutation({
  args: {
    token: v.string(),
    type: v.union(v.literal("access"), v.literal("deletion")),
    residentId: v.optional(v.id("residents")),
    residentEmail: v.optional(v.string()),
    condoId: v.optional(v.id("condos")),
    note: v.optional(v.string()),
  },
  handler: async (ctx, { token, type, residentId, residentEmail, condoId, note }) => {
    const { user } = await requirePlatformRole(ctx, ["super_admin"], token);

    if (!residentId && !residentEmail) {
      throw new Error("Resident id or email is required");
    }

    const resident = await resolveResident(ctx, residentId, residentEmail);
    if (!resident) {
      throw new Error("Resident not found");
    }

    if (condoId && resident.condoId !== condoId) {
      throw new Error("Resident does not belong to the provided condo");
    }

    const now = Date.now();
    const protocol = buildProtocol(now);
    const dueAt = now + DSAR_DUE_DAYS * DAY_MS;
    const actor = actorFromUser(String(user._id));
    const normalizedEmail = resident.email ?? (residentEmail ? normalizeEmail(residentEmail) : undefined);

    const requestId = await ctx.db.insert("dsarRequests", {
      type,
      status: "open",
      subjectType: "resident",
      residentId: resident._id,
      residentEmail: normalizedEmail,
      condoId: resident.condoId,
      protocol,
      requestedAt: now,
      dueAt,
      createdBy: actor,
      updatedBy: actor,
      resolutionNote: note,
      createdAt: now,
      updatedAt: now,
    });

    await logEvent(ctx, requestId, "request_created", actor, note, {
      type,
      residentId: resident._id,
      condoId: resident.condoId,
    });
    await recordAdminAuditEvent(ctx, {
      action: "dsar.request.created",
      actor: { type: "platform", id: String(user._id) },
      condoId: resident.condoId,
      entityType: "dsarRequest",
      entityId: String(requestId),
      after: {
        protocol,
        type,
        status: "open",
        residentId: String(resident._id),
      },
      metadata: { note: note ?? null },
    });

    return { requestId, protocol };
  },
});

export const listRequests = query({
  args: {
    token: v.string(),
    status: v.optional(
      v.union(
        v.literal("open"),
        v.literal("in_review"),
        v.literal("approved"),
        v.literal("rejected"),
        v.literal("completed"),
      ),
    ),
    type: v.optional(v.union(v.literal("access"), v.literal("deletion"))),
    condoId: v.optional(v.id("condos")),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { token, status, type, condoId, dateFrom, dateTo, search, limit }) => {
    await requirePlatformRole(ctx, ["super_admin"], token);

    const scanLimit = Math.max((limit ?? 100) * 5, 200);
    const records = status
      ? await ctx.db
          .query("dsarRequests")
          .withIndex("byStatus", (q: any) => q.eq("status", status))
          .collect()
      : await ctx.db
          .query("dsarRequests")
          .withIndex("byRequestedAt", (q: any) => q.gte("requestedAt", 0))
          .order("desc")
          .take(scanLimit);

    const normalizedSearch = search?.trim().toLowerCase() ?? "";
    const filtered = records.filter((row: any) => {
      if (type && row.type !== type) return false;
      if (condoId && row.condoId !== condoId) return false;
      if (dateFrom && row.requestedAt < dateFrom) return false;
      if (dateTo && row.requestedAt > dateTo) return false;
      return true;
    });

    const sorted = filtered
      .sort((a: any, b: any) => b.requestedAt - a.requestedAt)
      .slice(0, limit ?? 100);

    const residentIds = Array.from(
      new Set(sorted.map((item: any) => item.residentId).filter(Boolean)),
    );
    const condoIds = Array.from(new Set(sorted.map((item: any) => item.condoId).filter(Boolean)));

    const [residents, condos] = await Promise.all([
      Promise.all(residentIds.map((id: any) => ctx.db.get(id))),
      Promise.all(condoIds.map((id: any) => ctx.db.get(id))),
    ]);
    const residentMap = new Map(residents.filter(Boolean).map((row: any) => [row._id, row]));
    const condoMap = new Map(condos.filter(Boolean).map((row: any) => [row._id, row]));

    const mapped = sorted.map((row: any) => {
      const resident = row.residentId ? residentMap.get(row.residentId) : null;
      const condo = row.condoId ? condoMap.get(row.condoId) : null;
      return {
        ...row,
        residentName: resident?.name ?? null,
        condoName: condo?.name ?? null,
        condoSubdomain: condo?.subdomain ?? null,
      };
    });

    if (!normalizedSearch) return mapped;

    return mapped.filter((row: any) => {
      const haystack = [
        row.protocol,
        row.residentEmail,
        row.residentName,
        row.condoName,
        row.condoSubdomain,
        row.assignedTo,
        row.resolutionNote,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  },
});

export const getRequest = query({
  args: {
    token: v.string(),
    requestId: v.id("dsarRequests"),
  },
  handler: async (ctx, { token, requestId }) => {
    await requirePlatformRole(ctx, ["super_admin"], token);

    const request = await ctx.db.get(requestId);
    if (!request) return null;

    const [resident, condo, events] = await Promise.all([
      request.residentId ? ctx.db.get(request.residentId) : null,
      request.condoId ? ctx.db.get(request.condoId) : null,
      ctx.db
        .query("dsarRequestEvents")
        .withIndex("byRequest", (q: any) => q.eq("requestId", requestId))
        .collect(),
    ]);

    return {
      request,
      resident: resident
        ? {
            id: resident._id,
            name: resident.name,
            email: resident.email ?? null,
            phone: resident.phone ?? null,
            role: resident.role,
            isActive: resident.isActive,
            deletedAt: resident.deletedAt ?? null,
          }
        : null,
      condo: condo
        ? {
            id: condo._id,
            name: condo.name,
            subdomain: condo.subdomain,
          }
        : null,
      events: events.sort((a: any, b: any) => b.createdAt - a.createdAt),
    };
  },
});

export const updateRequest = mutation({
  args: {
    token: v.string(),
    requestId: v.id("dsarRequests"),
    status: v.optional(
      v.union(
        v.literal("open"),
        v.literal("in_review"),
        v.literal("approved"),
        v.literal("rejected"),
        v.literal("completed"),
      ),
    ),
    assignedTo: v.optional(v.string()),
    resolutionNote: v.optional(v.string()),
    eventNote: v.optional(v.string()),
  },
  handler: async (ctx, { token, requestId, status, assignedTo, resolutionNote, eventNote }) => {
    const { user } = await requirePlatformRole(ctx, ["super_admin"], token);
    const request = await ctx.db.get(requestId);
    if (!request) throw new Error("Request not found");

    const now = Date.now();
    const actor = actorFromUser(String(user._id));
    const nextStatus: RequestStatus = status ?? (request.status as RequestStatus);
    const patch: Record<string, any> = {
      status: nextStatus,
      updatedAt: now,
      updatedBy: actor,
    };

    if (assignedTo !== undefined) {
      patch.assignedTo = assignedTo || undefined;
    }
    if (resolutionNote !== undefined) {
      patch.resolutionNote = resolutionNote || undefined;
    }
    if (nextStatus === "completed") {
      patch.completedAt = now;
    }

    await ctx.db.patch(requestId, patch);
    await logEvent(ctx, requestId, "request_updated", actor, eventNote, {
      status: nextStatus,
      assignedTo: patch.assignedTo ?? request.assignedTo ?? null,
    });
    await recordAdminAuditEvent(ctx, {
      action: "dsar.request.updated",
      actor: { type: "platform", id: String(user._id) },
      condoId: request.condoId,
      entityType: "dsarRequest",
      entityId: String(requestId),
      before: {
        status: request.status,
        assignedTo: request.assignedTo ?? null,
        resolutionNote: request.resolutionNote ?? null,
      },
      after: {
        status: nextStatus,
        assignedTo: patch.assignedTo ?? request.assignedTo ?? null,
        resolutionNote: patch.resolutionNote ?? request.resolutionNote ?? null,
      },
      metadata: { eventNote: eventNote ?? null },
    });

    return { ok: true };
  },
});

export const generateAccessExport = mutation({
  args: {
    token: v.string(),
    requestId: v.id("dsarRequests"),
  },
  handler: async (ctx, { token, requestId }) => {
    const { user } = await requirePlatformRole(ctx, ["super_admin"], token);
    const request = await ctx.db.get(requestId);
    if (!request) throw new Error("Request not found");
    if (request.type !== "access") {
      throw new Error("Export is only available for access requests");
    }
    if (!request.residentId) {
      throw new Error("Request has no resident linked");
    }

    const resident = await ctx.db.get(request.residentId);
    if (!resident || resident.deletedAt !== undefined) {
      throw new Error("Resident not found");
    }

    const [condo, memberships, votes, otps, invites, sessions] = await Promise.all([
      ctx.db.get(resident.condoId),
      ctx.db
        .query("memberships")
        .withIndex("byResident", (q: any) => q.eq("residentId", resident._id))
        .collect(),
      ctx.db
        .query("votes")
        .withIndex("byResidentMinute", (q: any) => q.eq("residentId", resident._id))
        .collect(),
      resident.email
        ? ctx.db
            .query("otps")
            .withIndex("byCondoEmail", (q: any) => q.eq("condoId", resident.condoId).eq("email", resident.email!))
            .collect()
        : [],
      resident.email
        ? ctx.db
            .query("invites")
            .withIndex("byCondoEmail", (q: any) => q.eq("condoId", resident.condoId).eq("email", resident.email!))
            .collect()
        : [],
      ctx.db
        .query("sessions")
        .withIndex("byResident", (q: any) => q.eq("residentId", resident._id))
        .collect(),
    ]);

    const unitIds = Array.from(new Set(memberships.map((item: any) => item.unitId)));
    const minuteIds = Array.from(new Set(votes.map((item: any) => item.minuteId)));
    const [units, minutes] = await Promise.all([
      Promise.all(unitIds.map((id) => ctx.db.get(id))),
      Promise.all(minuteIds.map((id) => ctx.db.get(id))),
    ]);
    const unitMap = new Map(units.filter(Boolean).map((item: any) => [item._id, item]));
    const minuteMap = new Map(minutes.filter(Boolean).map((item: any) => [item._id, item]));

    const payload = {
      exportedAt: Date.now(),
      request: {
        id: request._id,
        protocol: request.protocol,
        type: request.type,
        status: request.status,
        requestedAt: request.requestedAt,
      },
      resident: {
        id: resident._id,
        name: resident.name,
        email: resident.email ?? null,
        phone: resident.phone ?? null,
        role: resident.role,
        isActive: resident.isActive,
        createdAt: resident.createdAt,
        updatedAt: resident.updatedAt,
      },
      condo: condo
        ? {
            id: condo._id,
            name: condo.name,
            subdomain: condo.subdomain,
          }
        : null,
      memberships: memberships.map((membership: any) => {
        const unit = unitMap.get(membership.unitId);
        return {
          membershipId: membership._id,
          role: membership.role ?? null,
          createdAt: membership.createdAt,
          unit: unit
            ? {
                id: unit._id,
                code: unit.code,
                block: unit.block ?? null,
                floor: unit.floor ?? null,
              }
            : null,
        };
      }),
      votes: votes.map((vote: any) => {
        const minute = minuteMap.get(vote.minuteId);
        return {
          voteId: vote._id,
          minuteId: vote.minuteId,
          minuteTitle: minute?.title ?? null,
          choice: vote.choice,
          comment: vote.comment ?? null,
          createdAt: vote.createdAt,
          unitId: vote.unitId,
        };
      }),
      auth: {
        sessions: sessions.map((session: any) => ({
          id: session._id,
          type: session.type,
          createdAt: session.createdAt,
          expiresAt: session.expiresAt,
          revokedAt: session.revokedAt ?? null,
          lastUsedAt: session.lastUsedAt,
          roles: session.roles ?? [],
        })),
        otps: otps.map((otp: any) => ({
          id: otp._id,
          createdAt: otp.createdAt,
          expiresAt: otp.expiresAt,
          consumedAt: otp.consumedAt ?? null,
        })),
        invites: invites.map((invite: any) => ({
          id: invite._id,
          status: invite.status,
          createdAt: invite.createdAt,
          expiresAt: invite.expiresAt,
          usedAt: invite.usedAt ?? null,
          attempts: invite.attempts,
        })),
      },
    };

    const now = Date.now();
    const actor = actorFromUser(String(user._id));
    await ctx.db.patch(requestId, {
      exportLastGeneratedAt: now,
      updatedAt: now,
      updatedBy: actor,
      lastResultSummary: {
        export: {
          generatedAt: now,
          memberships: memberships.length,
          votes: votes.length,
          sessions: sessions.length,
          otps: otps.length,
          invites: invites.length,
        },
      },
    });

    await logEvent(ctx, requestId, "export_generated", actor, "DSAR export generated", {
      memberships: memberships.length,
      votes: votes.length,
      sessions: sessions.length,
      otps: otps.length,
      invites: invites.length,
    });
    await recordAdminAuditEvent(ctx, {
      action: "dsar.export.generated",
      actor: { type: "platform", id: String(user._id) },
      condoId: request.condoId,
      entityType: "dsarRequest",
      entityId: String(requestId),
      after: {
        protocol: request.protocol,
        generatedAt: now,
      },
      metadata: {
        memberships: memberships.length,
        votes: votes.length,
        sessions: sessions.length,
        otps: otps.length,
        invites: invites.length,
      },
    });

    return payload;
  },
});

export const executeDeletion = mutation({
  args: {
    token: v.string(),
    requestId: v.id("dsarRequests"),
    note: v.optional(v.string()),
  },
  handler: async (ctx, { token, requestId, note }) => {
    const { user } = await requirePlatformRole(ctx, ["super_admin"], token);
    const request = await ctx.db.get(requestId);
    if (!request) throw new Error("Request not found");
    if (request.type !== "deletion") {
      throw new Error("Deletion execution is only available for deletion requests");
    }
    if (!request.residentId) {
      throw new Error("Request has no resident linked");
    }

    const result = await anonymizeResidentById(ctx, request.residentId, {
      forceDeactivate: true,
    });

    const now = Date.now();
    const actor = actorFromUser(String(user._id));
    await ctx.db.patch(requestId, {
      status: "completed",
      completedAt: now,
      deletionExecutedAt: now,
      updatedAt: now,
      updatedBy: actor,
      resolutionNote: note ?? request.resolutionNote,
      lastResultSummary: {
        deletion: {
          executedAt: now,
          result,
        },
      },
    });

    await logEvent(ctx, requestId, "deletion_executed", actor, note, result);
    await recordAdminAuditEvent(ctx, {
      action: "dsar.deletion.executed",
      actor: { type: "platform", id: String(user._id) },
      condoId: request.condoId,
      entityType: "dsarRequest",
      entityId: String(requestId),
      before: {
        status: request.status,
        deletionExecutedAt: request.deletionExecutedAt ?? null,
      },
      after: {
        status: "completed",
        deletionExecutedAt: now,
      },
      metadata: result,
    });
    return result;
  },
});
