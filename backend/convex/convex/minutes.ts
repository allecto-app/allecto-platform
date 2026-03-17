// convex/minutes.ts
import { mutation, query, internalAction, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { v } from "convex/values";
import { ensureCanCreateAssembly, incrementAssemblyUsage } from "./usage/helpers";
import { recordAdminAuditEvent } from "./lib/adminAudit";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { loadSession, requireCondoRole, requirePlatformRole } from "./guards";

const MinuteStatus = v.union(v.literal("open"), v.literal("closed"));

async function requireMinuteWriteAccess(ctx: any, sessionToken: string | undefined, condoId: any) {
    if (!sessionToken) {
        throw new Error("Forbidden");
    }
    try {
        const { user } = await requirePlatformRole(ctx, ["super_admin", "ops", "support"], sessionToken);
        return { actorType: "platform" as const, actorId: String(user._id) };
    } catch {
        const { resident } = await requireCondoRole(ctx, condoId, ["syndic", "manager"], sessionToken);
        return { actorType: "resident" as const, actorId: String(resident._id) };
    }
}

async function requireMinuteReadAccess(ctx: any, sessionToken: string | undefined, condoId: any) {
    if (!sessionToken) {
        return;
    }
    try {
        await requirePlatformRole(ctx, ["super_admin", "ops", "support"], sessionToken);
        return;
    } catch {}

    const session = await loadSession(ctx, sessionToken);
    if (session.type === "resident" && session.residentId) {
        const resident = await ctx.db.get(session.residentId);
        if (resident && resident.condoId === condoId && resident.isActive !== false) {
            return;
        }
    }
    throw new Error("Forbidden");
}

function escapeHtml(input: string): string {
    return input
        .split("&")
        .join("&amp;")
        .split("<")
        .join("&lt;")
        .split(">")
        .join("&gt;")
        .split('"')
        .join("&quot;")
        .split("'")
        .join("&#039;");
}

async function sha256Hex(value: string): Promise<string> {
    const data = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
}

function formatDateTime(timestamp: number): string {
    return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
    }).format(new Date(timestamp));
}

