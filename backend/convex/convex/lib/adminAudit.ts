export type AdminAuditActor = {
  type: "platform" | "resident" | "system" | "unknown";
  id?: string;
};

export type AdminAuditEventInput = {
  action: string;
  actor: AdminAuditActor;
  entityType: string;
  entityId?: string;
  condoId?: any;
  before?: unknown;
  after?: unknown;
  metadata?: unknown;
};

export async function recordAdminAuditEvent(ctx: any, event: AdminAuditEventInput) {
  const actorKey = `${event.actor.type}:${event.actor.id ?? "unknown"}`;
  await ctx.db.insert("adminAuditEvents", {
    action: event.action,
    actorType: event.actor.type,
    actorId: event.actor.id,
    actorKey,
    condoId: event.condoId,
    entityType: event.entityType,
    entityId: event.entityId,
    before: event.before,
    after: event.after,
    metadata: event.metadata,
    createdAt: Date.now(),
  });
}
