'use node';

import { v } from "convex/values";
import type { Id } from "../../_generated/dataModel";
import { requireCondoRole, requirePlatformRole } from "../../guards";
import { sha256 } from "../../_secu";

export type TierKey = "essencial" | "plus" | "pro";

export const tierKeyValues = ["essencial", "plus", "pro"] as const;
export const tierKeyValidator = v.union(
  v.literal("essencial"),
  v.literal("plus"),
  v.literal("pro"),
);

export const PRICE_ENV_KEYS: Record<TierKey, string> = {
  essencial: "PRICE_ID_ESSENCIAL_MONTHLY",
  plus: "PRICE_ID_PLUS_MONTHLY",
  pro: "PRICE_ID_PRO_MONTHLY",
};

const PRICE_VALUE_TO_TIER = new Map<string, TierKey>(
  Object.entries(PRICE_ENV_KEYS)
    .map(([tier, envKey]) => {
      const value = process.env[envKey];
      return value ? ([value, tier as TierKey] as const) : null;
    })
    .filter(Boolean) as Array<[string, TierKey]>,
);

export const RESIDENT_BILLING_ROLES = ["syndic", "manager"] as const;
export const PLATFORM_BILLING_ROLES = ["super_admin", "support", "ops"] as const;

export function getPriceIdFromEnv(tierKey: TierKey): string {
  const envKey = PRICE_ENV_KEYS[tierKey];
  const value = process.env[envKey];
  if (!value) {
    throw new Error(`Missing required environment variable ${envKey}`);
  }
  return value;
}

export function ensureAbsoluteUrl(label: string, value: string) {
  try {
    const url = new URL(value);
    if (!url.protocol.startsWith("http")) {
      throw new Error(`${label} must be HTTP/HTTPS`);
    }
    return url.toString();
  } catch (error) {
    throw new Error(`${label} is invalid: ${(error as Error).message}`);
  }
}

type ResolveOptions = {
  sessionToken?: string | null;
  onboardingToken?: string | null;
  expectedTier?: TierKey;
};

export type BillingContext =
  | {
      email: string;
      source: "resident" | "platform";
    }
  | {
      email: string;
      source: "onboarding";
      onboardingSessionId: Id<"onboardingSessions">;
      tierKey: TierKey;
    };

export async function resolveBillingContext(
  ctx: any,
  tenantId: Id<"condos">,
  options: ResolveOptions,
): Promise<BillingContext> {
  const { sessionToken, onboardingToken, expectedTier } = options;

  if (onboardingToken) {
    const tokenHash = await sha256(onboardingToken);
    const onboardingSession = await ctx.db
      .query("onboardingSessions")
      .withIndex("byTokenHash", (q: any) => q.eq("tokenHash", tokenHash))
      .first();
    if (
      !onboardingSession ||
      onboardingSession.tenantId !== tenantId ||
      onboardingSession.status === "expired" ||
      onboardingSession.status === "completed"
    ) {
      throw new Error("INVALID_ONBOARDING_TOKEN");
    }
    const now = Date.now();
    if (onboardingSession.expiresAt < now) {
      await ctx.db.patch(onboardingSession._id, { status: "expired" });
      throw new Error("ONBOARDING_TOKEN_EXPIRED");
    }
    if (
      expectedTier &&
      onboardingSession.tierKey !== expectedTier
    ) {
      throw new Error("ONBOARDING_TIER_MISMATCH");
    }
    return {
      email: onboardingSession.email,
      source: "onboarding",
      onboardingSessionId: onboardingSession._id,
      tierKey: onboardingSession.tierKey,
    };
  }

  if (!sessionToken) {
    throw new Error("UNAUTHENTICATED");
  }

  try {
    const result = await requireCondoRole(
      ctx,
      tenantId as unknown as string,
      [...RESIDENT_BILLING_ROLES, ...PLATFORM_BILLING_ROLES],
      sessionToken,
    );
    if (result?.resident?.email) {
      return { email: result.resident.email, source: "resident" };
    }
    if (result?.user?.email) {
      return { email: result.user.email, source: "platform" };
    }
  } catch {
    // fall through to platform roles
  }

  const { user } = await requirePlatformRole(
    ctx,
    [...PLATFORM_BILLING_ROLES],
    sessionToken,
  );
  if (!user?.email) {
    throw new Error("Platform user email missing");
  }
  return { email: user.email, source: "platform" };
}

export async function markOnboardingSessionStatus(
  ctx: any,
  sessionId: Id<"onboardingSessions">,
  status: "checkout_started" | "completed" | "expired",
) {
  await ctx.db.patch(sessionId, {
    status,
    updatedAt: Date.now(),
  });
}

export function tierFromPriceId(priceId: string | null | undefined): TierKey | null {
  if (!priceId) return null;
  return PRICE_VALUE_TO_TIER.get(priceId) ?? null;
}

export function normalizeTierKey(value: string | null | undefined): TierKey | null {
  if (!value) return null;
  const normalized = value.toLowerCase().trim();
  return (tierKeyValues as readonly string[]).includes(normalized) ? (normalized as TierKey) : null;
}

export async function markPendingOnboardingCompleted(ctx: any, tenantId: Id<"condos">) {
  const sessions = await ctx.db
    .query("onboardingSessions")
    .withIndex("byTenant", (q: any) => q.eq("tenantId", tenantId))
    .collect();
  for (const session of sessions) {
    if (session.status === "completed" || session.status === "expired") continue;
    await markOnboardingSessionStatus(ctx, session._id, "completed");
  }
}

export async function updateTenantBillingState(
  ctx: any,
  tenantId: Id<"condos">,
  status: string | undefined,
  priceId: string | null,
  tierHint?: string | null,
) {
  const updates: Record<string, unknown> = {
    billingStatus: status ?? "unknown",
    updatedAt: Date.now(),
  };
  const hint = normalizeTierKey(tierHint ?? undefined);
  const tier = tierFromPriceId(priceId) ?? hint;
  const defaultTier: TierKey | null =
    status === "active" || status === "trialing" ? "essencial" : null;
  if (tier ?? defaultTier) {
    updates.billingTier = (tier ?? defaultTier) as TierKey;
  }
  await ctx.db.patch(tenantId, updates);
  if (status === "active" || status === "trialing") {
    await markPendingOnboardingCompleted(ctx, tenantId);
  }
}