function buildFinalReportHtml(params: {
    condoName: string;
    minuteTitle: string;
    minuteSummary: string | null;
    publishedAt: number;
    closesAt: number;
    closedAt: number;
    source: "manual" | "automatic";
    totals: {
        totalUnits: number;
        totalVotes: number;
        agree: number;
        disagree: number;
        agreePct: number;
        participationPct: number;
    };
    votes: Array<{
        unitCode: string | null;
        unitBlock: string | null;
        residentName: string | null;
        residentRole: string | null;
        choice: "agree" | "disagree";
        comment: string | null;
        createdAt: number;
    }>;
    snapshotHash: string;
    generatedAt: number;
}): string {
    const sourceLabel = params.source === "manual" ? "Fechamento manual" : "Fechamento automático";
    const voteRows = params.votes
        .map((vote) => {
            const choiceLabel = vote.choice === "agree" ? "Concorda" : "Discorda";
            const unitLabel = [vote.unitBlock ? `Bloco ${vote.unitBlock}` : null, vote.unitCode]
                .filter(Boolean)
                .join(" - ");
            return `
              <tr>
                <td>${escapeHtml(unitLabel || "-")}</td>
                <td>${escapeHtml(vote.residentName || "-")}</td>
                <td>${escapeHtml(vote.residentRole || "-")}</td>
                <td>${escapeHtml(choiceLabel)}</td>
                <td>${escapeHtml(vote.comment || "-")}</td>
                <td>${escapeHtml(formatDateTime(vote.createdAt))}</td>
              </tr>
            `.trim();
        })
        .join("\n");

    return `
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Relatório Final - ${escapeHtml(params.minuteTitle)}</title>
    <style>
      body { font-family: Arial, sans-serif; color: #111827; margin: 24px; }
      h1 { margin: 0 0 8px 0; font-size: 22px; }
      h2 { margin: 24px 0 8px 0; font-size: 16px; }
      p, li, td, th { font-size: 13px; line-height: 1.4; }
      .muted { color: #6b7280; }
      .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 16px; }
      .card { border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; }
      th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; vertical-align: top; }
      th { background: #f9fafb; }
      .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #e5e7eb; }
    </style>
  </head>
  <body>
    <h1>Relatório Final de Encerramento de Ata</h1>
    <p class="muted">${escapeHtml(params.condoName)} • ${escapeHtml(params.minuteTitle)}</p>

    <div class="card">
      <div class="grid">
        <div><strong>Publicado em:</strong> ${escapeHtml(formatDateTime(params.publishedAt))}</div>
        <div><strong>Prazo de votação:</strong> ${escapeHtml(formatDateTime(params.closesAt))}</div>
        <div><strong>Encerrado em:</strong> ${escapeHtml(formatDateTime(params.closedAt))}</div>
        <div><strong>Origem:</strong> ${escapeHtml(sourceLabel)}</div>
      </div>
      <p><strong>Resumo:</strong> ${escapeHtml(params.minuteSummary || "Sem resumo informado.")}</p>
    </div>

    <h2>Resultado consolidado</h2>
    <div class="card">
      <ul>
        <li><strong>Unidades no condomínio:</strong> ${params.totals.totalUnits}</li>
        <li><strong>Total de votos:</strong> ${params.totals.totalVotes}</li>
        <li><strong>Concorda:</strong> ${params.totals.agree} (${params.totals.agreePct}%)</li>
        <li><strong>Discorda:</strong> ${params.totals.disagree}</li>
        <li><strong>Participação:</strong> ${params.totals.participationPct}%</li>
      </ul>
    </div>

    <h2>Votos registrados</h2>
    <table>
      <thead>
        <tr>
          <th>Unidade</th>
          <th>Morador</th>
          <th>Função</th>
          <th>Voto</th>
          <th>Comentário</th>
          <th>Registrado em</th>
        </tr>
      </thead>
      <tbody>
        ${voteRows || `<tr><td colspan="6">Nenhum voto registrado.</td></tr>`}
      </tbody>
    </table>

    <div class="footer muted">
      <div><strong>Gerado em:</strong> ${escapeHtml(formatDateTime(params.generatedAt))}</div>
      <div><strong>Hash do snapshot:</strong> ${escapeHtml(params.snapshotHash)}</div>
    </div>
  </body>
</html>
    `.trim();
}

async function buildFinalReportPdf(params: {
    condoName: string;
    minuteTitle: string;
    minuteSummary: string | null;
    publishedAt: number;
    closesAt: number;
    closedAt: number;
    source: "manual" | "automatic";
    totals: {
        totalUnits: number;
        totalVotes: number;
        agree: number;
        disagree: number;
        agreePct: number;
        participationPct: number;
    };
    votes: Array<{
        unitCode: string | null;
        unitBlock: string | null;
        residentName: string | null;
        residentRole: string | null;
        choice: "agree" | "disagree";
        comment: string | null;
        createdAt: number;
    }>;
    snapshotHash: string;
    generatedAt: number;
}) {
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595, 842]); // A4 portrait
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    const drawLine = (text: string, y: number, isBold = false, size = 10) => {
        page.drawText(text, {
            x: 36,
            y,
            size,
            font: isBold ? bold : font,
            color: rgb(0.07, 0.09, 0.12),
            maxWidth: 520,
        });
    };

    let y = 800;
    drawLine("Relatório Final de Encerramento de Ata", y, true, 15);
    y -= 20;
    drawLine(`${params.condoName} • ${params.minuteTitle}`, y, false, 11);
    y -= 20;
    drawLine(`Publicado em: ${formatDateTime(params.publishedAt)}`, y);
    y -= 14;
    drawLine(`Prazo de votação: ${formatDateTime(params.closesAt)}`, y);
    y -= 14;
    drawLine(`Encerrado em: ${formatDateTime(params.closedAt)}`, y);
    y -= 14;
    drawLine(`Origem: ${params.source === "manual" ? "Fechamento manual" : "Fechamento automático"}`, y);
    y -= 18;
    drawLine(`Resumo: ${params.minuteSummary ?? "Sem resumo informado."}`, y);

    y -= 24;
    drawLine("Resultado consolidado", y, true, 12);
    y -= 16;
    drawLine(`Unidades no condomínio: ${params.totals.totalUnits}`, y);
    y -= 14;
    drawLine(`Total de votos: ${params.totals.totalVotes}`, y);
    y -= 14;
    drawLine(`Concorda: ${params.totals.agree} (${params.totals.agreePct}%)`, y);
    y -= 14;
    drawLine(`Discorda: ${params.totals.disagree}`, y);
    y -= 14;
    drawLine(`Participação: ${params.totals.participationPct}%`, y);

    y -= 24;
    drawLine("Votos registrados", y, true, 12);
    y -= 16;
    const votesToPrint = params.votes.slice(0, 20);
    if (votesToPrint.length === 0) {
        drawLine("Nenhum voto registrado.", y);
        y -= 14;
    } else {
        for (const vote of votesToPrint) {
            const unitLabel = [vote.unitBlock ? `B${vote.unitBlock}` : null, vote.unitCode].filter(Boolean).join("-");
            const choice = vote.choice === "agree" ? "Concorda" : "Discorda";
            drawLine(
                `${unitLabel || "-"} | ${vote.residentName ?? "-"} | ${choice} | ${formatDateTime(vote.createdAt)}`,
                y,
            );
            y -= 13;
            if (y < 64) break;
        }
    }

    if (params.votes.length > votesToPrint.length && y > 64) {
        drawLine(`... (${params.votes.length - votesToPrint.length} votos adicionais no snapshot JSON)`, y);
        y -= 14;
    }

    y -= 10;
    drawLine(`Gerado em: ${formatDateTime(params.generatedAt)}`, y);
    y -= 14;
    drawLine(`Hash do snapshot: ${params.snapshotHash}`, y);

    return await pdf.save();
}

