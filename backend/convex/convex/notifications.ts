import { internalAction, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { v } from "convex/values";
import { normalizeEmail } from "./_secu";
import type { Id } from "./_generated/dataModel";

type RecipientUnit = {
  id: Id<"units">;
  code: string;
  block: string | null;
};

type Recipient = {
  residentId: Id<"residents">;
  email: string;
  name: string;
  units: RecipientUnit[];
};

type MinuteContext = {
  minute: {
    _id: Id<"minutes">;
    condoId: Id<"condos">;
    title: string;
    summary?: string;
    status: "open" | "closed";
    closesAt: number;
    publishedAt: number;
  };
  condo: {
    _id: Id<"condos">;
    name: string;
    subdomain?: string;
  } | null;
};

type ResidentCommunicationContext = {
  communication: {
    _id: Id<"residentCommunications">;
    condoId: Id<"condos">;
    title: string;
    message?: string;
    documentId?: Id<"documents">;
    audienceType: "all" | "role" | "block";
    targetRole?: string;
    targetBlock?: string;
    publishedAt: number;
    status: "published" | "archived";
  };
  condo: {
    _id: Id<"condos">;
    name: string;
    subdomain?: string;
  } | null;
};

const DATE_TIME_FORMAT = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});
const RESIDENT_COMMUNICATION_TEMPLATE_ID =
  process.env.RESEND_TMPL_COMMUNICATION ??
  "send-comunicado";

function formatDateTime(timestamp: number): string {
  return DATE_TIME_FORMAT.format(new Date(timestamp));
}

function firstName(name: string | null | undefined): string {
  if (!name) return "Olá";
  const [first] = name.trim().split(/\s+/);
  return first || "Olá";
}

function buildMinuteLink(condo: MinuteContext["condo"], minuteId: Id<"minutes">): string {
  if (condo?.subdomain) {
    return `https://${condo.subdomain}.allecto.app`;
  }
  return "https://portal.allecto.app";
}

function buildResidentCommunicationLink(
  condo: ResidentCommunicationContext["condo"],
  communicationId: Id<"residentCommunications">,
): string {
  if (condo?.subdomain) {
    return `https://${condo.subdomain}.allecto.app`;
  }
  return "https://portal.allecto.app";
}

async function loadMinuteContext(ctx: any, minuteId: Id<"minutes">): Promise<MinuteContext | null> {
  try {
    const minute = await ctx.runQuery(api.minutes.get, { minuteId });
    const condo =
      minute?.condoId !== undefined
        ? await ctx.runQuery(api.condos.getAdmin, { condoId: minute.condoId })
        : null;
    if (!minute) return null;
    return {
      minute: {
        _id: minute._id,
        condoId: minute.condoId,
        title: minute.title,
        summary: minute.summary ?? undefined,
        status: minute.status as "open" | "closed",
        closesAt: minute.closesAt,
        publishedAt: minute.publishedAt,
      },
      condo: condo
        ? {
            _id: condo._id,
            name: condo.name ?? "Condomínio",
            subdomain: condo.subdomain ?? undefined,
          }
        : null,
    };
  } catch (error) {
    console.error("[notifications] Failed to load minute", error);
    return null;
  }
}

async function loadResidentCommunicationContext(
  ctx: any,
  communicationId: Id<"residentCommunications">,
): Promise<ResidentCommunicationContext | null> {
  return (await ctx.runQuery(internal.notifications.loadResidentCommunicationContextQuery, {
    communicationId,
  })) as ResidentCommunicationContext | null;
}

export const loadResidentCommunicationContextQuery = internalQuery({
  args: { communicationId: v.id("residentCommunications") },
  handler: async (ctx, { communicationId }) => {
    const communication = await ctx.db.get(communicationId);
    if (!communication) return null;
    const condo = await ctx.db.get(communication.condoId);
    return {
      communication: {
        _id: communication._id,
        condoId: communication.condoId,
        title: communication.title,
        message: communication.message ?? undefined,
        documentId: communication.documentId ?? undefined,
        audienceType: (communication.audienceType ?? "all") as "all" | "role" | "block",
        targetRole: communication.targetRole ?? undefined,
        targetBlock: communication.targetBlock ?? undefined,
        publishedAt: communication.publishedAt,
        status: communication.status as "published" | "archived",
      },
      condo: condo
        ? {
            _id: condo._id,
            name: condo.name ?? "Condomínio",
            subdomain: condo.subdomain ?? undefined,
          }
        : null,
    } satisfies ResidentCommunicationContext;
  },
});

