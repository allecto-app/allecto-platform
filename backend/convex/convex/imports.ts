import { mutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { normalizeEmail } from "./_secu";
import type { Id } from "./_generated/dataModel";

const residentRoles = ["resident", "syndic", "manager", "council"] as const;
const membershipRoles = ["owner", "tenant"] as const;

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
          ? await upsertResident(ctx, condoId, row.resident, timestamp, summary)
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
