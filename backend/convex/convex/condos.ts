// convex/condos.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireCondoRole, requirePlatformRole } from "./guards";

const DEFAULT_BRANDING = {
    primaryColor: "#042940",
    secondaryColor: "#9FC131",
    accentColor: "#005C53",
};

const BrandingInput = v.object({
    displayName: v.optional(v.string()),
    primaryColor: v.optional(v.string()),
    secondaryColor: v.optional(v.string()),
    accentColor: v.optional(v.string()),
    logoStorageId: v.optional(v.union(v.string(), v.null())),
});

const CondoBranding = v.object({
    logoUrl: v.optional(v.string()),
    logoStorageId: v.optional(v.string()),
    primaryColor: v.optional(v.string()),
    secondaryColor: v.optional(v.string()),
    accentColor: v.optional(v.string()),
    displayName: v.optional(v.string()),
});

type BrandingInputData = {
    displayName?: string;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    logoStorageId?: string | null;
};

function mergeBranding(existing: Record<string, any> | null | undefined, input: BrandingInputData) {
    const next = { ...DEFAULT_BRANDING, ...(existing ?? {}) } as Record<string, any>;
    if (input.displayName !== undefined) {
        next.displayName = input.displayName || undefined;
    }
    if (input.primaryColor !== undefined) {
        next.primaryColor = input.primaryColor;
    }
    if (input.secondaryColor !== undefined) {
        next.secondaryColor = input.secondaryColor;
    }
    if (input.accentColor !== undefined) {
        next.accentColor = input.accentColor;
    }
    if (input.logoStorageId !== undefined) {
        if (input.logoStorageId === null) {
            delete next.logoStorageId;
            delete next.logoUrl;
        } else {
            next.logoStorageId = input.logoStorageId;
        }
    }
    return next;
}

async function hydrateBranding(ctx: any, branding: Record<string, any> | null | undefined) {
    if (!branding) {
        return { ...DEFAULT_BRANDING };
    }
    const next = { ...DEFAULT_BRANDING, ...branding } as Record<string, any>;
    if (branding.logoStorageId) {
        try {
            const url = await ctx.storage.getUrl(branding.logoStorageId);
            if (url) {
                next.logoUrl = url;
            }
        } catch (error) {
            console.error("Failed to resolve condo logo", error);
        }
    }
    return next;
}

async function hydrateCondo(ctx: any, condo: any | null) {
    if (!condo) return null;
    const branding = await hydrateBranding(ctx, condo.branding);
    return { ...condo, branding };
}

async function requireCondoReadAccess(ctx: any, sessionToken: string | undefined, condoId: any) {
    if (!sessionToken) return;
    try {
        await requirePlatformRole(ctx, ["super_admin", "ops", "support"], sessionToken);
        return;
    } catch {}
    await requireCondoRole(ctx, condoId, ["syndic", "manager", "council"], sessionToken);
}

async function requireCondoWriteAccess(ctx: any, sessionToken: string | undefined, condoId: any) {
    if (!sessionToken) return;
    try {
        await requirePlatformRole(ctx, ["super_admin", "ops", "support"], sessionToken);
        return;
    } catch {}
    await requireCondoRole(ctx, condoId, ["syndic", "manager"], sessionToken);
}

export const create = mutation({
    args: {
        sessionToken: v.optional(v.string()),
        name: v.string(),
        subdomain: v.string(),
        branding: v.optional(BrandingInput),
        timezone: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        if (args.sessionToken) {
            await requirePlatformRole(ctx, ["super_admin", "ops"], args.sessionToken);
        }
        const now = Date.now();
        const dup = await ctx.db
            .query("condos")
            .withIndex("bySubdomain", (q) => q.eq("subdomain", args.subdomain))
            .unique();
        if (dup) throw new Error("Subdomain already in use");

        const branding = mergeBranding(DEFAULT_BRANDING, args.branding ?? {});
        if (branding.logoStorageId) {
            const url = await ctx.storage.getUrl(branding.logoStorageId);
            branding.logoUrl = url ?? undefined;
        }

        return await ctx.db.insert("condos", {
            name: args.name,
            subdomain: args.subdomain,
            branding,
            timezone: args.timezone ?? "America/Sao_Paulo",
            isActive: true,
            disabledAt: undefined,
            createdAt: now,
            updatedAt: now,
        });
    },
});