async function collectOwnerRecipients(ctx: any, condoId: Id<"condos">): Promise<Recipient[]> {
  const units = ((await ctx.runQuery(api.units.listByCondo, { condoId })) ?? []) as Array<{
    _id: Id<"units">;
    code: string;
    block?: string | null;
  }>;

  const recipientMap = new Map<string, Recipient>();

  const unitDetails = await Promise.all(
    units.map((unit) => ctx.runQuery(api.units.detail, { unitId: unit._id })),
  );

  for (let i = 0; i < units.length; i += 1) {
    const unit = units[i];
    const detail = unitDetails[i];
    if (!detail) continue;

    const memberships = detail.memberships ?? [];
    for (const membership of memberships) {
      if (membership?.membershipRole && membership.membershipRole !== "owner") continue;
      const resident = membership?.resident;
      if (!resident || resident.isActive === false || !resident.email) continue;

      const normalized = normalizeEmail(resident.email);
      const existing = recipientMap.get(normalized);
      const unitEntry: RecipientUnit = {
        id: unit._id,
        code: unit.code,
        block: unit.block ?? null,
      };

      if (existing) {
        existing.units.push(unitEntry);
      } else {
        recipientMap.set(normalized, {
          residentId: resident.id,
          email: resident.email,
          name: resident.name ?? "Morador(a)",
          units: [unitEntry],
        });
      }
    }
  }

  return Array.from(recipientMap.values());
}

async function collectCommunicationRecipients(
  ctx: any,
  context: ResidentCommunicationContext,
): Promise<Array<{ residentId: Id<"residents">; name: string; email: string }>> {
  const residents = (await ctx.runQuery(api.residents.list, {
    condoId: context.communication.condoId,
    limit: 500,
  })) as Array<{
    _id: Id<"residents">;
    name: string;
    role: string;
    email?: string | null;
    isActive: boolean;
  }>;

  let filteredResidents = residents.filter(
    (resident) => resident.isActive !== false && resident.email,
  );

  if (context.communication.audienceType === "role" && context.communication.targetRole) {
    filteredResidents = filteredResidents.filter(
      (resident) => resident.role === context.communication.targetRole,
    );
  }

  if (context.communication.audienceType === "block" && context.communication.targetBlock) {
    const targetBlock = context.communication.targetBlock.trim().toLowerCase();
    const units = ((await ctx.runQuery(api.units.listByCondo, {
      condoId: context.communication.condoId,
    })) ?? []) as Array<{ _id: Id<"units">; block?: string | null }>;
    const targetUnits = units.filter((unit) => (unit.block ?? "").trim().toLowerCase() === targetBlock);

    const targetResidentIds = new Set<string>();
    const unitDetails = await Promise.all(
      targetUnits.map((unit) => ctx.runQuery(api.units.detail, { unitId: unit._id })),
    );
    unitDetails.forEach((detail) => {
      (detail?.memberships ?? []).forEach((membership: any) => {
        if (membership?.resident?.id) {
          targetResidentIds.add(String(membership.resident.id));
        }
      });
    });

    filteredResidents = filteredResidents.filter((resident) =>
      targetResidentIds.has(String(resident._id)),
    );
  }

  return filteredResidents
    .map((resident) => ({
      residentId: resident._id,
      name: resident.name ?? "Morador(a)",
      email: resident.email!,
    }));
}

async function collectPendingVoteRecipients(ctx: any, minuteId: Id<"minutes">): Promise<Recipient[]> {
  const context = await loadMinuteContext(ctx, minuteId);
  if (!context) return [];

  const votes = ((await ctx.runQuery(api.votes.listForMinute, { minuteId })) ?? []) as Array<{
    unitId: Id<"units">;
  }>;
  const votedUnitIds = new Set(votes.map((vote: any) => String(vote.unitId)));

  const recipients = await collectOwnerRecipients(ctx, context.minute.condoId);

  return recipients
    .map((recipient) => ({
      ...recipient,
      units: recipient.units.filter((unit) => !votedUnitIds.has(String(unit.id))),
    }))
    .filter((recipient) => recipient.units.length > 0);
}

