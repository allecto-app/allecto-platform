"use node";

import { internalAction } from "../../_generated/server";
import { v } from "convex/values";
import type { Id } from "../../_generated/dataModel";
import { api } from "../../_generated/api";

export const refreshTenantUsage = internalAction({
  args: { tenantId: v.id("condos") },
  handler: async (ctx, { tenantId }) => {
    await ctx.runQuery(api.billing.entitlements, { tenantId });
  },
});
