// convex/residents.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { normalizeEmail } from "./_secu";
import { internal } from "./_generated/api";
import { anonymizeResidentById } from "./lib/residentPrivacy";

type ResidentRole = "resident" | "syndic" | "manager" | "council";
const RESIDENT_WELCOME_TEMPLATE_ID = process.env.RESEND_TEMPLATE_RESIDENT_WELCOME ?? "";
const RESIDENT_WELCOME_SYNDIC_TEMPLATE_ID =
    process.env.RESEND_TEMPLATE_RESIDENT_WELCOME_SYNDIC ?? "";

export const create = mutation({
    args: {
        condoId: v.id("condos"),
        name: v.string(),
        email: v.optional(v.string()),
        phone: v.optional(v.string()),
        role: v.optional(
            v.union(
                v.literal("resident"),
                v.literal("syndic"),
                v.literal("manager"),
                v.literal("council"),
            ),
        ),
        unitLink: v.optional(
            v.object({
                unitId: v.id("units"),
                membershipRole: v.union(v.literal("owner"), v.literal("tenant")),
            }),
        ),
    },
    handler: async (ctx, { condoId, name, email, phone, role, unitLink }) => {
        const trimmedName = name.trim();
        if (!trimmedName) {
            throw new Error("Name is required");
        }

        const trimmedEmail = email?.trim();
        const normalizedEmail = trimmedEmail ? normalizeEmail(trimmedEmail) : undefined;
        if (normalizedEmail) {
            const existing = await ctx.db
                .query("residents")
                .withIndex("byCondoEmail", (q) => q.eq("condoId", condoId).eq("email", normalizedEmail))
                .unique();
            if (existing) {
                throw new Error("Resident already exists for this email");
            }
        }

        const trimmedPhone = phone?.trim();
        const effectiveRole: ResidentRole = (role as ResidentRole | undefined) ?? "resident";
        const now = Date.now();

        const residentId = await ctx.db.insert("residents", {
            condoId,
            name: trimmedName,
            email: normalizedEmail,
            phone: trimmedPhone && trimmedPhone.length > 0 ? trimmedPhone : undefined,
            role: effectiveRole,
            isActive: true,
            createdAt: now,
            updatedAt: now,
        });

        if (unitLink) {
            const unit = await ctx.db.get(unitLink.unitId);
            if (!unit || unit.condoId !== condoId) {
                throw new Error("Unit not found for condo");
            }

            await ctx.db.insert("memberships", {
                residentId,
                unitId: unitLink.unitId,
                role: unitLink.membershipRole,
                createdAt: now,
            });
        }

        const condo = await ctx.db.get(condoId);

        if (normalizedEmail && condo) {
            const displayName = trimmedName || "Morador";
            const firstName = displayName.split(" ")[0] ?? displayName;
            const condoDisplay = condo.name ?? "seu condomínio";
            const condoUrl = condo.subdomain
                ? `https://${condo.subdomain}.allecto.app`
                : "https://portal.allecto.app";

            const subject =
                effectiveRole === "syndic"
                    ? `Você foi cadastrado como síndico no Allecto`
                    : `Bem-vindo ao Allecto - ${condoDisplay}`;
            const roleLabel = effectiveRole === "syndic" ? "síndico" : "morador";
            const templateId =
                effectiveRole === "syndic"
                    ? RESIDENT_WELCOME_SYNDIC_TEMPLATE_ID || RESIDENT_WELCOME_TEMPLATE_ID
                    : RESIDENT_WELCOME_TEMPLATE_ID;

            const roleMessage =
                effectiveRole === "syndic"
                    ? "Você poderá acessar o painel administrativo do condomínio para gerir reuniões, votações e comunicados."
                    : "Você poderá acompanhar assembleias, votações e comunicados do seu condomínio.";

            const html = `
              <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
                <p>Olá ${firstName},</p>
                <p>Você foi cadastrado no <strong>${condoDisplay}</strong> na plataforma Allecto.</p>
                <p>${roleMessage}</p>
                <p>Acesse pelo link abaixo usando o email <strong>${normalizedEmail}</strong> para receber seu código de acesso:</p>
                <p><a href="${condoUrl}" style="color: #2563eb;">${condoUrl}</a></p>
                <p>Qualquer dúvida, fale com o síndico ou nossa equipe de suporte.</p>
                <p>Equipe Allecto</p>
              </div>
            `.trim();

            const text = [
                `Olá ${firstName},`,
                ``,
                `Você foi cadastrado no ${condoDisplay} na plataforma Allecto.`,
                roleMessage,
                ``,
                `Acesse pelo link ${condoUrl} usando o email ${normalizedEmail} para receber seu código de acesso.`,
                ``,
                `Qualquer dúvida, fale com o síndico ou nossa equipe de suporte.`,
                ``,
                `Equipe Allecto`,
            ].join("\n");

            await ctx.scheduler.runAfter(
                0,
                internal.email.send,
                templateId
                    ? {
                        to: normalizedEmail,
                        subject,
                        template: {
                            id: templateId,
                            variables: {
                                USER_NAME: firstName,
                                FULL_NAME: displayName,
                                CONDO_NAME: condoDisplay,
                                CONDO_URL: condoUrl,
                                USER_EMAIL: normalizedEmail,
                                ROLE_LABEL: roleLabel,
                                ROLE_MESSAGE: roleMessage,
                            },
                        },
                    }
                    : {
                        to: normalizedEmail,
                        subject,
                        html,
                        text,
                    },
            );
        }

        return {
            resident: {
                id: residentId,
                name: trimmedName,
                email: normalizedEmail ?? null,
                phone: trimmedPhone?.length ? trimmedPhone : null,
                role: effectiveRole,
                isActive: true,
                condoId,
                condoName: condo?.name ?? null,
                condoSubdomain: condo?.subdomain ?? null,
                createdAt: now,
                updatedAt: now,
            },
        };
    },
});

