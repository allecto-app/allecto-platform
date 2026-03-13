import type { Id } from "../_generated/dataModel";

type AnonymizeOptions = {
  forceDeactivate?: boolean;
};

type AnonymizeResult = {
  ok: boolean;
  alreadyDeleted: boolean;
  residentId: Id<"residents">;
  condoId: Id<"condos">;
  counts: {
    membershipsDeleted: number;
    votesRedacted: number;
    sessionsRevoked: number;
    invitesDeleted: number;
    otpsByEmailDeleted: number;
    otpsByPhoneDeleted: number;
  };
};

export async function anonymizeResidentById(
  ctx: any,
  residentId: Id<"residents">,
  options: AnonymizeOptions = {},
): Promise<AnonymizeResult> {
  const resident = await ctx.db.get(residentId);
  if (!resident) {
    throw new Error("Resident not found");
  }

  if (resident.deletedAt !== undefined) {
    return {
      ok: true,
      alreadyDeleted: true,
      residentId: resident._id,
      condoId: resident.condoId,
      counts: {
        membershipsDeleted: 0,
        votesRedacted: 0,
        sessionsRevoked: 0,
        invitesDeleted: 0,
        otpsByEmailDeleted: 0,
        otpsByPhoneDeleted: 0,
      },
    };
  }

  if (resident.isActive && !options.forceDeactivate) {
    throw new Error("Apenas moradores inativos podem ser excluídos");
  }

  const now = Date.now();
  if (resident.isActive && options.forceDeactivate) {
    await ctx.db.patch(residentId, {
      isActive: false,
      updatedAt: now,
    });
  }

  const memberships = await ctx.db
    .query("memberships")
    .withIndex("byResident", (q: any) => q.eq("residentId", residentId))
    .collect();
  for (const membership of memberships) {
    await ctx.db.delete(membership._id);
  }

  const votes = await ctx.db
    .query("votes")
    .withIndex("byResidentMinute", (q: any) => q.eq("residentId", residentId))
    .collect();
  for (const vote of votes) {
    await ctx.db.patch(vote._id, { comment: undefined });
  }

  const sessions = await ctx.db
    .query("sessions")
    .withIndex("byResident", (q: any) => q.eq("residentId", residentId))
    .collect();
  for (const session of sessions) {
    await ctx.db.patch(session._id, {
      residentId: undefined,
      revokedAt: now,
      ip: undefined,
      userAgent: undefined,
    });
  }

  let invitesDeleted = 0;
  let otpsByEmailDeleted = 0;
  let otpsByPhoneDeleted = 0;

  if (resident.email) {
    const invites = await ctx.db
      .query("invites")
      .withIndex("byCondoEmail", (q: any) =>
        q.eq("condoId", resident.condoId).eq("email", resident.email!),
      )
      .collect();
    for (const invite of invites) {
      await ctx.db.delete(invite._id);
      invitesDeleted += 1;
    }

    const otpsByEmail = await ctx.db
      .query("otps")
      .withIndex("byCondoEmail", (q: any) =>
        q.eq("condoId", resident.condoId).eq("email", resident.email!),
      )
      .collect();
    for (const otp of otpsByEmail) {
      await ctx.db.delete(otp._id);
      otpsByEmailDeleted += 1;
    }
  }

  if (resident.phone) {
    const otpsByPhone = await ctx.db
      .query("otps")
      .withIndex("byCondoPhone", (q: any) =>
        q.eq("condoId", resident.condoId).eq("phone", resident.phone!),
      )
      .collect();
    for (const otp of otpsByPhone) {
      await ctx.db.delete(otp._id);
      otpsByPhoneDeleted += 1;
    }
  }

  await ctx.db.patch(residentId, {
    name: "Morador removido",
    email: undefined,
    phone: undefined,
    isActive: false,
    deletedAt: now,
    anonymizedAt: now,
    updatedAt: now,
  });

  return {
    ok: true,
    alreadyDeleted: false,
    residentId: resident._id,
    condoId: resident.condoId,
    counts: {
      membershipsDeleted: memberships.length,
      votesRedacted: votes.length,
      sessionsRevoked: sessions.length,
      invitesDeleted,
      otpsByEmailDeleted,
      otpsByPhoneDeleted,
    },
  };
}
