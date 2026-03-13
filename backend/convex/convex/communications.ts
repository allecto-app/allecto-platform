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

export const publish = mutation({
  args: {
    token: v.string(),
    condoId: v.id("condos"),
    title: v.string(),
    message: v.optional(v.string()),
    documentId: v.optional(v.id("documents")),
  },
  handler: async (ctx, { token, condoId, title, message, documentId }) => {
    const now = Date.now();
    const cleanedTitle = title.trim();
    if (!cleanedTitle) {
      throw new Error("Título é obrigatório");
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
    rows.sort((a: any, b: any) => b.publishedAt - a.publishedAt);
    return rows.slice(0, limit ?? 200);
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