async function generateFinalReport(
    ctx: any,
    minuteId: any,
    source: "manual" | "automatic",
) {
    const minute = await ctx.db.get(minuteId);
    if (!minute) return;

    const existing = await ctx.db
        .query("minuteFinalReports")
        .withIndex("byMinute", (q: any) => q.eq("minuteId", minuteId))
        .unique();
    if (existing) return existing._id;

    const condo = await ctx.db.get(minute.condoId);
    const votes = await ctx.db
        .query("votes")
        .withIndex("byMinute", (q: any) => q.eq("minuteId", minuteId))
        .collect();
    const units = await ctx.db
        .query("units")
        .withIndex("byCondo", (q: any) => q.eq("condoId", minute.condoId))
        .collect();

    const residentIds = Array.from(new Set(votes.map((vote: any) => String(vote.residentId))));
    const unitIds = Array.from(new Set(votes.map((vote: any) => String(vote.unitId))));
    const residents = await Promise.all(residentIds.map((id) => ctx.db.get(id)));
    const voteUnits = await Promise.all(unitIds.map((id) => ctx.db.get(id)));
    const residentMap = new Map(residents.filter(Boolean).map((resident: any) => [String(resident._id), resident]));
    const unitMap = new Map(voteUnits.filter(Boolean).map((unit: any) => [String(unit._id), unit]));

    const agree = votes.filter((vote: any) => vote.choice === "agree").length;
    const totalVotes = votes.length;
    const disagree = totalVotes - agree;
    const agreePct = totalVotes > 0 ? Math.round((agree / totalVotes) * 100) : 0;
    const participationPct = units.length > 0 ? Math.round((totalVotes / units.length) * 100) : 0;
    const closedAt = minute.updatedAt ?? Date.now();
    const generatedAt = Date.now();

    const votesDetailed = votes
        .slice()
        .sort((a: any, b: any) => a.createdAt - b.createdAt)
        .map((vote: any) => {
            const resident = residentMap.get(String(vote.residentId));
            const unit = unitMap.get(String(vote.unitId));
            return {
                voteId: vote._id,
                unitId: vote.unitId,
                unitCode: unit?.code ?? null,
                unitBlock: unit?.block ?? null,
                residentId: vote.residentId,
                residentName: resident?.name ?? null,
                residentRole: resident?.role ?? null,
                choice: vote.choice as "agree" | "disagree",
                comment: vote.comment ?? null,
                createdAt: vote.createdAt,
            };
        });

    const snapshot = {
        minute: {
            id: minute._id,
            condoId: minute.condoId,
            title: minute.title,
            summary: minute.summary ?? null,
            publishedAt: minute.publishedAt,
            closesAt: minute.closesAt,
            closedAt,
            status: minute.status,
        },
        condo: {
            id: minute.condoId,
            name: condo?.name ?? "Condomínio",
            subdomain: condo?.subdomain ?? null,
        },
        totals: {
            totalUnits: units.length,
            totalVotes,
            agree,
            disagree,
            agreePct,
            participationPct,
        },
        votes: votesDetailed,
        source,
        generatedAt,
    };
    const snapshotJson = JSON.stringify(snapshot);
    const snapshotHash = await sha256Hex(snapshotJson);

    const htmlContent = buildFinalReportHtml({
        condoName: condo?.name ?? "Condomínio",
        minuteTitle: minute.title,
        minuteSummary: minute.summary ?? null,
        publishedAt: minute.publishedAt,
        closesAt: minute.closesAt,
        closedAt,
        source,
        totals: snapshot.totals,
        votes: votesDetailed.map((vote: any) => ({
            unitCode: vote.unitCode,
            unitBlock: vote.unitBlock,
            residentName: vote.residentName,
            residentRole: vote.residentRole,
            choice: vote.choice,
            comment: vote.comment,
            createdAt: vote.createdAt,
        })),
        snapshotHash,
        generatedAt,
    });
    const reportId = await ctx.db.insert("minuteFinalReports", {
        minuteId,
        condoId: minute.condoId,
        source,
        generatedAt,
        closedAt,
        snapshotHash,
        snapshot,
        htmlContent,
        reportStorageId: undefined,
        reportDocumentId: undefined,
        createdAt: generatedAt,
        updatedAt: generatedAt,
    });

    await ctx.scheduler.runAfter(0, internal.minutes.ensureFinalReportPdf, { minuteId });

    await recordAdminAuditEvent(ctx, {
        action: "minute.final_report.generated",
        actor: { type: "system", id: "minutes" },
        entityType: "minuteFinalReport",
        entityId: String(reportId),
        condoId: minute.condoId,
        metadata: {
            minuteId: String(minuteId),
            source,
            totalVotes,
            totalUnits: units.length,
            snapshotHash,
        },
    });

    return reportId;
}

