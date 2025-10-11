// convex/auth.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const requestOtp = mutation({
    args: { condoId: v.id("condos"), email: v.optional(v.string()), phone: v.optional(v.string()) },
    handler: async (ctx, a) => {
        if (!a.email && !a.phone) throw new Error("Provide email or phone");
        const now = Date.now();
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
        // TODO send via provider
        return { ok: true, devCode: code };
    },
});

export const verifyOtp = mutation({
    args: {
        condoId: v.id("condos"),
        email: v.optional(v.string()),
        phone: v.optional(v.string()),
        code: v.string(),
    },
    handler: async (ctx, a) => {
        const now = Date.now();
        const otp = a.email
            ? await ctx.db
                .query("otps")
                .withIndex("byCondoEmail", (q) => q.eq("condoId", a.condoId).eq("email", a.email))
                .order("desc")
                .first()
            : await ctx.db
                .query("otps")
                .withIndex("byCondoPhone", (q) => q.eq("condoId", a.condoId).eq("phone", a.phone))
                .order("desc")
                .first();

        if (!otp || otp.code !== a.code) throw new Error("Invalid code");
        if (otp.expiresAt < now) throw new Error("Code expired");
        await ctx.db.patch(otp._id, { consumedAt: now });

        // Issue session/JWT in your edge/app layer as you prefer
        return { ok: true };
    },
});