async function sendEmails(
  ctx: any,
  recipients: Recipient[],
  build: (recipient: Recipient) => { subject: string; html: string; text: string } | null,
) {
  let successCount = 0;
  let errorCount = 0;

  for (const recipient of recipients) {
    const payload = build(recipient);
    if (!payload) continue;
    try {
      await ctx.runAction(internal.email.send, {
        to: recipient.email,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      });
      successCount += 1;
    } catch (error) {
      errorCount += 1;
      console.error("[notifications] Failed to send email", {
        email: recipient.email,
        error,
      });
    }
  }

  return { successCount, errorCount };
}

export const sendMinutePublishedEmail = internalAction({
  args: { minuteId: v.id("minutes") },
  handler: async (ctx, { minuteId }) => {
    const context = await loadMinuteContext(ctx, minuteId);
    if (!context) return;

    const recipients = await collectOwnerRecipients(ctx, context.minute.condoId);
    if (recipients.length === 0) {
      await ctx.runMutation(internal.notifications.recordNotificationLog, {
        condoId: context.minute.condoId,
        minuteId,
        template: "convocation",
        channel: "email",
        audienceCount: 0,
        successCount: 0,
        errorCount: 0,
        note: "Nenhum destinatário proprietário encontrado",
      });
      return;
    }

    const deadline = formatDateTime(context.minute.closesAt);
    const minuteLink = buildMinuteLink(context.condo, minuteId);

    const { successCount, errorCount } = await sendEmails(ctx, recipients, (recipient) => {
      const summary = context.minute.summary ? `<p>${context.minute.summary}</p>` : "";
      return {
        subject: `Nova assembleia: ${context.minute.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
            <p>Olá ${firstName(recipient.name)},</p>
            <p>Uma nova assembleia foi publicada para ${context.condo?.name ?? "seu condomínio"}.</p>
            ${summary}
            <p><strong>Prazo para votar:</strong> ${deadline}</p>
            <p>Acesse o portal do condomínio para ler a ata e registrar seu voto.</p>
            <p><a href="${minuteLink}" style="color: #2563eb;">${minuteLink}</a></p>
            <p>Obrigado,<br/>Equipe Allecto</p>
          </div>
        `.trim(),
        text: [
          `Olá ${firstName(recipient.name)},`,
          `Uma nova assembleia foi publicada para ${context.condo?.name ?? "seu condomínio"}.`,
          context.minute.summary ? context.minute.summary : "",
          `Prazo para votar: ${deadline}`,
          `Acesse o portal do condomínio: ${minuteLink}`,
          "",
          "Equipe Allecto",
        ]
          .filter(Boolean)
          .join("\n"),
      };
    });

    await ctx.runMutation(internal.notifications.recordNotificationLog, {
      condoId: context.minute.condoId,
      minuteId,
      template: "convocation",
      channel: "email",
      audienceCount: recipients.length,
      successCount,
      errorCount,
    });
  },
});

export const sendReminder = internalAction({
  args: { minuteId: v.id("minutes"), template: v.union(v.literal("reminderD2"), v.literal("reminderD4")) },
  handler: async (ctx, { minuteId, template }) => {
    const context = await loadMinuteContext(ctx, minuteId);
    if (!context) return;
    if (context.minute.status !== "open") return;

    const recipients = await collectPendingVoteRecipients(ctx, minuteId);
    if (recipients.length === 0) {
      await ctx.runMutation(internal.notifications.recordNotificationLog, {
        condoId: context.minute.condoId,
        minuteId,
        template,
        channel: "email",
        audienceCount: 0,
        successCount: 0,
        errorCount: 0,
        note: "Nenhum proprietário pendente de voto",
      });
      return;
    }

    const deadline = formatDateTime(context.minute.closesAt);
    const minuteLink = buildMinuteLink(context.condo, minuteId);

    const { successCount, errorCount } = await sendEmails(ctx, recipients, (recipient) => {
      const summary = context.minute.summary ? `<p>${context.minute.summary}</p>` : "";
      return {
        subject: `Lembrete: vote na assembleia ${context.minute.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
            <p>Olá ${firstName(recipient.name)},</p>
            <p>Ainda não registramos voto para todas as suas unidades na assembleia <strong>${context.minute.title}</strong>.</p>
            ${summary}
            <p><strong>Prazo para votar:</strong> ${deadline}</p>
            <p>Acesse o portal do condomínio para registrar seu voto:</p>
            <p><a href="${minuteLink}" style="color: #2563eb;">${minuteLink}</a></p>
            <p>Obrigado,<br/>Equipe Allecto</p>
          </div>
        `.trim(),
        text: [
          `Olá ${firstName(recipient.name)},`,
          `Ainda não registramos voto para todas as suas unidades na assembleia "${context.minute.title}".`,
          context.minute.summary ? context.minute.summary : "",
          `Prazo para votar: ${deadline}`,
          `Acesse o portal do condomínio: ${minuteLink}`,
          "",
          "Equipe Allecto",
        ]
          .filter(Boolean)
          .join("\n"),
      };
    });

    await ctx.runMutation(internal.notifications.recordNotificationLog, {
      condoId: context.minute.condoId,
      minuteId,
      template,
      channel: "email",
      audienceCount: recipients.length,
      successCount,
      errorCount,
    });
  },
});

