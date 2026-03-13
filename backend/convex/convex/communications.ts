import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { assert, loadSession, requireCondoRole, requirePlatformRole } from "./guards";

async function authorizePublisher(ctx: any, token: string, condoId: any) {
  try {
    const { user } = await requirePlatformRole(ctx, ["super_admin", "ops", "support"], token);
    const residents = await ctx.db
      .query("residents")
      .withIndex("byCondo", (q: any) => q.eq("condoId", condoId))
      .collect();
    const syndic =
      residents.find((resident: any) => resident.role === "syndic" && resident.isActive !== false) ??
      residents.find((resident: any) => resident.isActive !== false);
    if (!syndic) {
      throw new Error("Nenhum síndico ativo encontrado para este condomínio");
    }
    return { actorType: "platform" as const, actorId: String(user._id), residentId: syndic._id };
  } catch {
    const { resident } = await requireCondoRole(ctx, condoId, ["syndic", "manager"], token);
    return { actorType: "resident" as const, actorId: String(resident._id), residentId: resident._id };
  }
}

async function getResidentBlocks(ctx: any, residentId: any, condoId: any): Promise<Set<string>> {
  const memberships = await ctx.db
    .query("memberships")
    .withIndex("byResident", (q: any) => q.eq("residentId", residentId))
    .collect();
  const unitDocs = await Promise.all(memberships.map((membership: any) => ctx.db.get(membership.unitId)));
  return new Set(
    unitDocs
      .filter((unit: any) => unit && unit.condoId === condoId && unit.block)
      .map((unit: any) => String(unit.block).trim().toLowerCase()),
  );
}

async function residentMatchesAudience(
  ctx: any,
  resident: any,
  communication: any,
): Promise<boolean> {
  const audienceType = communication.audienceType ?? "all";
  if (audienceType === "role") {
    return !!communication.targetRole && resident.role === communication.targetRole;
  }
  if (audienceType === "block") {
    if (!communication.targetBlock) return false;
    const residentBlocks = await getResidentBlocks(ctx, resident._id, communication.condoId);
    return residentBlocks.has(String(communication.targetBlock).trim().toLowerCase());
  }
  return true;
}

