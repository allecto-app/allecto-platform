'use node';

import { v } from "convex/values";
import type { Id } from "../../_generated/dataModel";
import { requireCondoRole, requirePlatformRole } from "../../guards";

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

export async function resolveBillingEmail(
  ctx: any,
  tenantId: Id<"condos">,
  sessionToken?: string | null,
) {
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
      return { email: result.resident.email, source: "resident" as const };
    }
    if (result?.user?.email) {
      return { email: result.user.email, source: "platform" as const };
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
  return { email: user.email, source: "platform" as const };
}