export const sendMinuteClosedEmail = internalAction({
  args: { minuteId: v.id("minutes") },
  handler: async (ctx, { minuteId }) => {
    const context = await loadMinuteContext(ctx, minuteId);
    if (!context) return;
    if (context.minute.status !== "closed") return;

    const recipients = await collectOwnerRecipients(ctx, context.minute.condoId);
    if (recipients.length === 0) {
      await ctx.runMutation(internal.notifications.recordNotificationLog, {
        condoId: context.minute.condoId,
        minuteId,
        template: "closed",
        channel: "email",
        audienceCount: 0,
        successCount: 0,
        errorCount: 0,
        note: "Nenhum destinatário proprietário encontrado",
      });
      return;
    }

    const votes = ((await ctx.runQuery(api.votes.listForMinute, { minuteId })) ?? []) as Array<{
      unitId: Id<"units">;
      choice: "agree" | "disagree";
    }>;
    const totalVotes = votes.length;
    const agreeVotes = votes.filter((vote: any) => vote.choice === "agree").length;
    const disagreeVotes = totalVotes - agreeVotes;

    const votedUnitIds = new Set(votes.map((vote: any) => String(vote.unitId)));
    const allUnitIds = new Set<string>();
    recipients.forEach((recipient) => {
      recipient.units.forEach((unit) => {
        allUnitIds.add(String(unit.id));
      });
    });
    const participationPct =
      allUnitIds.size > 0 ? Math.round((votedUnitIds.size / allUnitIds.size) * 100) : 0;

    const minuteLink = buildMinuteLink(context.condo, minuteId);
    await ctx.runAction(internal.minutes.ensureFinalReportPdf, { minuteId });
    const finalReport = await ctx.runQuery(api.minutes.getFinalReport, { minuteId }) as
      | { reportStorageId?: string | null }
      | null;
    const reportUrl =
      finalReport?.reportStorageId ? await ctx.storage.getUrl(finalReport.reportStorageId) : null;

    const { successCount, errorCount } = await sendEmails(ctx, recipients, (recipient) => ({
      subject: `Resultado da assembleia ${context.minute.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <p>Olá ${firstName(recipient.name)},</p>
          <p>A assembleia <strong>${context.minute.title}</strong> foi encerrada.</p>
          <p><strong>Resultado:</strong></p>
          <ul>
            <li>Total de votos: ${totalVotes}</li>
            <li>Votos a favor: ${agreeVotes}</li>
            <li>Votos contra: ${disagreeVotes}</li>
            <li>Participação das unidades: ${participationPct}%</li>
          </ul>
          ${
            reportUrl
              ? `<p><strong>Relatório final (PDF):</strong> <a href="${reportUrl}" style="color: #2563eb;">Abrir PDF</a></p>`
              : ""
          }
          <p>Acesse o portal do condomínio para consultar a ata e detalhes completos:</p>
          <p><a href="${minuteLink}" style="color: #2563eb;">${minuteLink}</a></p>
          <p>Obrigado,<br/>Equipe Allecto</p>
        </div>
      `.trim(),
      text: [
        `Olá ${firstName(recipient.name)},`,
        `A assembleia "${context.minute.title}" foi encerrada.`,
        `Resultado:`,
        `- Total de votos: ${totalVotes}`,
        `- Votos a favor: ${agreeVotes}`,
        `- Votos contra: ${disagreeVotes}`,
        `- Participação das unidades: ${participationPct}%`,
        reportUrl ? `Relatório final (PDF): ${reportUrl}` : "",
        `Consulte detalhes no portal: ${minuteLink}`,
        "",
        "Equipe Allecto",
      ].join("\n"),
    }));

    await ctx.runMutation(internal.notifications.recordNotificationLog, {
      condoId: context.minute.condoId,
      minuteId,
      template: "closed",
      channel: "email",
      audienceCount: recipients.length,
      successCount,
      errorCount,
    });
  },
});

