import { mutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { normalizeEmail } from "./_secu";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

const residentRoles = ["resident", "syndic", "manager", "council"] as const;
const membershipRoles = ["owner", "tenant"] as const;
const RESIDENT_WELCOME_TEMPLATE_ID = process.env.RESEND_TEMPLATE_RESIDENT_WELCOME ?? "";
const RESIDENT_WELCOME_SYNDIC_TEMPLATE_ID =
  process.env.RESEND_TEMPLATE_RESIDENT_WELCOME_SYNDIC ?? "";

type CondoEmailContext = {
  name: string;
  subdomain: string;
};

interface Summary {
  unitsCreated: number;
  unitsUpdated: number;
  residentsCreated: number;
  residentsUpdated: number;
  membershipsCreated: number;
  skippedRows: number;
}

export const bulkUpload = mutation({
  args: {
    condoId: v.id("condos"),
    rows: v.array(
      v.object({
        rowNumber: v.number(),
        unit: v.optional(
          v.object({
            code: v.string(),
            block: v.optional(v.string()),
            floor: v.optional(v.string()),
          }),
        ),
        resident: v.optional(
          v.object({
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
            membershipRole: v.optional(v.union(v.literal("owner"), v.literal("tenant"))),
          }),
        ),
      }),
    ),
  },
  handler: async (ctx, { condoId, rows }) => {
    const condo = await ctx.db.get(condoId);
    if (!condo) {
      throw new Error("Condomínio não encontrado");
    }
    const condoEmailContext: CondoEmailContext = {
      name: condo.name,
      subdomain: condo.subdomain,
    };

    const summary: Summary = {
      unitsCreated: 0,
      unitsUpdated: 0,
      residentsCreated: 0,
      residentsUpdated: 0,
      membershipsCreated: 0,
      skippedRows: 0,
    };
    const errors: { rowNumber: number; message: string }[] = [];

    for (const row of rows) {
      const timestamp = Date.now();
      try {
        if (!row.unit && !row.resident) {
          summary.skippedRows += 1;
          continue;
        }

        const unitId = row.unit
          ? await upsertUnit(ctx, condoId, row.unit, timestamp, summary)
          : null;
        const residentId = row.resident
          ? await upsertResident(
              ctx,
              condoId,
              row.resident,
              timestamp,
              summary,
              condoEmailContext,
            )
          : null;

        if (row.resident?.membershipRole && !unitId) {
          throw new Error(
            "Não foi possível encontrar ou criar a unidade para vincular o morador.",
          );
        }
        if (unitId && residentId) {
          await upsertMembership(
            ctx,
            residentId,
            unitId,
            row.resident?.membershipRole,
            summary,
            timestamp,
          );
        }
      } catch (error) {
        errors.push({
          rowNumber: row.rowNumber,
          message: error instanceof Error ? error.message : "Erro desconhecido ao importar a linha.",
        });
      }
    }

    return { summary, errors };
  },
});

async function upsertUnit(
  ctx: MutationCtx,
  condoId: Id<"condos">,
  unit: { code: string; block?: string; floor?: string },
  timestamp: number,
  summary: Summary,
) {
  const trimmedCode = unit.code.trim();
  if (!trimmedCode) {
    throw new Error("Código da unidade é obrigatório.");
  }

  const block = unit.block?.trim() || undefined;
  const floor = unit.floor?.trim() || undefined;

  const existing = await ctx.db
    .query("units")
    .withIndex("byCondoCode", (q) => q.eq("condoId", condoId).eq("code", trimmedCode))
    .unique();

  if (existing) {
    await ctx.db.patch(existing._id, {
      block,
      floor,
      updatedAt: timestamp,
    });
    summary.unitsUpdated += 1;
    return existing._id;
  }

  const newId = await ctx.db.insert("units", {
    condoId,
    code: trimmedCode,
    block,
    floor,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  summary.unitsCreated += 1;
  return newId;
}

async function upsertResident(
  ctx: MutationCtx,
  condoId: Id<"condos">,
  resident: {
    name: string;
    email?: string;
    phone?: string;
    role?: (typeof residentRoles)[number];
    membershipRole?: (typeof membershipRoles)[number];
  },
  timestamp: number,
  summary: Summary,
  condo: CondoEmailContext,
) {
  const trimmedName = resident.name.trim();
  if (!trimmedName) {
    throw new Error("Nome do morador é obrigatório.");
  }

  const trimmedPhone = resident.phone?.trim();
  const trimmedEmail = resident.email?.trim();
  const normalizedEmail = trimmedEmail ? normalizeEmail(trimmedEmail) : undefined;
  const role = resident.role ?? "resident";

  if (!residentRoles.includes(role as (typeof residentRoles)[number])) {
    throw new Error(
      "Função inválida para o morador. Use resident, syndic, manager ou council.",
    );
  }

  if (normalizedEmail) {
    const existing = await ctx.db
      .query("residents")
      .withIndex("byCondoEmail", (q) => q.eq("condoId", condoId).eq("email", normalizedEmail))
      .unique();

    if (existing) {
      const patch: Partial<typeof existing> & { updatedAt?: number } = {};
      if (existing.name !== trimmedName) {
        patch.name = trimmedName;
      }
      if (trimmedPhone && existing.phone !== trimmedPhone) {
        patch.phone = trimmedPhone;
      }
      if (existing.role !== role) {
        patch.role = role;
      }
      if (Object.keys(patch).length > 0) {
        patch.updatedAt = timestamp;
        await ctx.db.patch(existing._id, patch);
        summary.residentsUpdated += 1;
      }
      return existing._id;
    }
  }

  const newId = await ctx.db.insert("residents", {
    condoId,
    name: trimmedName,
    email: normalizedEmail,
    phone: trimmedPhone && trimmedPhone.length > 0 ? trimmedPhone : undefined,
    role,
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  summary.residentsCreated += 1;

  if (normalizedEmail) {
    const displayName = trimmedName || "Morador";
    const firstName = displayName.split(" ")[0] ?? displayName;
    const condoDisplay = condo.name || "seu condomínio";
    const condoUrl = condo.subdomain
      ? `https://${condo.subdomain}.allecto.app`
      : "https://portal.allecto.app";

    const subject =
      role === "syndic"
        ? "Você foi cadastrado como síndico no Allecto"
        : `Bem-vindo ao Allecto - ${condoDisplay}`;

    const templateId =
      role === "syndic"
        ? RESIDENT_WELCOME_SYNDIC_TEMPLATE_ID || RESIDENT_WELCOME_TEMPLATE_ID
        : RESIDENT_WELCOME_TEMPLATE_ID;

    const roleLabel =
      role === "syndic"
        ? "síndico"
        : role === "manager"
          ? "gestor"
          : role === "council"
            ? "conselheiro"
            : "morador";

    const roleMessage =
      role === "syndic"
        ? "Você poderá acessar o painel administrativo do condomínio para gerir reuniões, votações e comunicados."
        : role === "manager"
          ? "Você poderá apoiar a gestão condominial e acompanhar as rotinas administrativas no Allecto."
          : role === "council"
            ? "Você poderá acompanhar assembleias, votações e comunicados como membro do conselho."
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
      "",
      `Você foi cadastrado no ${condoDisplay} na plataforma Allecto.`,
      roleMessage,
      "",
      `Acesse pelo link ${condoUrl} usando o email ${normalizedEmail} para receber seu código de acesso.`,
      "",
      "Qualquer dúvida, fale com o síndico ou nossa equipe de suporte.",
      "",
      "Equipe Allecto",
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

  return newId;
}

async function upsertMembership(
  ctx: MutationCtx,
  residentId: Id<"residents">,
  unitId: Id<"units">,
  membershipRole: (typeof membershipRoles)[number] | undefined,
  summary: Summary,
  timestamp: number = Date.now(),
) {
  const role = membershipRole ?? "owner";
  if (!membershipRoles.includes(role)) {
    throw new Error("Função inválida para o vínculo. Utilize owner ou tenant.");
  }

  const existingMemberships = await ctx.db
    .query("memberships")
    .withIndex("byResident", (q) => q.eq("residentId", residentId))
    .collect();
  const existing = existingMemberships.find((membership) => membership.unitId === unitId);

  if (existing) {
    if (existing.role !== role) {
      await ctx.db.patch(existing._id, { role });
    }
    return existing._id;
  }

  summary.membershipsCreated += 1;
  return await ctx.db.insert("memberships", {
    residentId,
    unitId,
    role,
    createdAt: timestamp,
  });
}
