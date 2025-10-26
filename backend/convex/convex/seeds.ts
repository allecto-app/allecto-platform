// convex/seeds.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

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

        // Ensure a demo platform administrator exists
        const adminEmail = "admin@demo.com";
        const existingAdmin = await ctx.db
            .query("platformUsers")
            .withIndex("byEmail", (q) => q.eq("email", adminEmail))
            .unique();
        const adminPasswordHash = "$2a$12$qjKYX6vr4cpOv.z/7fg16OsiGTK68oxPj1I9dj/EhoPkVxuX2KNn."; // password: Admin@123
        if (!existingAdmin) {
            await ctx.db.insert("platformUsers", {
                email: adminEmail,
                name: "Demo Admin",
                roles: ["super_admin"],
                createdAt: now,
                passwordHash: adminPasswordHash,
            });
        } else {
            await ctx.db.patch(existingAdmin._id, {
                passwordHash: adminPasswordHash,
            });
        }

        const attempts = await ctx.db
            .query("loginAttempts")
            .withIndex("byEmailIp", (q) => q.eq("email", adminEmail).eq("ip", "unknown"))
            .collect();
        for (const attempt of attempts) {
            await ctx.db.delete(attempt._id);
        }

        // 1) Create condo

        // Ensure a demo platform supporter exists
        const supportEmail = "support@demo.com";
        const supportPasswordHash = "$2a$12$DleDgMTzc.OhBK2/y2kWFOYozimPcq1m55JmlvnCBgKRe17lf4JvO"; // password: Support@123
        const existingSupport = await ctx.db
            .query("platformUsers")
            .withIndex("byEmail", (q) => q.eq("email", supportEmail))
            .unique();
        if (!existingSupport) {
            await ctx.db.insert("platformUsers", {
                email: supportEmail,
                name: "Support Demo",
                roles: ["support"],
                createdAt: now,
                passwordHash: supportPasswordHash,
            });
        } else {
            await ctx.db.patch(existingSupport._id, {
                passwordHash: supportPasswordHash,
            });
        }

        const supportAttempts = await ctx.db
            .query("loginAttempts")
            .withIndex("byEmailIp", (q) => q.eq("email", supportEmail).eq("ip", "unknown"))
            .collect();
        for (const attempt of supportAttempts) {
            await ctx.db.delete(attempt._id);
        }
        const condoId = await ctx.db.insert("condos", {
            name: "Condomínio Demo",
            subdomain,
            branding: {
                displayName: "Condomínio Demo",
                primaryColor: "#0b5fff",
                secondaryColor: "#9FC131",
                accentColor: "#005C53",
            },
            timezone: "America/Sao_Paulo",
            isActive: true,
            disabledAt: undefined,
            createdAt: now,
            updatedAt: now,
        });

        // 2) Units
        const unitIds: Id<"units">[] = [];
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
        const documentId = await ctx.db.insert("documents", {
            title: "Assembleia Ordinária - Demo",
            orgId: condoId.toString(),
            assemblyId: undefined,
            storageId: "seed-storage-id",
            contentType: "application/pdf",
            size: 0,
            sha256: "0".repeat(64),
            visibility: "org",
            allowedRoles: ["admin", "syndic", "resident"],
            allowedUserIds: [],
            createdByUserId: r1.toString(),
            createdAt: now,
            lastViewedAt: undefined,
            viewCount: 0,
        });
        await ctx.db.insert("documentEvents", {
            documentId,
            orgId: condoId.toString(),
            userId: r1.toString(),
            event: "upload",
            createdAt: now,
        });

        const minuteId = await ctx.db.insert("minutes", {
            condoId,
            title: "Assembleia Ordinária - Demo",
            summary: "Pauta de exemplo para demonstração.",
            pdfUrl: undefined,
            documentId,
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
            documents: 0,
            documentEvents: 0,
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

        const condoIdString = condoId.toString();
        const documents = await ctx.db
            .query("documents")
            .withIndex("by_org", (q) => q.eq("orgId", condoIdString))
            .collect();
        for (const document of documents) {
            const events = await ctx.db
                .query("documentEvents")
                .withIndex("by_document", (q) => q.eq("documentId", document._id))
                .collect();
            for (const event of events) {
                await ctx.db.delete(event._id);
                totals.documentEvents += 1;
            }
            await ctx.db.delete(document._id);
            totals.documents += 1;
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