export const sendResidentCommunicationEmail = internalAction({
  args: {
    communicationId: v.id("residentCommunications"),
    isResend: v.optional(v.boolean()),
  },
  handler: async (ctx, { communicationId, isResend }) => {
    const context = await loadResidentCommunicationContext(ctx, communicationId);
    if (!context) return;
    if (context.communication.status !== "published") return;

    const recipients = await collectCommunicationRecipients(ctx, context);
    if (recipients.length === 0) {
      await ctx.runMutation(internal.notifications.recordNotificationLog, {
        condoId: context.communication.condoId,
        template: "communication",
        channel: "email",
        audienceCount: 0,
        successCount: 0,
        errorCount: 0,
        note: "Nenhum morador elegível com email para comunicado",
      });
      return;
    }

    const link = buildResidentCommunicationLink(context.condo, communicationId);
    const communicationDocumentUrl = context.communication.documentId
      ? await (async () => {
          const document = await ctx.db.get(context.communication.documentId!);
          if (!document?.storageId) return null;
          return await ctx.storage.getUrl(document.storageId);
        })()
      : null;
    let successCount = 0;
    let errorCount = 0;

    for (const recipient of recipients) {
      try {
        await ctx.runAction(internal.email.send, {
          to: recipient.email,
          subject: `Novo comunicado: ${context.communication.title}`,
          template: {
            id: RESIDENT_COMMUNICATION_TEMPLATE_ID,
            variables: {
              USER_NAME: firstName(recipient.name),
              CONDO_NAME: context.condo?.name ?? "seu condomínio",
              COMMUNICATION_TITLE: context.communication.title,
              COMMUNICATION_MESSAGE: context.communication.message ?? "",
              COMMUNICATION_URL: link,
              COMMUNICATION_DOCUMENT_URL: communicationDocumentUrl ?? "",
            },
          },
        });
        successCount += 1;
        await ctx.runMutation(internal.notifications.recordCommunicationReceipt, {
          communicationId,
          residentId: recipient.residentId,
          email: recipient.email,
          status: "sent",
        });
      } catch (error) {
        errorCount += 1;
        const message = error instanceof Error ? error.message : "Falha no envio";
        await ctx.runMutation(internal.notifications.recordCommunicationReceipt, {
          communicationId,
          residentId: recipient.residentId,
          email: recipient.email,
          status: "failed",
          errorMessage: message,
        });
        console.error("[notifications] Failed to send resident communication email", {
          communicationId,
          email: recipient.email,
          error,
        });
      }
    }

    await ctx.runMutation(internal.notifications.recordNotificationLog, {
      condoId: context.communication.condoId,
      template: "communication",
      channel: "email",
      audienceCount: recipients.length,
      successCount,
      errorCount,
      note: `Comunicado ${context.communication._id}${isResend ? " (reenvio)" : ""}`,
    });
  },
});

export const recordCommunicationReceipt = internalMutation({
  args: {
    communicationId: v.id("residentCommunications"),
    residentId: v.id("residents"),
    email: v.optional(v.string()),
    status: v.union(v.literal("sent"), v.literal("failed")),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, { communicationId, residentId, email, status, errorMessage }) => {
    const existing = await ctx.db
      .query("residentCommunicationReceipts")
      .withIndex("byCommunicationResident", (q: any) =>
        q.eq("communicationId", communicationId).eq("residentId", residentId),
      )
      .unique();
    const now = Date.now();

    if (!existing) {
      await ctx.db.insert("residentCommunicationReceipts", {
        communicationId,
        residentId,
        email,
        sentCount: status === "sent" ? 1 : 0,
        failedCount: status === "failed" ? 1 : 0,
        lastSentAt: status === "sent" ? now : undefined,
        lastFailedAt: status === "failed" ? now : undefined,
        lastError: status === "failed" ? errorMessage : undefined,
        openCount: 0,
        createdAt: now,
        updatedAt: now,
      });
      return;
    }

    await ctx.db.patch(existing._id, {
      email: email ?? existing.email,
      sentCount: existing.sentCount + (status === "sent" ? 1 : 0),
      failedCount: existing.failedCount + (status === "failed" ? 1 : 0),
      lastSentAt: status === "sent" ? now : existing.lastSentAt,
      lastFailedAt: status === "failed" ? now : existing.lastFailedAt,
      lastError: status === "failed" ? errorMessage : existing.lastError,
      updatedAt: now,
    });
  },
});

