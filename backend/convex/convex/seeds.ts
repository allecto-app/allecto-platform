// convex/seeds.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Seed: cria um condomínio demo, algumas unidades, moradores e uma ata aberta.
 * Uso:
 *   npx convex run seeds:demo
 */
export const demo = mutation({
    args: {
        subdomain: v.optional(v.string()), // ex: "allecto-demo"
        unitsCount: v.optional(v.number()), // ex: 10
    },
    handler: async (ctx, { subdomain = "allecto-demo", unitsCount = 10 }) => {
        const now = Date.now();

        // 1) Create condo
        const condoId = await ctx.db.insert("condos", {
            name: "Condomínio Demo",
            subdomain,
            branding: { displayName: "Condomínio Demo", primaryColor: "#0b5fff" },
            createdAt: now,
            updatedAt: now,
        });

        // 2) Units
        const unitIds: string[] = [];
        for (let i = 1; i <= unitsCount; i++) {
            const unitId = await ctx.db.insert("units", {
                condoId,
                code: `Bloco A - ${100 + i}`,
                createdAt: now,
                updatedAt: now,
            });
            unitIds.push(unitId);
        }

        // 3) Residents (2)
        const r1 = await ctx.db.insert("residents", {
            condoId,
            name: "Síndico Demo",
            email: "sindico@demo.com",
            role: "syndic",
            isActive: true,
            createdAt: now,
            updatedAt: now,
        });
        const r2 = await ctx.db.insert("residents", {
            condoId,
            name: "Morador Demo",
            email: "morador@demo.com",
            role: "resident",
            isActive: true,
            createdAt: now,
            updatedAt: now,
        });

        // 4) Membership (morador na primeira unidade)
        await ctx.db.insert("memberships", {
            residentId: r2,
            unitId: unitIds[0],
            role: "owner",
            createdAt: now,
        });

        // 5) Minute (open for 5 days)
        const closesAt = now + 5 * 24 * 3600 * 1000;
        const minuteId = await ctx.db.insert("minutes", {
            condoId,
            title: "Assembleia Ordinária - Demo",
            summary: "Pauta de exemplo para demonstração.",
            pdfUrl: "https://example.com/ata.pdf",
            publishedAt: now,
            closesAt,
            status: "open",
            createdBy: r1,
            reminderD2Scheduled: false,
            reminderD4Scheduled: false,
            closeScheduled: false,
            createdAt: now,
            updatedAt: now,
        });

        return { condoId, minuteId, unitIds, residents: { r1, r2 } };
    },
});

/**
 * Remove dados criados pelo seed demo.
 * Uso:
 *   npx convex run seeds:deleteDemo
 */
export const deleteDemo = mutation({
    args: {
        subdomain: v.optional(v.string()),
    },
    handler: async (ctx, { subdomain = "allecto-demo" }) => {
        const condo = await ctx.db
            .query("condos")
            .withIndex("bySubdomain", (q) => q.eq("subdomain", subdomain))
            .first();
        if (!condo) {
            return { removed: false, reason: "condo_not_found", subdomain };
        }

        const condoId = condo._id;
        const totals = {
            condos: 0,
            residents: 0,
            units: 0,
            memberships: 0,
            minutes: 0,
            votes: 0,
            notificationLogs: 0,
        };

        const minutes = await ctx.db
            .query("minutes")
            .withIndex("byCondo", (q) => q.eq("condoId", condoId))
            .collect();
        for (const minute of minutes) {
            const votes = await ctx.db
                .query("votes")
                .withIndex("byMinute", (q) => q.eq("minuteId", minute._id))
                .collect();
            for (const vote of votes) {
                await ctx.db.delete(vote._id);
                totals.votes += 1;
            }
            await ctx.db.delete(minute._id);
            totals.minutes += 1;
        }

        const logs = await ctx.db
            .query("notificationLogs")
            .withIndex("byCondo", (q) => q.eq("condoId", condoId))
            .collect();
        for (const log of logs) {
            await ctx.db.delete(log._id);
            totals.notificationLogs += 1;
        }

        const units = await ctx.db
            .query("units")
            .withIndex("byCondo", (q) => q.eq("condoId", condoId))
            .collect();
        for (const unit of units) {
            const unitMemberships = await ctx.db
                .query("memberships")
                .withIndex("byUnit", (q) => q.eq("unitId", unit._id))
                .collect();
            for (const membership of unitMemberships) {
                await ctx.db.delete(membership._id);
                totals.memberships += 1;
            }
            await ctx.db.delete(unit._id);
            totals.units += 1;
        }

        const residents = await ctx.db
            .query("residents")
            .withIndex("byCondo", (q) => q.eq("condoId", condoId))
            .collect();
        for (const resident of residents) {
            await ctx.db.delete(resident._id);
            totals.residents += 1;
        }

        await ctx.db.delete(condoId);
        totals.condos = 1;

        return { removed: true, condoId, subdomain, totals };
    },
});
