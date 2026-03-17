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