export const getBySubdomain = query({
    args: { subdomain: v.optional(v.string()) },
    handler: async (ctx, { subdomain }) => {
        if (!subdomain) return null;
        const condo = await ctx.db
            .query("condos")
            .withIndex("bySubdomain", (q) => q.eq("subdomain", subdomain))
            .unique();
        return hydrateCondo(ctx, condo);
    },
});

export const getAdmin = query({
    args: { sessionToken: v.optional(v.string()), condoId: v.id("condos") },
    handler: async (ctx, { sessionToken, condoId }) => {
        await requireCondoReadAccess(ctx, sessionToken, condoId);
        const condo = await ctx.db.get(condoId);
        return hydrateCondo(ctx, condo);
    },
});

export const generateLogoUploadUrl = mutation({
    args: { sessionToken: v.optional(v.string()), condoId: v.optional(v.id("condos")) },
    handler: async (ctx, { sessionToken, condoId }) => {
        if (condoId) {
            await requireCondoWriteAccess(ctx, sessionToken, condoId);
        } else if (sessionToken) {
            await requirePlatformRole(ctx, ["super_admin", "ops"], sessionToken);
        }
        const uploadUrl = await ctx.storage.generateUploadUrl();
        return { uploadUrl };
    },
});

export const updateBranding = mutation({
    args: { sessionToken: v.optional(v.string()), condoId: v.id("condos"), branding: BrandingInput },
    handler: async (ctx, { sessionToken, condoId, branding }) => {
        await requireCondoWriteAccess(ctx, sessionToken, condoId);
        const condo = await ctx.db.get(condoId);
        if (!condo) throw new Error("Condo not found");

        const merged = mergeBranding(condo.branding, branding);
        if (branding.logoStorageId !== undefined && branding.logoStorageId !== null) {
            const url = await ctx.storage.getUrl(branding.logoStorageId);
            merged.logoUrl = url ?? undefined;
        }

        await ctx.db.patch(condoId, {
            branding: merged,
            updatedAt: Date.now(),
        });

        const updated = await ctx.db.get(condoId);
        return hydrateCondo(ctx, updated);
    },
});

export const updateSettings = mutation({
    args: {
        sessionToken: v.optional(v.string()),
        condoId: v.id("condos"),
        name: v.string(),
        timezone: v.string(),
    },
    handler: async (ctx, { sessionToken, condoId, name, timezone }) => {
        await requireCondoWriteAccess(ctx, sessionToken, condoId);
        const condo = await ctx.db.get(condoId);
        if (!condo) throw new Error("Condo not found");
        await ctx.db.patch(condoId, {
            name,
            timezone,
            updatedAt: Date.now(),
        });
        const updated = await ctx.db.get(condoId);
        return hydrateCondo(ctx, updated);
    },
});

export const disable = mutation({
    args: { sessionToken: v.optional(v.string()), condoId: v.id("condos") },
    handler: async (ctx, { sessionToken, condoId }) => {
        await requireCondoWriteAccess(ctx, sessionToken, condoId);
        const condo = await ctx.db.get(condoId);
        if (!condo) throw new Error("Condo not found");
        if (condo.isActive === false) {
            return { success: false, reason: "already_disabled", condo: await hydrateCondo(ctx, condo) };
        }
        await ctx.db.patch(condoId, {
            isActive: false,
            disabledAt: Date.now(),
            updatedAt: Date.now(),
        });
        const updated = await ctx.db.get(condoId);
        return { success: true, condo: await hydrateCondo(ctx, updated) };
    },
});

