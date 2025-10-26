import type { ActionCtx, MutationCtx, QueryCtx } from "convex/server";
import type { GenericId } from "convex/values";
import { loadSession } from "../guards";

export type Actor = {
  userId: string;
  orgId: string;
  roles: string[];
};

type AnyCtx = QueryCtx | MutationCtx | ActionCtx;

type RequireActorOptions = {
  sessionToken?: string | null;
  orgIdHint?: string | null;
};

function normalizeId(id: GenericId<string> | undefined | null): string | null {
  return id ? id.toString() : null;
}

export async function requireActor(ctx: AnyCtx, options?: RequireActorOptions): Promise<Actor> {
  const identity = await ctx.auth.getUserIdentity();
  if (identity) {
    const orgId =
      (identity as any).orgId ||
      (identity as any).condoId ||
      (identity as any).organizationId ||
      options?.orgIdHint ||
      "demo-org";
    const roles = Array.isArray((identity as any).roles)
      ? ((identity as any).roles as string[])
      : ["admin"];
    return {
      userId: identity.subject,
      orgId,
      roles,
    };
  }

  const sessionToken = options?.sessionToken;
  if (!sessionToken) {
    throw new Error("UNAUTHENTICATED");
  }

  const session = await loadSession(ctx, sessionToken);

  const orgId = options?.orgIdHint ?? normalizeId(session.condoId);

  if (!orgId) {
    throw new Error("ORG_UNKNOWN");
  }

  const userId =
    normalizeId(session.residentId) ||
    normalizeId(session.platformUserId) ||
    session.tokenDigest ||
    sessionToken;

  const roles = Array.isArray(session.roles) ? session.roles : [];

  return {
    userId,
    orgId,
    roles,
  };
}

export function canReadDoc(actor: Actor, doc: { orgId: string; visibility: string; allowedUserIds?: string[]; allowedRoles?: string[]; }): boolean {
  if (doc.orgId !== actor.orgId) return false;
  if (doc.visibility === "org") return true;
  if (doc.visibility === "assembly") {
    return true;
  }
  if (doc.visibility === "private") {
    if (doc.allowedUserIds?.includes(actor.userId)) return true;
    if (doc.allowedRoles?.some((role) => actor.roles.includes(role))) return true;
  }
  return false;
}

export function canUpload(actor: Actor): boolean {
  return (
    actor.roles.includes("admin") ||
    actor.roles.includes("syndic") ||
    actor.roles.includes("super_admin") ||
    actor.roles.includes("ops")
  );
}