export const publish = mutation({
    args: {
        sessionToken: v.optional(v.string()),
        condoId: v.id("condos"),
        title: v.string(),
        summary: v.optional(v.string()),
        documentId: v.id("documents"),
        closesAt: v.number(),
        createdBy: v.id("residents"),
    },
    handler: async (ctx, a) => {
        const now = Date.now();
        if (a.closesAt <= now) throw new Error("closesAt must be future");
        const actor = await requireMinuteWriteAccess(ctx, a.sessionToken, a.condoId);

        const document = await ctx.db.get(a.documentId);
        if (!document) {
            throw new Error("Document not found");
        }

        const condoIdString = a.condoId.toString();
        if (document.orgId !== condoIdString) {
            throw new Error("DOCUMENT_ORG_MISMATCH");
        }

        const author = await ctx.db.get(a.createdBy);
        if (!author || author.condoId !== a.condoId || author.isActive === false) {
            throw new Error("Invalid author for condo");
        }

        const usageGate = await ensureCanCreateAssembly(ctx, a.condoId);

        const minuteId = await ctx.db.insert("minutes", {
            condoId: a.condoId,
            title: a.title,
            summary: a.summary,
            pdfUrl: undefined,
            documentId: a.documentId,
            publishedAt: now,
            closesAt: a.closesAt,
            status: "open",
            createdBy: a.createdBy,
            reminderD2Scheduled: false,
            reminderD4Scheduled: false,
            closeScheduled: false,
            createdAt: now,
            updatedAt: now,
        });

        const d2 = now + 2 * 24 * 3600 * 1000;
        const d4 = now + 4 * 24 * 3600 * 1000;

        await ctx.scheduler.runAt(d2, internal.notifications.sendReminder, {
            minuteId,
            template: "reminderD2",
        });
        await ctx.scheduler.runAt(d4, internal.notifications.sendReminder, {
            minuteId,
            template: "reminderD4",
        });
        await ctx.scheduler.runAt(a.closesAt, internal.minutes.internalClose, { minuteId });

        await ctx.db.patch(minuteId, {
            reminderD2Scheduled: true,
            reminderD4Scheduled: true,
            closeScheduled: true,
        });

        await ctx.scheduler.runAfter(0, internal.notifications.sendMinutePublishedEmail, {
            minuteId,
        });

        await incrementAssemblyUsage(ctx, a.condoId, usageGate.bucketKey);

        await recordAdminAuditEvent(ctx, {
            action: "minute.published",
            actor: { type: actor.actorType, id: actor.actorId },
            condoId: a.condoId,
            entityType: "minute",
            entityId: String(minuteId),
            metadata: { title: a.title, closesAt: a.closesAt },
        });

        return minuteId;
    },
});

