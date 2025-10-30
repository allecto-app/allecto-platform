import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { canReadDoc, canUpload, requireActor } from "./lib/authz";
import type { Id } from "./_generated/dataModel";

const MAX_PDF_BYTES = 10 * 1024 * 1024;
const PDF_MIME = "application/pdf";
const VIEW_TTL_SECONDS = Number(process.env.VIEW_JWT_TTL_SECONDS ?? 5 * 60);

function assertPdf(contentType: string) {
  if (contentType !== PDF_MIME) {
    throw new Error("ONLY_PDF_ALLOWED");
  }
}

function assertSize(size: number) {
  if (size <= 0) throw new Error("INVALID_FILE");
  if (size > MAX_PDF_BYTES) throw new Error("FILE_TOO_LARGE");
}

const finalizeArgs = {
  sessionToken: v.optional(v.string()),
  storageId: v.string(),
  title: v.string(),
  contentType: v.string(),
  size: v.number(),
  visibility: v.union(v.literal("org"), v.literal("assembly"), v.literal("private")),
  assemblyId: v.optional(v.string()),
  allowedRoles: v.optional(v.array(v.string())),
  allowedUserIds: v.optional(v.array(v.string())),
  sha256: v.string(),
  orgId: v.optional(v.string()),
};

export const generateUploadUrl = mutation({
  args: {
    sessionToken: v.optional(v.string()),
    orgId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await requireActor(ctx, {
      sessionToken: args.sessionToken ?? null,
      orgIdHint: args.orgId ?? null,
    });
    if (!canUpload(actor)) {
      throw new Error("FORBIDDEN");
    }
    const url = await ctx.storage.generateUploadUrl();
    return { url, maxBytes: MAX_PDF_BYTES, contentType: PDF_MIME };
  },
});

export const finalizeUpload = mutation({
  args: finalizeArgs,
  handler: async (ctx, args) => {
    const actor = await requireActor(ctx, {
      sessionToken: args.sessionToken ?? null,
      orgIdHint: args.orgId ?? null,
    });
    if (!canUpload(actor)) {
      throw new Error("FORBIDDEN");
    }

    assertPdf(args.contentType);
    assertSize(args.size);

    const metadata = await ctx.storage.getMetadata(args.storageId);
    if (!metadata) {
      throw new Error("STORAGE_NOT_FOUND");
    }

    if (metadata.size !== args.size) {
      throw new Error("SIZE_MISMATCH");
    }

    if (metadata.contentType && metadata.contentType !== args.contentType) {
      throw new Error("CONTENT_TYPE_MISMATCH");
    }

    if (args.sha256.length !== 64) {
      throw new Error("INVALID_SHA");
    }

    const allowedRoles = args.allowedRoles ?? ["admin", "syndic", "resident"];
    const orgId = args.orgId ?? actor.orgId;

    const allowedUserIds = args.allowedUserIds ?? [];

    const now = Date.now();
    const documentId = await ctx.db.insert("documents", {
      title: args.title,
      orgId,
      assemblyId: args.assemblyId,
      storageId: args.storageId,
      contentType: args.contentType,
      size: args.size,
      sha256: args.sha256.toLowerCase(),
      visibility: args.visibility,
      allowedRoles,
      allowedUserIds,
      createdByUserId: actor.userId,
      createdAt: now,
      lastViewedAt: undefined,
      viewCount: 0,
    });

    await ctx.db.insert("documentEvents", {
      documentId,
      orgId,
      userId: actor.userId,
      event: "upload",
      createdAt: now,
    });

    return { id: documentId };
  },
});

export const get = query({
  args: {
    docId: v.id("documents"),
    sessionToken: v.optional(v.string()),
    orgId: v.optional(v.string()),
  },
  handler: async (ctx, { docId, sessionToken, orgId }) => {
    const actor = await requireActor(ctx, {
      sessionToken: sessionToken ?? null,
      orgIdHint: orgId ?? null,
    });
    const doc = await ctx.db.get(docId);
    if (!doc) {
      throw new Error("NOT_FOUND");
    }
    if (!canReadDoc(actor, doc)) {
      throw new Error("FORBIDDEN");
    }
    return doc;
  },
});

export const list = query({
  args: {
    sessionToken: v.optional(v.string()),
    assemblyId: v.optional(v.string()),
    visibility: v.optional(v.union(v.literal("org"), v.literal("assembly"), v.literal("private"))),
    limit: v.optional(v.number()),
    orgId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await requireActor(ctx, {
      sessionToken: args.sessionToken ?? null,
      orgIdHint: args.orgId ?? null,
    });
    const orgId = args.orgId ?? actor.orgId;
    const query = ctx.db
      .query("documents")
      .withIndex("by_org", (q) => q.eq("orgId", orgId));

    const docs = await query.order("desc").take(args.limit ?? 200);
    return docs.filter((doc) => {
      if (args.assemblyId && doc.assemblyId !== args.assemblyId) return false;
      if (args.visibility && doc.visibility !== args.visibility) return false;
      return canReadDoc(actor, doc);
    });
  },
});

export const getViewToken = mutation({
  args: {
    docId: v.id("documents"),
    sessionToken: v.optional(v.string()),
    orgId: v.optional(v.string()),
  },
  handler: async (ctx, { docId, sessionToken, orgId }) => {
    const actor = await requireActor(ctx, {
      sessionToken: sessionToken ?? null,
      orgIdHint: orgId ?? null,
    });
    const doc = await ctx.db.get(docId);
    if (!doc) {
      throw new Error("NOT_FOUND");
    }
    if (!canReadDoc(actor, doc)) {
      throw new Error("FORBIDDEN");
    }

    const fileUrl = await ctx.storage.getUrl(doc.storageId);
    if (!fileUrl) {
      throw new Error("FILE_URL_UNAVAILABLE");
    }

    const now = Date.now();
    await ctx.db.patch(doc._id, {
      lastViewedAt: now,
      viewCount: doc.viewCount + 1,
    });
    await ctx.db.insert("documentEvents", {
      documentId: doc._id,
      orgId: actor.orgId,
      userId: actor.userId,
      event: "view",
      createdAt: now,
    });

    return { url: fileUrl, expiresIn: VIEW_TTL_SECONDS };
  },
});

export const listEvents = query({
  args: {
    docId: v.id("documents"),
    sessionToken: v.optional(v.string()),
    limit: v.optional(v.number()),
    orgId: v.optional(v.string()),
  },
  handler: async (ctx, { docId, sessionToken, limit, orgId }) => {
    const actor = await requireActor(ctx, {
      sessionToken: sessionToken ?? null,
      orgIdHint: orgId ?? null,
    });
    const doc = await ctx.db.get(docId);
    if (!doc) {
      throw new Error("NOT_FOUND");
    }
    if (!canReadDoc(actor, doc)) {
      throw new Error("FORBIDDEN");
    }

    const events = await ctx.db
      .query("documentEvents")
      .withIndex("by_document", (q) => q.eq("documentId", docId))
      .order("desc")
      .take(limit ?? 100);

    return events;
  },
});
