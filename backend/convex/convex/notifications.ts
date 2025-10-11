// convex/notifications.ts
import { internalMutation } from "./_generated/server";
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