export const list = query({
    args: {
        sessionToken: v.optional(v.string()),
        condoId: v.id("condos"),
        status: v.optional(MinuteStatus),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, a) => {
        await requireMinuteReadAccess(ctx, a.sessionToken, a.condoId);
        let items = await ctx.db
            .query("minutes")
            .withIndex("byCondo", (q) => q.eq("condoId", a.condoId))
            .take(1000);
        if (a.status) items = items.filter((m) => m.status === a.status);
        items.sort((x, y) => y.publishedAt - x.publishedAt);
        return a.limit ? items.slice(0, a.limit) : items;
    },
});

export const get = query({
    args: { sessionToken: v.optional(v.string()), minuteId: v.id("minutes") },
    handler: async (ctx, { sessionToken, minuteId }) => {
        const m = await ctx.db.get(minuteId);
        if (!m) throw new Error("Minute not found");
        await requireMinuteReadAccess(ctx, sessionToken, m.condoId);
        return m;
    },
});

export const close = mutation({
    args: { sessionToken: v.optional(v.string()), minuteId: v.id("minutes") },
    handler: async (ctx, { sessionToken, minuteId }) => {
        const m = await ctx.db.get(minuteId);
        if (!m) throw new Error("Minute not found");
        const actor = await requireMinuteWriteAccess(ctx, sessionToken, m.condoId);
        if (m.status === "closed") {
            await generateFinalReport(ctx, minuteId, "manual");
            return true;
        }
        const closedAt = Date.now();
        await ctx.db.patch(minuteId, { status: "closed", updatedAt: closedAt });
        await generateFinalReport(ctx, minuteId, "manual");
        await ctx.scheduler.runAfter(0, internal.notifications.sendMinuteClosedEmail, {
            minuteId,
        });
        await recordAdminAuditEvent(ctx, {
            action: "minute.closed",
            actor: { type: actor.actorType, id: actor.actorId },
            condoId: m.condoId,
            entityType: "minute",
            entityId: String(minuteId),
        });
        return true;
    },
});

export const internalClose = internalMutation({
    args: { minuteId: v.id("minutes") },
    handler: async (ctx, { minuteId }) => {
        const m = await ctx.db.get(minuteId);
        if (!m) return;
        if (m.status !== "closed") {
            await ctx.db.patch(minuteId, { status: "closed", updatedAt: Date.now() });
        }
        await generateFinalReport(ctx, minuteId, "automatic");
        await ctx.scheduler.runAfter(0, internal.notifications.sendMinuteClosedEmail, {
            minuteId,
        });
    },
});

export const getFinalReport = query({
    args: { sessionToken: v.optional(v.string()), minuteId: v.id("minutes") },
    handler: async (ctx, { sessionToken, minuteId }) => {
        const minute = await ctx.db.get(minuteId);
        if (!minute) {
            return null;
        }
        await requireMinuteReadAccess(ctx, sessionToken, minute.condoId);
        const report = await ctx.db
            .query("minuteFinalReports")
            .withIndex("byMinute", (q: any) => q.eq("minuteId", minuteId))
            .unique();
        return report ?? null;
    },
});

