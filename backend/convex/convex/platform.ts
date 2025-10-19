// convex/platform.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requirePlatformRole } from "./guards";

const DEFAULT_BRANDING = {
    primaryColor: "#042940",
    secondaryColor: "#9FC131",
    accentColor: "#005C53",
};

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

async function hydrateCondo(ctx: any, condo: any) {
    return {
        ...condo,
        branding: await hydrateBranding(ctx, condo.branding),
    };
}

export const listCondos = query({
    args: {
        sessionToken: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, a) => {
        await requirePlatformRole(ctx, ["super_admin", "ops", "support"], a.sessionToken);
        const condos = await ctx.db.query("condos").take(a.limit ?? 200);
        return await Promise.all(condos.map((condo) => hydrateCondo(ctx, condo)));
    },
});

export const createCondo = mutation({
    args: {
        sessionToken: v.string(),
        name: v.string(),
        subdomain: v.string(),
        branding: v.object({
            displayName: v.optional(v.string()),
            primaryColor: v.optional(v.string()),
            secondaryColor: v.optional(v.string()),
            accentColor: v.optional(v.string()),
            logoStorageId: v.optional(v.string()),
        }),
        syndicEmail: v.string(),
        syndicName: v.string(),
    },
    handler: async (ctx, a) => {
        await requirePlatformRole(ctx, ["super_admin", "ops"], a.sessionToken);
        const now = Date.now();
        const branding = { ...DEFAULT_BRANDING, ...a.branding } as Record<string, any>;
        if (a.branding.logoStorageId) {
            const url = await ctx.storage.getUrl(a.branding.logoStorageId);
            branding.logoUrl = url ?? undefined;
        }
        const condoId = await ctx.db.insert("condos", {
            name: a.name,
            subdomain: a.subdomain,
            branding,
            timezone: "America/Sao_Paulo",
            isActive: true,
            disabledAt: undefined,
            createdAt: now,
            updatedAt: now,
        });
        const syndicId = await ctx.db.insert("residents", {
            condoId, name: a.syndicName, email: a.syndicEmail,
            role: "syndic", isActive: true, createdAt: now, updatedAt: now,
        });
        return { condoId, syndicId };
    },
});
