// convex/residents.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const invite = mutation({
    args: {
        condoId: v.id("condos"),
        name: v.string(),
        email: v.optional(v.string()),
        phone: v.optional(v.string()),
        role: v.optional(v.string()),
    },
    handler: async (ctx, a) => {
        const now = Date.now();
        if (!a.email && !a.phone) throw new Error("Provide email or phone");

        let resident =
            a.email
                ? await ctx.db
                    .query("residents")
                    .withIndex("byCondoEmail", (q) => q.eq("condoId", a.condoId).eq("email", a.email))
                    .unique()
                : null;

        const residentId =
            resident?._id ??
            (await ctx.db.insert("residents", {
                condoId: a.condoId,
                name: a.name,
                email: a.email,
                phone: a.phone,
                role: a.role ?? "resident",
                isActive: true,
                createdAt: now,
                updatedAt: now,
            }));

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = now + 15 * 60 * 1000;
        await ctx.db.insert("otps", {
            condoId: a.condoId,
            email: a.email,
            phone: a.phone,
            code,
            expiresAt,
            createdAt: now,
        });

        // TODO send email/SMS
        return { residentId, devCode: code };
    },
});

export const list = query({
    args: { condoId: v.id("condos"), limit: v.optional(v.number()) },
    handler: async (ctx, { condoId, limit }) => {
        return await ctx.db
            .query("residents")
            .withIndex("byCondo", (q) => q.eq("condoId", condoId))
            .take(limit ?? 200);
    },
});