export const ensureFinalReportPdf = internalAction({
    args: { minuteId: v.id("minutes") },
    handler: async (ctx, { minuteId }) => {
        const report = await ctx.runQuery(api.minutes.getFinalReport, { minuteId }) as any;
        if (!report) return null;
        if (report.reportStorageId && report.reportDocumentId) {
            return { storageId: report.reportStorageId, documentId: report.reportDocumentId };
        }

        const snapshot = report.snapshot as any;
        if (!snapshot?.minute || !snapshot?.totals) return null;

        const pdfBytes = await buildFinalReportPdf({
            condoName: snapshot.condo?.name ?? "Condomínio",
            minuteTitle: snapshot.minute.title ?? "Ata",
            minuteSummary: snapshot.minute.summary ?? null,
            publishedAt: snapshot.minute.publishedAt ?? Date.now(),
            closesAt: snapshot.minute.closesAt ?? Date.now(),
            closedAt: snapshot.minute.closedAt ?? Date.now(),
            source: (snapshot.source ?? "automatic") as "manual" | "automatic",
            totals: snapshot.totals,
            votes: (snapshot.votes ?? []).map((vote: any) => ({
                unitCode: vote.unitCode ?? null,
                unitBlock: vote.unitBlock ?? null,
                residentName: vote.residentName ?? null,
                residentRole: vote.residentRole ?? null,
                choice: vote.choice === "agree" ? "agree" : "disagree",
                comment: vote.comment ?? null,
                createdAt: vote.createdAt ?? Date.now(),
            })),
            snapshotHash: report.snapshotHash,
            generatedAt: report.generatedAt ?? Date.now(),
        });
        const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });
        const storageId = await ctx.storage.store(pdfBlob);

        const attachResult = await ctx.runMutation(internal.minutes.attachFinalReportPdf, {
            minuteId,
            reportStorageId: String(storageId),
            size: pdfBytes.byteLength,
        }) as any;

        return {
            storageId: String(storageId),
            documentId: attachResult?.documentId ?? null,
        };
    },
});

export const attachFinalReportPdf = internalMutation({
    args: {
        minuteId: v.id("minutes"),
        reportStorageId: v.string(),
        size: v.number(),
    },
    handler: async (ctx, { minuteId, reportStorageId, size }) => {
        const report = await ctx.db
            .query("minuteFinalReports")
            .withIndex("byMinute", (q: any) => q.eq("minuteId", minuteId))
            .unique();
        if (!report) return null;
        if (report.reportDocumentId && report.reportStorageId) {
            return { documentId: report.reportDocumentId, storageId: report.reportStorageId };
        }

        const minute = await ctx.db.get(minuteId);
        const now = Date.now();
        const documentId = await ctx.db.insert("documents", {
            title: `Relatório Final - ${minute?.title ?? "Ata"}`,
            orgId: String(report.condoId),
            assemblyId: String(minuteId),
            storageId: reportStorageId,
            contentType: "application/pdf",
            size,
            sha256: report.snapshotHash,
            visibility: "org",
            allowedRoles: ["admin", "syndic", "manager", "resident", "council"],
            allowedUserIds: [],
            createdByUserId: "system:minutes",
            createdAt: now,
            lastViewedAt: undefined,
            viewCount: 0,
        });
        await ctx.db.insert("documentEvents", {
            documentId,
            orgId: String(report.condoId),
            userId: "system:minutes",
            event: "upload",
            createdAt: now,
        });
        await ctx.db.patch(report._id, {
            reportStorageId,
            reportDocumentId: documentId,
            updatedAt: now,
        });

        await recordAdminAuditEvent(ctx, {
            action: "minute.final_report.pdf_attached",
            actor: { type: "system", id: "minutes" },
            entityType: "minuteFinalReport",
            entityId: String(report._id),
            condoId: report.condoId,
            metadata: {
                minuteId: String(minuteId),
                reportStorageId,
                reportDocumentId: String(documentId),
            },
        });

        return { documentId, storageId: reportStorageId };
    },
});