export const deleteHard = mutation({
    args: { sessionToken: v.optional(v.string()), condoId: v.id("condos") },
    handler: async (ctx, { sessionToken, condoId }) => {
        if (!sessionToken) throw new Error("Unauthorized");
        await requirePlatformRole(ctx, ["super_admin"], sessionToken);

        const condo = await ctx.db.get(condoId);
        if (!condo) throw new Error("Condo not found");
        if (condo.isActive !== false) {
            throw new Error("Condo must be disabled before deletion");
        }

        const summary = {
            membershipsDeleted: 0,
            votesDeleted: 0,
            minuteFinalReportsDeleted: 0,
            minutesDeleted: 0,
            residentCommunicationReceiptsDeleted: 0,
            residentCommunicationsDeleted: 0,
            notificationLogsDeleted: 0,
            notificationReadsDeleted: 0,
            sessionsDeleted: 0,
            residentsDeleted: 0,
            unitsDeleted: 0,
            invitesDeleted: 0,
            otpsDeleted: 0,
            externalApiTokensDeleted: 0,
            externalApiKeysDeleted: 0,
            documentsDeleted: 0,
            documentEventsDeleted: 0,
            subscriptionsDeleted: 0,
            stripeCustomersDeleted: 0,
            onboardingSessionsDeleted: 0,
            usagesDeleted: 0,
            dsarRequestEventsDeleted: 0,
            dsarRequestsDeleted: 0,
            adminAuditEventsDeleted: 0,
            dataRetentionPoliciesDeleted: 0,
        };

        const condoIdText = String(condoId);

        const membershipsToDelete = new Set<string>();

        const units = await ctx.db
            .query("units")
            .withIndex("byCondo", (q) => q.eq("condoId", condoId))
            .collect();
        for (const unit of units) {
            const memberships = await ctx.db
                .query("memberships")
                .withIndex("byUnit", (q) => q.eq("unitId", unit._id))
                .collect();
            memberships.forEach((membership) => membershipsToDelete.add(String(membership._id)));
        }

        const residents = await ctx.db
            .query("residents")
            .withIndex("byCondo", (q) => q.eq("condoId", condoId))
            .collect();
        for (const resident of residents) {
            const memberships = await ctx.db
                .query("memberships")
                .withIndex("byResident", (q) => q.eq("residentId", resident._id))
                .collect();
            memberships.forEach((membership) => membershipsToDelete.add(String(membership._id)));

            const sessions = await ctx.db
                .query("sessions")
                .withIndex("byResident", (q) => q.eq("residentId", resident._id))
                .collect();
            for (const session of sessions) {
                await ctx.db.delete(session._id);
                summary.sessionsDeleted += 1;
            }

            const reads = await ctx.db
                .query("notificationReads")
                .withIndex("byUser", (q) => q.eq("userId", String(resident._id)))
                .collect();
            for (const read of reads) {
                if (read.condoId === condoId) {
                    await ctx.db.delete(read._id);
                    summary.notificationReadsDeleted += 1;
                }
            }

            const residentDsar = await ctx.db
                .query("dsarRequests")
                .withIndex("byResidentId", (q) => q.eq("residentId", resident._id))
                .collect();
            for (const request of residentDsar) {
                const events = await ctx.db
                    .query("dsarRequestEvents")
                    .withIndex("byRequest", (q) => q.eq("requestId", request._id))
                    .collect();
                for (const event of events) {
                    await ctx.db.delete(event._id);
                    summary.dsarRequestEventsDeleted += 1;
                }
                await ctx.db.delete(request._id);
                summary.dsarRequestsDeleted += 1;
            }
        }

        for (const membershipId of membershipsToDelete) {
            await ctx.db.delete(membershipId as any);
            summary.membershipsDeleted += 1;
        }

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
                summary.votesDeleted += 1;
            }
        }

        const reports = await ctx.db
            .query("minuteFinalReports")
            .withIndex("byCondo", (q) => q.eq("condoId", condoId))
            .collect();
        for (const report of reports) {
            await ctx.db.delete(report._id);
            summary.minuteFinalReportsDeleted += 1;
        }

        for (const minute of minutes) {
            await ctx.db.delete(minute._id);
            summary.minutesDeleted += 1;
        }

        const communications = await ctx.db
            .query("residentCommunications")
            .withIndex("byCondo", (q) => q.eq("condoId", condoId))
            .collect();
        for (const communication of communications) {
            const receipts = await ctx.db
                .query("residentCommunicationReceipts")
                .withIndex("byCommunication", (q) => q.eq("communicationId", communication._id))
                .collect();
            for (const receipt of receipts) {
                await ctx.db.delete(receipt._id);
                summary.residentCommunicationReceiptsDeleted += 1;
            }
            await ctx.db.delete(communication._id);
            summary.residentCommunicationsDeleted += 1;
        }

        const notificationLogs = await ctx.db
            .query("notificationLogs")
            .withIndex("byCondo", (q) => q.eq("condoId", condoId))
            .collect();
        for (const log of notificationLogs) {
            await ctx.db.delete(log._id);
            summary.notificationLogsDeleted += 1;
        }

        const invites = await ctx.db
            .query("invites")
            .withIndex("byCondoEmail", (q) => q.eq("condoId", condoId))
            .collect();
        for (const invite of invites) {
            await ctx.db.delete(invite._id);
            summary.invitesDeleted += 1;
        }

        const allOtps = await ctx.db.query("otps").collect();
        for (const otp of allOtps) {
            if (otp.condoId !== condoId) continue;
            await ctx.db.delete(otp._id);
            summary.otpsDeleted += 1;
        }

        const keys = await ctx.db
            .query("externalApiKeys")
            .withIndex("byCondo", (q) => q.eq("condoId", condoId))
            .collect();
        for (const key of keys) {
            const tokens = await ctx.db
                .query("externalApiTokens")
                .withIndex("byKey", (q) => q.eq("keyId", key._id))
                .collect();
            for (const token of tokens) {
                await ctx.db.delete(token._id);
                summary.externalApiTokensDeleted += 1;
            }
            await ctx.db.delete(key._id);
            summary.externalApiKeysDeleted += 1;
        }

        const documents = await ctx.db
            .query("documents")
            .withIndex("by_org", (q) => q.eq("orgId", condoIdText))
            .collect();
        for (const document of documents) {
            const events = await ctx.db
                .query("documentEvents")
                .withIndex("by_document", (q) => q.eq("documentId", document._id))
                .collect();
            for (const event of events) {
                await ctx.db.delete(event._id);
                summary.documentEventsDeleted += 1;
            }
            await ctx.db.delete(document._id);
            summary.documentsDeleted += 1;
        }

        const subscriptions = await ctx.db
            .query("subscriptions")
            .withIndex("byTenant", (q) => q.eq("tenantId", condoId))
            .collect();
        for (const subscription of subscriptions) {
            await ctx.db.delete(subscription._id);
            summary.subscriptionsDeleted += 1;
        }

        const customers = await ctx.db
            .query("stripeCustomers")
            .withIndex("byTenant", (q) => q.eq("tenantId", condoId))
            .collect();
        for (const customer of customers) {
            await ctx.db.delete(customer._id);
            summary.stripeCustomersDeleted += 1;
        }

        const onboardingSessions = await ctx.db
            .query("onboardingSessions")
            .withIndex("byTenant", (q) => q.eq("tenantId", condoId))
            .collect();
        for (const session of onboardingSessions) {
            await ctx.db.delete(session._id);
            summary.onboardingSessionsDeleted += 1;
        }

        const usages = await ctx.db
            .query("usages")
            .withIndex("byTenantTypeBucket", (q) => q.eq("tenantId", condoId).eq("type", "assembly"))
            .collect();
        for (const usage of usages) {
            await ctx.db.delete(usage._id);
            summary.usagesDeleted += 1;
        }

        const dsarRequests = await ctx.db
            .query("dsarRequests")
            .withIndex("byCondo", (q) => q.eq("condoId", condoId))
            .collect();
        for (const request of dsarRequests) {
            const events = await ctx.db
                .query("dsarRequestEvents")
                .withIndex("byRequest", (q) => q.eq("requestId", request._id))
                .collect();
            for (const event of events) {
                await ctx.db.delete(event._id);
                summary.dsarRequestEventsDeleted += 1;
            }
            await ctx.db.delete(request._id);
            summary.dsarRequestsDeleted += 1;
        }

        const adminAuditEvents = await ctx.db
            .query("adminAuditEvents")
            .withIndex("byCondoCreatedAt", (q) => q.eq("condoId", condoId))
            .collect();
        for (const event of adminAuditEvents) {
            await ctx.db.delete(event._id);
            summary.adminAuditEventsDeleted += 1;
        }

        const allRetentionPolicies = await ctx.db.query("dataRetentionPolicies").collect();
        for (const policy of allRetentionPolicies) {
            if (policy.condoId !== condoId) continue;
            await ctx.db.delete(policy._id);
            summary.dataRetentionPoliciesDeleted += 1;
        }

        for (const resident of residents) {
            await ctx.db.delete(resident._id);
            summary.residentsDeleted += 1;
        }

        for (const unit of units) {
            await ctx.db.delete(unit._id);
            summary.unitsDeleted += 1;
        }

        await ctx.db.delete(condoId);

        return {
            success: true,
            condoId,
            summary,
        };
    },
});

export const list = query({
    args: { sessionToken: v.optional(v.string()), limit: v.optional(v.number()) },
    handler: async (ctx, { sessionToken, limit }) => {
        if (sessionToken) {
            await requirePlatformRole(ctx, ["super_admin", "ops", "support"], sessionToken);
        }
        const condos = await ctx.db.query("condos").take(limit ?? 500);
        return await Promise.all(condos.map((condo) => hydrateCondo(ctx, condo)));
    },
});