export const list = query({
    args: { condoId: v.id("condos"), limit: v.optional(v.number()) },
    handler: async (ctx, { condoId, limit }) => {
        const residents = await ctx.db
            .query("residents")
            .withIndex("byCondo", (q) => q.eq("condoId", condoId))
            .take(limit ?? 200);
        return residents.filter((resident) => resident.deletedAt === undefined);
    },
});

export const findByEmail = query({
    args: { email: v.string() },
    handler: async (ctx, { email }) => {
        const normalized = normalizeEmail(email);
        const resident = await ctx.db
            .query("residents")
            .withIndex("byEmail", (q) => q.eq("email", normalized))
            .first();

        if (!resident || resident.deletedAt !== undefined) return null;

        const condo = await ctx.db.get(resident.condoId);

        return {
            _id: resident._id,
            name: resident.name,
            email: resident.email ?? null,
            phone: resident.phone ?? null,
            role: resident.role,
            isActive: resident.isActive,
            condoId: resident.condoId,
            condoName: condo?.name ?? null,
            condoSubdomain: condo?.subdomain ?? null,
        };
    },
});

export const update = mutation({
    args: {
        residentId: v.id("residents"),
        name: v.string(),
        email: v.optional(v.string()),
        phone: v.optional(v.string()),
        role: v.string(),
        isActive: v.boolean(),
    },
    handler: async (ctx, { residentId, name, email, phone, role, isActive }) => {
        const existing = await ctx.db.get(residentId);
        if (!existing) {
            throw new Error("Resident not found");
        }
        if (existing.deletedAt !== undefined) {
            throw new Error("Resident was deleted");
        }

        const now = Date.now();
        await ctx.db.patch(residentId, {
            name: name.trim(),
            email:
                email !== undefined
                    ? email.trim().length > 0
                        ? normalizeEmail(email)
                        : undefined
                    : existing.email,
            phone:
                phone !== undefined
                    ? phone.trim().length > 0
                        ? phone.trim()
                        : undefined
                    : existing.phone,
            role,
            isActive,
            updatedAt: now,
        });

        const updated = await ctx.db.get(residentId);
        const condo = updated ? await ctx.db.get(updated.condoId) : null;

        return {
            resident: updated
                ? {
                      id: updated._id,
                      name: updated.name,
                      email: updated.email ?? null,
                      phone: updated.phone ?? null,
                      role: updated.role,
                      isActive: updated.isActive,
                      condoId: updated.condoId,
                      condoName: condo?.name ?? null,
                      condoSubdomain: condo?.subdomain ?? null,
                      createdAt: updated.createdAt,
                      updatedAt: updated.updatedAt,
                  }
                : null,
        };
    },
});

export const remove = mutation({
    args: {
        residentId: v.id("residents"),
    },
    handler: async (ctx, { residentId }) => {
        const resident = await ctx.db.get(residentId);
        if (!resident) return false;
        const result = await anonymizeResidentById(ctx, residentId);
        return result.ok;
    },
});
