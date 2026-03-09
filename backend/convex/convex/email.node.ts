'use node';

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { sendEmail as sendEmailHelper, DEFAULT_FROM } from "./lib/email";

export const send = internalAction({
  args: {
    to: v.union(v.string(), v.array(v.string())),
    subject: v.string(),
    html: v.optional(v.string()),
    text: v.optional(v.string()),
    template: v.optional(
      v.object({
        id: v.string(),
        variables: v.optional(v.any()),
      }),
    ),
    from: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const { from = DEFAULT_FROM, ...rest } = args;
    await sendEmailHelper({ ...rest, from });
  },
});