export const recordNotificationLog = internalMutation({
  args: {
    condoId: v.id("condos"),
    minuteId: v.optional(v.id("minutes")),
    template: v.string(),
    channel: v.string(),
    audienceCount: v.number(),
    successCount: v.number(),
    errorCount: v.number(),
    note: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const note = args.note ?? undefined;
    await ctx.db.insert("notificationLogs", {
      condoId: args.condoId,
      minuteId: args.minuteId,
      channel: args.channel,
      template: args.template,
      audienceCount: args.audienceCount,
      successCount: args.successCount,
      errorCount: args.errorCount,
      createdAt: Date.now(),
      meta: note ? { note } : undefined,
    });
  },
});

export const listLogs = query({
  args: {
    condoId: v.optional(v.id("condos")),
    template: v.optional(v.string()),
    channel: v.optional(v.string()),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { condoId, template, channel, dateFrom, dateTo, limit }) => {
    const take = Math.min(limit ?? 200, 500);

    let logs: any[];
    if (condoId) {
      logs = await ctx.db
        .query("notificationLogs")
        .withIndex("byCondo", (q: any) => q.eq("condoId", condoId))
        .take(take);
    } else {
      logs = await ctx.db.query("notificationLogs").take(take);
    }

    logs.sort((a: any, b: any) => b.createdAt - a.createdAt);

    const condoIds = Array.from(new Set(logs.map((log: any) => log.condoId)));
    const condoDocs = await Promise.all(condoIds.map((id) => ctx.db.get(id)));
    const condoMap = new Map(condoDocs.filter(Boolean).map((condo) => [condo!._id, condo!]));

    return logs
      .filter((log: any) => {
        if (template && log.template !== template) return false;
        if (channel && log.channel !== channel) return false;
        if (dateFrom && log.createdAt < dateFrom) return false;
        if (dateTo && log.createdAt > dateTo) return false;
        return true;
      })
      .map((log: any) => {
        const condo = condoMap.get(log.condoId) as { name?: string; subdomain?: string } | undefined;
        return {
          _id: log._id,
          createdAt: log.createdAt,
          condoId: log.condoId,
          condoName: condo?.name ?? null,
          condoSubdomain: condo?.subdomain ?? null,
          template: log.template,
          channel: log.channel,
          audienceCount: log.audienceCount,
          successCount: log.successCount,
          errorCount: log.errorCount,
          note: typeof log.meta?.note === "string" ? log.meta.note : null,
          minuteId: log.minuteId ?? null,
        };
      });
  },
});

function buildNotificationScopeKey(condoId?: Id<"condos">): string {
  return condoId ? String(condoId) : "all";
}

export const getReadState = query({
  args: {
    userId: v.string(),
    condoId: v.optional(v.id("condos")),
  },
  handler: async (ctx, { userId, condoId }) => {
    const scopeKey = buildNotificationScopeKey(condoId);
    const existing = await ctx.db
      .query("notificationReads")
      .withIndex("byUserScope", (q) => q.eq("userId", userId).eq("scopeKey", scopeKey))
      .first();

    return {
      lastReadAt: existing?.lastReadAt ?? 0,
      updatedAt: existing?.updatedAt ?? null,
    };
  },
});

export const markRead = mutation({
  args: {
    userId: v.string(),
    condoId: v.optional(v.id("condos")),
    lastReadAt: v.number(),
  },
  handler: async (ctx, { userId, condoId, lastReadAt }) => {
    const scopeKey = buildNotificationScopeKey(condoId);
    const existing = await ctx.db
      .query("notificationReads")
      .withIndex("byUserScope", (q) => q.eq("userId", userId).eq("scopeKey", scopeKey))
      .first();

    const safeLastReadAt = Number.isFinite(lastReadAt) && lastReadAt > 0 ? Math.floor(lastReadAt) : 0;
    const nextLastReadAt = Math.max(existing?.lastReadAt ?? 0, safeLastReadAt);
    const updatedAt = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        lastReadAt: nextLastReadAt,
        updatedAt,
      });
      return {
        ok: true,
        lastReadAt: nextLastReadAt,
      };
    }

    await ctx.db.insert("notificationReads", {
      userId,
      scopeKey,
      condoId,
      lastReadAt: nextLastReadAt,
      updatedAt,
    });
    return {
      ok: true,
      lastReadAt: nextLastReadAt,
    };
  },
});