export const publish = mutation({
  args: {
    token: v.string(),
    condoId: v.id("condos"),
    title: v.string(),
    message: v.optional(v.string()),
    documentId: v.optional(v.id("documents")),
    audienceType: v.optional(v.union(v.literal("all"), v.literal("role"), v.literal("block"))),
    targetRole: v.optional(v.string()),
    targetBlock: v.optional(v.string()),
  },
  handler: async (ctx, { token, condoId, title, message, documentId, audienceType, targetRole, targetBlock }) => {
    const now = Date.now();
    const cleanedTitle = title.trim();
    if (!cleanedTitle) {
      throw new Error("Título é obrigatório");
    }
    const normalizedAudienceType = audienceType ?? "all";
    const normalizedTargetRole = targetRole?.trim() ? targetRole.trim() : undefined;
    const normalizedTargetBlock = targetBlock?.trim() ? targetBlock.trim() : undefined;

    if (normalizedAudienceType === "role" && !normalizedTargetRole) {
      throw new Error("Selecione a função para segmentação.");
    }
    if (normalizedAudienceType === "block" && !normalizedTargetBlock) {
      throw new Error("Selecione o bloco para segmentação.");
    }
    if (normalizedAudienceType === "all" && (normalizedTargetRole || normalizedTargetBlock)) {
      throw new Error("Remova os filtros de público para envio geral.");
    }

    const { residentId } = await authorizePublisher(ctx, token, condoId);

    if (documentId) {
      const document = await ctx.db.get(documentId);
      if (!document) throw new Error("Documento não encontrado");
      if (document.orgId !== String(condoId)) {
        throw new Error("Documento inválido para este condomínio");
      }
    }

    const communicationId = await ctx.db.insert("residentCommunications", {
      condoId,
      title: cleanedTitle,
      message: message?.trim() ? message.trim() : undefined,
      documentId,
      audienceType: normalizedAudienceType,
      targetRole: normalizedAudienceType === "role" ? normalizedTargetRole : undefined,
      targetBlock: normalizedAudienceType === "block" ? normalizedTargetBlock : undefined,
      publishedBy: residentId,
      status: "published",
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.scheduler.runAfter(0, internal.notifications.sendResidentCommunicationEmail, {
      communicationId,
    });

    return { communicationId };
  },
});

export const listByCondo = query({
  args: {
    token: v.string(),
    condoId: v.id("condos"),
    status: v.optional(v.union(v.literal("published"), v.literal("archived"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { token, condoId, status, limit }) => {
    await authorizePublisher(ctx, token, condoId);

    let rows = await ctx.db
      .query("residentCommunications")
      .withIndex("byCondo", (q: any) => q.eq("condoId", condoId))
      .collect();
    if (status) {
      rows = rows.filter((row: any) => row.status === status);
    }
    rows.sort((a: any, b: any) => b.publishedAt - a.publishedAt);
    return rows.slice(0, limit ?? 200);
  },
});

export const listForResident = query({
  args: {
    token: v.string(),
    condoId: v.id("condos"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { token, condoId, limit }) => {
    const session = await loadSession(ctx, token);
    assert(session.type === "resident" && session.residentId, "Forbidden");
    const resident = await ctx.db.get(session.residentId);
    assert(resident && resident.condoId === condoId, "Forbidden");
    if (resident.isActive === false) return [];

    const rows = await ctx.db
      .query("residentCommunications")
      .withIndex("byCondoStatus", (q: any) => q.eq("condoId", condoId).eq("status", "published"))
      .collect();
    const visibleRows: any[] = [];
    for (const row of rows) {
      if (await residentMatchesAudience(ctx, resident, row)) {
        visibleRows.push(row);
      }
    }

    visibleRows.sort((a: any, b: any) => b.publishedAt - a.publishedAt);
    return visibleRows.slice(0, limit ?? 200);
  },
});

export const getForResident = query({
  args: {
    token: v.string(),
    communicationId: v.id("residentCommunications"),
  },
  handler: async (ctx, { token, communicationId }) => {
    const session = await loadSession(ctx, token);
    assert(session.type === "resident" && session.residentId, "Forbidden");
    const resident = await ctx.db.get(session.residentId);
    assert(resident, "Forbidden");
    if (resident.isActive === false) return null;

    const communication = await ctx.db.get(communicationId);
    if (!communication || communication.status !== "published") return null;
    assert(communication.condoId === resident.condoId, "Forbidden");

    const eligible = await residentMatchesAudience(ctx, resident, communication);
    if (!eligible) return null;
    return communication;
  },
});

export const getDetail = query({
  args: {
    token: v.string(),
    communicationId: v.id("residentCommunications"),
  },
  handler: async (ctx, { token, communicationId }) => {
    const communication = await ctx.db.get(communicationId);
    if (!communication) return null;
    await authorizePublisher(ctx, token, communication.condoId);

    const receipts = await ctx.db
      .query("residentCommunicationReceipts")
      .withIndex("byCommunication", (q: any) => q.eq("communicationId", communicationId))
      .collect();

    const residentIds = Array.from(new Set(receipts.map((receipt: any) => String(receipt.residentId))));
    const residents = await Promise.all(
      residentIds.map((residentId) => ctx.db.get(residentId)),
    );
    const residentMap = new Map(residents.filter(Boolean).map((resident: any) => [String(resident._id), resident]));

    const recipients = receipts
      .map((receipt: any) => {
        const resident = residentMap.get(String(receipt.residentId));
        return {
          receiptId: receipt._id,
          residentId: receipt.residentId,
          residentName: resident?.name ?? "Morador removido",
          residentEmail: receipt.email ?? resident?.email ?? null,
          residentRole: resident?.role ?? null,
          sentCount: receipt.sentCount ?? 0,
          failedCount: receipt.failedCount ?? 0,
          lastSentAt: receipt.lastSentAt ?? null,
          lastFailedAt: receipt.lastFailedAt ?? null,
          lastError: receipt.lastError ?? null,
          openCount: receipt.openCount ?? 0,
          lastOpenedAt: receipt.lastOpenedAt ?? null,
          received: (receipt.sentCount ?? 0) > 0,
          opened: (receipt.openCount ?? 0) > 0,
        };
      })
      .sort((a, b) => {
        if (a.opened !== b.opened) return a.opened ? -1 : 1;
        return a.residentName.localeCompare(b.residentName, "pt-BR");
      });

    const totals = {
      recipients: recipients.length,
      received: recipients.filter((recipient) => recipient.received).length,
      opened: recipients.filter((recipient) => recipient.opened).length,
      failed: recipients.filter((recipient) => recipient.failedCount > 0).length,
    };

    return {
      communication,
      recipients,
      totals,
    };
  },
});

export const archive = mutation({
  args: {
    token: v.string(),
    communicationId: v.id("residentCommunications"),
  },
  handler: async (ctx, { token, communicationId }) => {
    const communication = await ctx.db.get(communicationId);
    if (!communication) return false;

    await authorizePublisher(ctx, token, communication.condoId);

    if (communication.status === "archived") return true;
    await ctx.db.patch(communicationId, {
      status: "archived",
      updatedAt: Date.now(),
    });
    return true;
  },
});

export const resend = mutation({
  args: {
    token: v.string(),
    communicationId: v.id("residentCommunications"),
  },
  handler: async (ctx, { token, communicationId }) => {
    const communication = await ctx.db.get(communicationId);
    if (!communication) return false;

    await authorizePublisher(ctx, token, communication.condoId);
    if (communication.status !== "published") {
      throw new Error("Somente comunicados publicados podem ser reenviados.");
    }

    await ctx.db.patch(communicationId, { updatedAt: Date.now() });
    await ctx.scheduler.runAfter(0, internal.notifications.sendResidentCommunicationEmail, {
      communicationId,
      isResend: true,
    });
    return true;
  },
});

export const markOpened = mutation({
  args: {
    token: v.string(),
    communicationId: v.id("residentCommunications"),
  },
  handler: async (ctx, { token, communicationId }) => {
    const session = await loadSession(ctx, token);
    assert(session.type === "resident" && session.residentId, "Forbidden");
    const resident = await ctx.db.get(session.residentId);
    assert(resident, "Forbidden");

    const communication = await ctx.db.get(communicationId);
    assert(communication, "Not found");
    assert(communication.condoId === resident.condoId, "Forbidden");
    if (communication.status !== "published") return false;

    const eligible = await residentMatchesAudience(ctx, resident, communication);
    assert(eligible, "Forbidden");

    const receipt = await ctx.db
      .query("residentCommunicationReceipts")
      .withIndex("byCommunicationResident", (q: any) =>
        q.eq("communicationId", communicationId).eq("residentId", resident._id),
      )
      .unique();
    const now = Date.now();
    if (!receipt) {
      await ctx.db.insert("residentCommunicationReceipts", {
        communicationId,
        residentId: resident._id,
        email: resident.email ?? undefined,
        sentCount: 0,
        failedCount: 0,
        openCount: 1,
        lastOpenedAt: now,
        createdAt: now,
        updatedAt: now,
      });
      return true;
    }

    await ctx.db.patch(receipt._id, {
      openCount: (receipt.openCount ?? 0) + 1,
      lastOpenedAt: now,
      updatedAt: now,
    });
    return true;
  },
});

export const deleteHard = mutation({
  args: {
    token: v.string(),
    communicationId: v.id("residentCommunications"),
  },
  handler: async (ctx, { token, communicationId }) => {
    const communication = await ctx.db.get(communicationId);
    if (!communication) return false;

    await authorizePublisher(ctx, token, communication.condoId);
    if (communication.status !== "archived") {
      throw new Error("A exclusão definitiva só é permitida para comunicados arquivados.");
    }

    const receipts = await ctx.db
      .query("residentCommunicationReceipts")
      .withIndex("byCommunication", (q: any) => q.eq("communicationId", communicationId))
      .collect();
    await Promise.all(receipts.map((receipt: any) => ctx.db.delete(receipt._id)));

    const communicationIdText = String(communicationId);
    const logs = await ctx.db
      .query("notificationLogs")
      .withIndex("byCondo", (q: any) => q.eq("condoId", communication.condoId))
      .collect();
    await Promise.all(
      logs
        .filter((log: any) => {
          if (log.template !== "communication") return false;
          const note = (log.meta as any)?.note;
          return typeof note === "string" && note.includes(communicationIdText);
        })
        .map((log: any) => ctx.db.delete(log._id)),
    );

    await ctx.db.delete(communicationId);
    return true;
  },
});
