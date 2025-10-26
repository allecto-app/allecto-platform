// convex/minutes.ts
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const MinuteStatus = v.union(v.literal("open"), v.literal("closed"));

export const publish = mutation({
    args: {
        sessionToken: v.optional(v.string()),
        condoId: v.id("condos"),
        title: v.string(),
        summary: v.optional(v.string()),
        documentId: v.id("documents"),
        closesAt: v.number(),
        createdBy: v.id("residents"),
    },
    handler: async (ctx, a) => {
        const now = Date.now();
        if (a.closesAt <= now) throw new Error("closesAt must be future");

        const document = await ctx.db.get(a.documentId);
        if (!document) {
            throw new Error("Document not found");
        }

        const condoIdString = a.condoId.toString();
        if (document.orgId !== condoIdString) {
            throw new Error("DOCUMENT_ORG_MISMATCH");
        }

        const minuteId = await ctx.db.insert("minutes", {
            condoId: a.condoId,
            title: a.title,
            summary: a.summary,
            pdfUrl: undefined,
            documentId: a.documentId,
            publishedAt: now,
            closesAt: a.closesAt,
            status: "open",
            createdBy: a.createdBy,
            reminderD2Scheduled: false,
            reminderD4Scheduled: false,
            closeScheduled: false,
            createdAt: now,
            updatedAt: now,
        });

        const d2 = now + 2 * 24 * 3600 * 1000;
        const d4 = now + 4 * 24 * 3600 * 1000;

        await ctx.scheduler.runAt(d2, internal.notifications.sendReminder, {
            minuteId,
            template: "reminderD2",
        });
        await ctx.scheduler.runAt(d4, internal.notifications.sendReminder, {
            minuteId,
            template: "reminderD4",
        });
        await ctx.scheduler.runAt(a.closesAt, internal.minutes.internalClose, { minuteId });

        await ctx.db.patch(minuteId, {
            reminderD2Scheduled: true,
            reminderD4Scheduled: true,
            closeScheduled: true,
        });

        // Log convocação (integração real de push/SMS depois)
        await ctx.db.insert("notificationLogs", {
            condoId: a.condoId,
            minuteId,
            channel: "push",
            template: "convocation",
            audienceCount: 0,
            successCount: 0,
            errorCount: 0,
            createdAt: now,
            meta: { note: "TODO integrate provider" },
        });

        return minuteId;
    },
});

export const list = query({
    args: { condoId: v.id("condos"), status: v.optional(MinuteStatus), limit: v.optional(v.number()) },
    handler: async (ctx, a) => {
        let items = await ctx.db
            .query("minutes")
            .withIndex("byCondo", (q) => q.eq("condoId", a.condoId))
            .take(1000);
        if (a.status) items = items.filter((m) => m.status === a.status);
        items.sort((x, y) => y.publishedAt - x.publishedAt);
        return a.limit ? items.slice(0, a.limit) : items;
    },
});

export const get = query({
    args: { minuteId: v.id("minutes") },
    handler: async (ctx, { minuteId }) => {
        const m = await ctx.db.get(minuteId);
        if (!m) throw new Error("Minute not found");
        return m;
    },
});

export const close = mutation({
    args: { minuteId: v.id("minutes") },
    handler: async (ctx, { minuteId }) => {
        const m = await ctx.db.get(minuteId);
        if (!m) throw new Error("Minute not found");
        if (m.status === "closed") return true;
        await ctx.db.patch(minuteId, { status: "closed", updatedAt: Date.now() });
        return true;
    },
});

export const internalClose = internalMutation({
    args: { minuteId: v.id("minutes") },
    handler: async (ctx, { minuteId }) => {
        const m = await ctx.db.get(minuteId);
        if (!m || m.status === "closed") return;
        await ctx.db.patch(minuteId, { status: "closed", updatedAt: Date.now() });
        await ctx.db.insert("notificationLogs", {
            condoId: m.condoId,
            minuteId,
            channel: "push",
            template: "closed",
            audienceCount: 0,
            successCount: 0,
            errorCount: 0,
            createdAt: Date.now(),
            meta: { note: "TODO integrate provider" },
        });
    },
});
