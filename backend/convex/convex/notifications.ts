// convex/notifications.ts
import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";

export const sendReminder = internalMutation({
    args: { minuteId: v.id("minutes"), template: v.union(v.literal("reminderD2"), v.literal("reminderD4")) },
    handler: async (ctx, { minuteId, template }) => {
        const minute = await ctx.db.get(minuteId);
        if (!minute || minute.status !== "open") return;

        // TODO: compute audience = residents who haven't voted yet
        await ctx.db.insert("notificationLogs", {
            condoId: minute.condoId,
            minuteId,
            channel: "push",
            template,
            audienceCount: 0,
            successCount: 0,
            errorCount: 0,
            createdAt: Date.now(),
            meta: { note: "TODO: integrate provider" },
        });
    },
});

export const listLogs = query({
    args: {
        condoId: v.optional(v.id("condos")),
        template: v.optional(v.string()),
        channel: v.optional(v.string()),
        dateFrom: v.optional(v.number()),
        dateTo: v.optional(v.number()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, { condoId, template, channel, dateFrom, dateTo, limit }) => {
        const take = Math.min(limit ?? 200, 500);

        let logs;
        if (condoId) {
            logs = await ctx.db
                .query("notificationLogs")
                .withIndex("byCondo", (q) => q.eq("condoId", condoId))
                .take(take);
        } else {
            logs = await ctx.db.query("notificationLogs").take(take);
        }

        logs.sort((a, b) => b.createdAt - a.createdAt);

        const condoIds = Array.from(new Set(logs.map((log) => log.condoId)));
        const condoDocs = await Promise.all(condoIds.map((id) => ctx.db.get(id)));
        const condoMap = new Map(condoDocs.filter(Boolean).map((condo) => [condo!._id, condo!]));

        return logs
            .filter((log) => {
                if (template && log.template !== template) return false;
                if (channel && log.channel !== channel) return false;
                if (dateFrom && log.createdAt < dateFrom) return false;
                if (dateTo && log.createdAt > dateTo) return false;
                return true;
            })
            .map((log) => {
                const condo = condoMap.get(log.condoId);
                return {
                    _id: log._id,
                    createdAt: log.createdAt,
                    condoId: log.condoId,
                    condoName: condo?.name ?? null,
                    condoSubdomain: condo?.subdomain ?? null,
                    template: log.template,
                    channel: log.channel,
                    audienceCount: log.audienceCount,
                    successCount: log.successCount,
                    errorCount: log.errorCount,
                    note: typeof log.meta?.note === "string" ? log.meta.note : null,
                    minuteId: log.minuteId ?? null,
                };
            });
    },
});
