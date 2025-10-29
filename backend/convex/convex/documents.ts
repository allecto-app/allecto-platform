import { httpAction, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { canReadDoc, canUpload, requireActor, type Actor } from "./lib/authz";
import type { Id } from "./_generated/dataModel";

const MAX_PDF_BYTES = 10 * 1024 * 1024;
const PDF_MIME = "application/pdf";
const VIEW_TTL_SECONDS = Number(process.env.VIEW_JWT_TTL_SECONDS ?? 5 * 60);

function getViewSecret(): string {
  const secret = process.env.VIEW_JWT_SECRET;
  if (!secret) {
    throw new Error("VIEW_JWT_SECRET not configured");
  }
  return secret;
}

function assertPdf(contentType: string) {
  if (contentType !== PDF_MIME) {
    throw new Error("ONLY_PDF_ALLOWED");
  }
}

function assertSize(size: number) {
  if (size <= 0) throw new Error("INVALID_FILE");
  if (size > MAX_PDF_BYTES) throw new Error("FILE_TOO_LARGE");
}

const textEncoder = new TextEncoder();

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256HexOfString(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", textEncoder.encode(value));
  return toHex(new Uint8Array(digest));
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

type ViewTokenPayload = {
  docId: string;
  sub: string;
  orgId: string;
  roles: string[];
  exp: number;
};

async function signViewToken(payload: ViewTokenPayload): Promise<string> {
  const encodedPayload = encodeURIComponent(JSON.stringify(payload));
  const signature = await sha256HexOfString(`${encodedPayload}.${getViewSecret()}`);
  return `${encodedPayload}.${signature}`;
}

async function verifyViewToken(token: string): Promise<ViewTokenPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 2) {
    return null;
  }
  const [encodedPayload, signature] = parts;
  const expectedSignature = await sha256HexOfString(`${encodedPayload}.${getViewSecret()}`);
  if (!constantTimeEqual(signature, expectedSignature)) {
    return null;
  }
  let decoded: string;
  try {
    decoded = decodeURIComponent(encodedPayload);
  } catch {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(decoded) as ViewTokenPayload;
  } catch {
    return null;
  }
  if (
    !parsed ||
    typeof parsed !== "object" ||
    typeof (parsed as ViewTokenPayload).docId !== "string" ||
    typeof (parsed as ViewTokenPayload).sub !== "string" ||
    typeof (parsed as ViewTokenPayload).orgId !== "string" ||
    !Array.isArray((parsed as ViewTokenPayload).roles) ||
    typeof (parsed as ViewTokenPayload).exp !== "number"
  ) {
    return null;
  }
  const payload = parsed as ViewTokenPayload;
  if (!payload.roles.every((role) => typeof role === "string")) {
    return null;
  }
  if (payload.exp < Date.now()) {
    return null;
  }
  return payload;
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

    const token = await signViewToken({
      docId: docId as unknown as string,
      sub: actor.userId,
      orgId: actor.orgId,
      roles: actor.roles,
      exp: Date.now() + VIEW_TTL_SECONDS * 1000,
    });

    return { token, expiresIn: VIEW_TTL_SECONDS };
  },
});

export const view = httpAction(async (ctx: any, request) => {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return new Response("Missing token", { status: 400 });
  }

  const payload = await verifyViewToken(token);
  if (!payload) {
    return new Response("Invalid or expired token", { status: 401 });
  }

  const docId = payload.docId as unknown as Id<"documents">;
  const doc = await ctx.db.get(docId);
  if (!doc) {
    return new Response("Document not found", { status: 404 });
  }

  const actor: Actor = {
    userId: payload.sub,
    orgId: payload.orgId,
    roles: payload.roles,
  };
  if (!canReadDoc(actor, doc)) {
    return new Response("FORBIDDEN", { status: 403 });
  }

  const data = await ctx.storage.get(doc.storageId);
  if (!data) {
    return new Response("File missing", { status: 404 });
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

  return new Response(data, {
    status: 200,
    headers: {
      "Content-Type": doc.contentType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(doc.title)}.pdf"`,
      "Cache-Control": "no-store, private, max-age=0",
      "Content-Length": String(data.byteLength),
    },
  });
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
